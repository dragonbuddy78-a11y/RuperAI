import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { PlanType } from "@/generated/prisma";
import { requireAuth } from "@/lib/auth";
import {
  addCredits,
  deductCreditsAtomic,
  getPlanLimits,
  logUsage,
} from "@/lib/credits";
import { hasFeature } from "@/lib/plans";
import { checkAiRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { generateWithCustomPrompt } from "@/lib/ai/client";
import { prepareMonetizationSource } from "@/lib/ai/content-summarizer";
import { getActiveBrandVoiceProfile } from "@/lib/brand-voice";
import {
  buildMonetizationPrompt,
  MONETIZATION_MAX_OUTPUT_TOKENS,
} from "@/lib/ai/monetization-prompts";
import {
  MONETIZATION_TYPES,
  MONETIZATION_CREDIT_COSTS,
  type MonetizationType,
  type MonetizeBulkResponse,
  type MonetizeOutput,
  type MonetizeResponse,
} from "@/types";

const monetizationContextSchema = z.object({
  productName: z.string().max(200).optional(),
  targetAudience: z.string().max(500).optional(),
  pricePoint: z.string().max(100).optional(),
  niche: z.string().max(200).optional(),
  existingOffer: z.string().max(1000).optional(),
  goals: z.array(z.string().max(200)).max(10).optional(),
});

const monetizeRequestSchema = z
  .object({
    content: z.string().min(100, "Content must be at least 100 characters"),
    type: z.enum(MONETIZATION_TYPES).optional(),
    types: z.array(z.enum(MONETIZATION_TYPES)).min(1).max(7).optional(),
    context: monetizationContextSchema.optional(),
  })
  .refine((data) => data.type || (data.types && data.types.length > 0), {
    message: "Provide either type or types",
    path: ["types"],
  });

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateOneType(
  type: MonetizationType,
  preparedSource: string,
  context: z.infer<typeof monetizationContextSchema> | undefined,
  plan: PlanType,
  brandVoiceProfile: string | null,
): Promise<MonetizeOutput> {
  const { systemPrompt, userPrompt } = buildMonetizationPrompt(
    type,
    preparedSource,
    context,
    brandVoiceProfile,
  );

  const result = await generateWithCustomPrompt(systemPrompt, userPrompt, {
    temperature: 0.7,
    maxTokens: MONETIZATION_MAX_OUTPUT_TOKENS[type],
    plan,
  });

  if (!result.output) {
    throw new Error(`Generation failed for ${type}`);
  }

  return {
    type,
    output: result.output,
    creditsUsed: MONETIZATION_CREDIT_COSTS[type],
    tokensUsed: result.tokensUsed,
    model: result.model,
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return jsonError("Authentication required", 401, "UNAUTHORIZED");
    }

    const userId = session.user.id;
    const plan = session.user.plan as PlanType;
    const limits = getPlanLimits(plan);

    if (!hasFeature(plan, "monetization")) {
      return jsonError(
        "Monetization Studio requires a Pro plan or higher",
        403,
        "PLAN_LIMIT",
      );
    }

    const rateLimitResult = checkAiRateLimit(userId);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rateLimitResult) },
      );
    }

    const body = await request.json();
    const parsed = monetizeRequestSchema.parse(body);

    if (parsed.content.length > limits.maxContentLength) {
      return jsonError(
        `Content exceeds maximum length of ${limits.maxContentLength} characters`,
        400,
        "CONTENT_TOO_LONG",
      );
    }

    const typesToGenerate: MonetizationType[] = parsed.types?.length
      ? [...new Set(parsed.types)]
      : [parsed.type!];

    const creditsRequired = typesToGenerate.reduce(
      (sum, t) => sum + MONETIZATION_CREDIT_COSTS[t],
      0,
    );

    const { creditsRemaining } = await deductCreditsAtomic(
      userId,
      creditsRequired,
      `Monetization bulk: ${typesToGenerate.join(", ")}`,
      { types: typesToGenerate },
    );

    const [{ source: preparedSource, summarized }, brandVoiceProfile] =
      await Promise.all([
        prepareMonetizationSource(parsed.content, plan),
        getActiveBrandVoiceProfile(userId),
      ]);

    // Single type — keep backward-compatible response shape
    if (typesToGenerate.length === 1) {
      try {
        const output = await generateOneType(
          typesToGenerate[0],
          preparedSource,
          parsed.context,
          plan,
          brandVoiceProfile,
        );

        await logUsage(userId, `monetize:${output.type}`, output.creditsUsed, {
          type: output.type,
          tokensUsed: output.tokensUsed,
          model: output.model,
          context: parsed.context,
          summarized,
          sourceChars: parsed.content.length,
        });

        const response: MonetizeResponse = {
          ...output,
          creditsRemaining,
        };

        return NextResponse.json(response, {
          headers: rateLimitHeaders(rateLimitResult),
        });
      } catch {
        await addCredits(
          userId,
          creditsRequired,
          "REFUND",
          "Monetization generation failed",
          { types: typesToGenerate },
        );
        return jsonError("Monetization generation failed", 500, "GENERATION_FAILED");
      }
    }

    // Bulk generation — sequential to avoid Groq TPM burst limits
    const outputs: MonetizeOutput[] = [];
    const failedTypes: MonetizationType[] = [];

    for (let i = 0; i < typesToGenerate.length; i++) {
      const type = typesToGenerate[i];
      if (i > 0) {
        await delay(800);
      }
      try {
        const output = await generateOneType(
          type,
          preparedSource,
          parsed.context,
          plan,
          brandVoiceProfile,
        );
        outputs.push(output);
      } catch (error) {
        failedTypes.push(type);
        console.error(`[Monetize] Failed ${type}:`, error);
      }
    }

    if (outputs.length === 0) {
      await addCredits(
        userId,
        creditsRequired,
        "REFUND",
        "Bulk monetization generation failed",
        { types: typesToGenerate },
      );
      return jsonError("All asset generations failed", 500, "GENERATION_FAILED");
    }

    const actualCreditsUsed = outputs.reduce((sum, o) => sum + o.creditsUsed, 0);
    const refundAmount = creditsRequired - actualCreditsUsed;

    let finalCreditsRemaining = creditsRemaining;
    if (refundAmount > 0) {
      const refund = await addCredits(
        userId,
        refundAmount,
        "REFUND",
        "Partial bulk monetization refund",
        { failedTypes },
      );
      finalCreditsRemaining = refund.balance;
    }

    await Promise.all(
      outputs.map((output) =>
        logUsage(userId, `monetize:${output.type}`, output.creditsUsed, {
          type: output.type,
          tokensUsed: output.tokensUsed,
          model: output.model,
          context: parsed.context,
          bulk: true,
          summarized,
          sourceChars: parsed.content.length,
        }),
      ),
    );

    const response: MonetizeBulkResponse = {
      outputs,
      creditsUsed: actualCreditsUsed,
      creditsRemaining: finalCreditsRemaining,
      ...(failedTypes.length > 0 ? { failedTypes } : {}),
    };

    return NextResponse.json(response, {
      headers: rateLimitHeaders(rateLimitResult),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
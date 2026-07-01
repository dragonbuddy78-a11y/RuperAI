import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { OutputFormat, PlanType } from "@/generated/prisma";
import { requireAuth } from "@/lib/auth";
import {
  countWords,
  deductCreditsAtomic,
  getCreditCost,
  getPlanLimits,
  logUsage,
} from "@/lib/credits";
import { canUseFormat, getMaxFormatsPerRepurpose } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { checkAiRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { generateContent, generateContentStream } from "@/lib/ai/client";
import { getActiveBrandVoiceProfile } from "@/lib/brand-voice";
import {
  CONTENT_FORMATS,
  SOURCE_TYPE_MAP,
  TONE_OPTIONS,
  LENGTH_OPTIONS,
  toOutputFormat,
  type ContentFormat,
  type GenerateResponse,
  type StreamEvent,
} from "@/types";

const generationOptionsSchema = z.object({
  tone: z.enum(TONE_OPTIONS).optional(),
  audience: z.string().max(500).optional(),
  keywords: z.array(z.string().max(100)).max(20).optional(),
  length: z.enum(LENGTH_OPTIONS).optional(),
  variants: z.number().int().min(1).max(5).optional(),
  cta: z.string().max(300).optional(),
  hashtags: z.boolean().optional(),
  emojis: z.boolean().optional(),
  brandVoice: z.string().max(1000).optional(),
  language: z.string().max(10).optional(),
});

const generateRequestSchema = z.object({
  content: z.string().min(50, "Content must be at least 50 characters"),
  sourceType: z
    .enum(["text", "url", "youtube", "pdf", "file", "audio"])
    .optional()
    .default("text"),
  sourceUrl: z.string().url().optional(),
  title: z.string().max(500).optional(),
  formats: z
    .array(z.enum(CONTENT_FORMATS))
    .min(1, "Select at least one format")
    .max(15),
  options: generationOptionsSchema.optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return jsonError("Authentication required", 401, "UNAUTHORIZED");
    }

    const userId = session.user.id;
    const plan = session.user.plan as PlanType;
    const limits = getPlanLimits(plan);

    const rateLimitResult = checkAiRateLimit(userId);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rateLimitResult) },
      );
    }

    const body = await request.json();
    const parsed = generateRequestSchema.parse(body);
    const stream = request.nextUrl.searchParams.get("stream") === "true";

    const brandVoiceProfile = await getActiveBrandVoiceProfile(userId);
    const generationOptions = {
      ...parsed.options,
      ...(brandVoiceProfile
        ? {
            brandVoice:
              parsed.options?.brandVoice?.trim() || brandVoiceProfile,
          }
        : {}),
    };

    const maxFormats = getMaxFormatsPerRepurpose(plan);
    if (parsed.formats.length > maxFormats) {
      return jsonError(
        `Your plan allows up to ${maxFormats} formats per request`,
        403,
        "PLAN_LIMIT",
      );
    }

    if (parsed.content.length > limits.maxContentLength) {
      return jsonError(
        `Content exceeds maximum length of ${limits.maxContentLength} characters`,
        400,
        "CONTENT_TOO_LONG",
      );
    }

    for (const format of parsed.formats) {
      const outputFormat = toOutputFormat(format);
      if (!canUseFormat(plan, outputFormat)) {
        return jsonError(
          `Format "${format}" requires a Pro plan or higher`,
          403,
          "PLAN_LIMIT",
        );
      }
    }

    if (stream && !limits.streamingAccess) {
      return jsonError(
        "Streaming is not available on your plan. Upgrade to enable.",
        403,
        "PLAN_LIMIT",
      );
    }

    const outputFormats = parsed.formats.map(toOutputFormat);
    const creditsRequired = getCreditCost(parsed.formats);
    const { creditsRemaining } = await deductCreditsAtomic(
      userId,
      creditsRequired,
      `Generate ${parsed.formats.length} format(s)`,
      { formats: parsed.formats },
    );

    const contentRecord = await prisma.content.create({
      data: {
        userId,
        title:
          parsed.title ??
          `Repurposed ${new Date().toISOString().split("T")[0]}`,
        sourceType: SOURCE_TYPE_MAP[parsed.sourceType],
        sourceUrl: parsed.sourceUrl,
        rawContent: parsed.content,
        wordCount: countWords(parsed.content),
        status: "PROCESSING",
        creditsUsed: creditsRequired,
        metadata: generationOptions
          ? JSON.parse(JSON.stringify(generationOptions))
          : undefined,
      },
    });

    if (stream) {
      return handleStreamingGeneration({
        userId,
        contentId: contentRecord.id,
        content: parsed.content,
        formats: parsed.formats,
        outputFormats,
        options: generationOptions,
        creditsRequired,
        creditsRemaining,
        rateLimitResult,
        plan,
      });
    }

    const results = await Promise.allSettled(
      parsed.formats.map(async (format, index) => {
        const outputFormat = outputFormats[index];
        const result = await generateContent({
          format,
          content: parsed.content,
          options: generationOptions,
          plan,
        });

        const formatCost = getCreditCost([format]);

        const saved = await prisma.repurposedOutput.create({
          data: {
            contentId: contentRecord.id,
            userId,
            format: outputFormat,
            output: result.output,
            status: "COMPLETED",
            creditsUsed: formatCost,
            metadata: {
              options: generationOptions ?? {},
              tokensUsed: result.tokensUsed,
              model: result.model,
            },
          },
        });

        return {
          id: saved.id,
          format,
          output: result.output,
          tokensUsed: result.tokensUsed,
          model: result.model,
        };
      }),
    );

    const outputs = results
      .filter(
        (r): r is PromiseFulfilledResult<{
          id: string;
          format: ContentFormat;
          output: string;
          tokensUsed: number;
          model: string;
        }> => r.status === "fulfilled",
      )
      .map((r) => r.value);

    const failures = results.filter((r) => r.status === "rejected");
    if (failures.length > 0) {
      console.error(
        "[Generate] Partial failures:",
        failures.map((f) => (f.status === "rejected" ? f.reason : null)),
      );
    }

    if (outputs.length === 0) {
      await prisma.content.update({
        where: { id: contentRecord.id },
        data: { status: "FAILED" },
      });
      return jsonError("All format generations failed", 500, "GENERATION_FAILED");
    }

    const actualCreditsUsed = getCreditCost(outputs.map((o) => o.format));
    if (actualCreditsUsed < creditsRequired) {
      const { addCredits } = await import("@/lib/credits");
      await addCredits(
        userId,
        creditsRequired - actualCreditsUsed,
        "REFUND",
        "Partial generation refund",
        { contentId: contentRecord.id },
      );
    }

    await prisma.content.update({
      where: { id: contentRecord.id },
      data: {
        status: failures.length > 0 ? "COMPLETED" : "COMPLETED",
        creditsUsed: actualCreditsUsed,
      },
    });

    await logUsage(userId, "generate", actualCreditsUsed, {
      contentId: contentRecord.id,
      formats: outputs.map((o) => o.format),
      failedFormats: failures.length,
    });

    const response: GenerateResponse = {
      contentId: contentRecord.id,
      outputs,
      creditsUsed: actualCreditsUsed,
      creditsRemaining:
        actualCreditsUsed < creditsRequired
          ? creditsRemaining + (creditsRequired - actualCreditsUsed)
          : creditsRemaining,
    };

    return NextResponse.json(response, {
      headers: rateLimitHeaders(rateLimitResult),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function handleStreamingGeneration(params: {
  userId: string;
  contentId: string;
  content: string;
  formats: ContentFormat[];
  outputFormats: OutputFormat[];
  options?: z.infer<typeof generationOptionsSchema>;
  creditsRequired: number;
  creditsRemaining: number;
  rateLimitResult: ReturnType<typeof checkAiRateLimit>;
  plan: PlanType;
}) {
  const encoder = new TextEncoder();

  const readable = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      const completedFormats: ContentFormat[] = [];

      try {
        await Promise.all(
          params.formats.map(async (format, index) => {
            const outputFormat = params.outputFormats[index];
            send({ type: "format_start", format });

            try {
              const result = await generateContentStream({
                format,
                content: params.content,
                options: params.options,
                plan: params.plan,
                onChunk: () => {},
              });

              const formatCost = getCreditCost([format]);

              await prisma.repurposedOutput.create({
                data: {
                  contentId: params.contentId,
                  userId: params.userId,
                  format: outputFormat,
                  output: result.output,
                  status: "COMPLETED",
                  creditsUsed: formatCost,
                  metadata: {
                    options: params.options ?? {},
                    tokensUsed: result.tokensUsed,
                    model: result.model,
                    streaming: true,
                  },
                },
              });

              completedFormats.push(format);
              send({ type: "format_complete", format, output: result.output });
            } catch (error) {
              send({
                type: "format_error",
                format,
                error: error instanceof Error ? error.message : "Generation failed",
              });
            }
          }),
        );

        const actualCreditsUsed = getCreditCost(completedFormats);
        if (actualCreditsUsed < params.creditsRequired) {
          const { addCredits } = await import("@/lib/credits");
          await addCredits(
            params.userId,
            params.creditsRequired - actualCreditsUsed,
            "REFUND",
            "Partial streaming generation refund",
            { contentId: params.contentId },
          );
        }

        await prisma.content.update({
          where: { id: params.contentId },
          data: {
            status: completedFormats.length > 0 ? "COMPLETED" : "FAILED",
            creditsUsed: actualCreditsUsed,
          },
        });

        await logUsage(params.userId, "generate", actualCreditsUsed, {
          contentId: params.contentId,
          formats: completedFormats,
          streaming: true,
        });

        send({
          type: "done",
          contentId: params.contentId,
          creditsUsed: actualCreditsUsed,
          creditsRemaining:
            actualCreditsUsed < params.creditsRequired
              ? params.creditsRemaining + (params.creditsRequired - actualCreditsUsed)
              : params.creditsRemaining,
        });
      } catch (error) {
        send({
          type: "error",
          error: error instanceof Error ? error.message : "Stream failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      ...rateLimitHeaders(params.rateLimitResult),
    },
  });
}
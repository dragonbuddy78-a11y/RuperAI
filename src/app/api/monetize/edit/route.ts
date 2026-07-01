import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { generateWithCustomPrompt } from "@/lib/ai/client";
import { truncateForMonetization } from "@/lib/ai/content-summarizer";
import {
  buildMonetizationEditSystemPrompt,
  buildMonetizationEditUserPrompt,
} from "@/lib/ai/monetization-prompts";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import { hasFeature } from "@/lib/plans";
import { checkAiRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { MONETIZATION_TYPES } from "@/types";

const editRequestSchema = z.object({
  content: z.string().min(10, "Content is too short to edit"),
  type: z.enum(MONETIZATION_TYPES),
  instruction: z.string().min(2).max(500),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .max(20)
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return jsonError("Authentication required", 401, "UNAUTHORIZED");
    }

    if (!hasFeature(session.user.plan, "monetization")) {
      return jsonError(
        "Monetization Studio requires a Pro plan or higher",
        403,
        "PLAN_LIMIT",
      );
    }

    const rateLimitResult = checkAiRateLimit(session.user.id);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rateLimitResult) },
      );
    }

    const body = await request.json();
    const parsed = editRequestSchema.parse(body);

    let conversationContext = "";
    if (parsed.history?.length) {
      conversationContext =
        "\n\nPREVIOUS EDIT HISTORY:\n" +
        parsed.history
          .slice(-6)
          .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
          .join("\n");
    }

    const trimmedContent = truncateForMonetization(parsed.content, 12_000);

    const systemPrompt = buildMonetizationEditSystemPrompt(parsed.type);
    const userPrompt =
      buildMonetizationEditUserPrompt(trimmedContent, parsed.instruction) +
      conversationContext;

    const result = await generateWithCustomPrompt(systemPrompt, userPrompt, {
      temperature: 0.6,
      maxTokens: 4096,
      plan: session.user.plan,
    });

    if (!result.output?.trim()) {
      return jsonError("AI returned empty content", 500, "EDIT_FAILED");
    }

    return NextResponse.json(
      {
        output: result.output.trim(),
        tokensUsed: result.tokensUsed,
        model: result.model,
      },
      { headers: rateLimitHeaders(rateLimitResult) },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { generateWithCustomPrompt } from "@/lib/ai/client";
import { buildEditSystemPrompt, buildEditUserPrompt } from "@/lib/ai/prompts";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAiRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { CONTENT_FORMATS } from "@/types";

const editRequestSchema = z.object({
  content: z.string().min(10, "Content is too short to edit"),
  format: z.enum(CONTENT_FORMATS),
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
  outputId: z.string().cuid().optional(),
  contentId: z.string().cuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return jsonError("Authentication required", 401, "UNAUTHORIZED");
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

    const systemPrompt = buildEditSystemPrompt(parsed.format);
    const userPrompt =
      buildEditUserPrompt(parsed.content, parsed.instruction) +
      conversationContext;

    const result = await generateWithCustomPrompt(systemPrompt, userPrompt, {
      temperature: 0.6,
      maxTokens: 4096,
      plan: session.user.plan,
    });

    if (!result.output?.trim()) {
      return jsonError("AI returned empty content", 500, "EDIT_FAILED");
    }

    const revised = result.output.trim();

    if (parsed.outputId) {
      const existing = await prisma.repurposedOutput.findFirst({
        where: {
          id: parsed.outputId,
          userId: session.user.id,
        },
      });

      if (existing) {
        await prisma.repurposedOutput.update({
          where: { id: parsed.outputId },
          data: {
            output: revised,
            metadata: {
              ...(typeof existing.metadata === "object" && existing.metadata
                ? (existing.metadata as Record<string, unknown>)
                : {}),
              lastEdit: parsed.instruction,
              editedAt: new Date().toISOString(),
            },
          },
        });
      }
    }

    return NextResponse.json(
      {
        output: revised,
        tokensUsed: result.tokensUsed,
        model: result.model,
      },
      { headers: rateLimitHeaders(rateLimitResult) },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
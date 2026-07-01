import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { extractContent } from "@/lib/ai/extractors";
import type { ExtractedContent } from "@/types";

const extractRequestSchema = z.object({
  sourceType: z.enum(["url", "youtube"]),
  input: z.string().min(1, "URL or input is required"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return jsonError("Authentication required", 401, "UNAUTHORIZED");
    }

    const rateLimitResult = rateLimit(`extract:${session.user.id}`, 20);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rateLimitResult) },
      );
    }

    const body = await request.json();
    const parsed = extractRequestSchema.parse(body);

    if (parsed.sourceType === "url") {
      try {
        new URL(parsed.input);
      } catch {
        return jsonError("Invalid URL format", 400, "INVALID_URL");
      }
    }

    const extracted: ExtractedContent = await extractContent(
      parsed.sourceType,
      parsed.input,
    );

    return NextResponse.json(extracted, {
      headers: rateLimitHeaders(rateLimitResult),
    });
  } catch (error) {
    if (error instanceof Error) {
      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("Could not extract") ||
        error.message.includes("No transcript") ||
        error.message.includes("Invalid")
      ) {
        return jsonError(error.message, 422, "EXTRACTION_FAILED");
      }
    }
    return handleApiError(error);
  }
}
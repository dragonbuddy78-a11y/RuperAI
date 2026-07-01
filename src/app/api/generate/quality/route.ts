import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { checkContentQuality } from "@/lib/ai/quality-check";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import { checkAiRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { CONTENT_FORMATS } from "@/types";

const qualityRequestSchema = z.object({
  content: z.string().min(10),
  format: z.enum(CONTENT_FORMATS),
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
    const parsed = qualityRequestSchema.parse(body);

    const report = await checkContentQuality(
      parsed.content,
      parsed.format,
      session.user.plan,
    );

    return NextResponse.json(
      { report },
      { headers: rateLimitHeaders(rateLimitResult) },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
import { NextRequest, NextResponse } from "next/server";

import { transcribeAudio, isAudioMimeType } from "@/lib/ai/audio-transcriber";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import { addCredits, deductCreditsAtomic } from "@/lib/credits";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import type { PlanType } from "@/generated/prisma";

const MAX_AUDIO_SIZE = 25 * 1024 * 1024;
const TRANSCRIBE_CREDIT_COST = 3;

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return jsonError("Authentication required", 401, "UNAUTHORIZED");
    }

    const rateLimitResult = rateLimit(`transcribe:${session.user.id}`, 10);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rateLimitResult) },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return jsonError("No audio file provided", 400, "MISSING_FILE");
    }

    if (!isAudioMimeType(file.type)) {
      return jsonError(
        "Unsupported audio format. Use MP3, WAV, M4A, WebM, or OGG.",
        400,
        "INVALID_FILE_TYPE",
      );
    }

    if (file.size > MAX_AUDIO_SIZE) {
      return jsonError(
        `Audio exceeds maximum size of ${MAX_AUDIO_SIZE / 1024 / 1024}MB`,
        400,
        "FILE_TOO_LARGE",
      );
    }

    const plan = session.user.plan as PlanType;
    const { creditsRemaining } = await deductCreditsAtomic(
      session.user.id,
      TRANSCRIBE_CREDIT_COST,
      "Audio transcription",
      { fileName: file.name, size: file.size },
    );

    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      const { text, wordCount } = await transcribeAudio(
        buffer,
        file.type,
        file.name,
      );

      const title = file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ");

      return NextResponse.json(
        {
          title,
          content: text,
          wordCount,
          sourceType: "audio",
          creditsUsed: TRANSCRIBE_CREDIT_COST,
          creditsRemaining,
        },
        { headers: rateLimitHeaders(rateLimitResult) },
      );
    } catch (transcribeError) {
      await addCredits(
        session.user.id,
        TRANSCRIBE_CREDIT_COST,
        "REFUND",
        "Audio transcription failed",
      );
      throw transcribeError instanceof Error
        ? transcribeError
        : new Error("Transcription failed");
    }
  } catch (error) {
    return handleApiError(error);
  }
}
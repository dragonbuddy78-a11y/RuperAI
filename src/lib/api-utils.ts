import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { InsufficientCreditsError } from "@/lib/credits";
import type { ApiError } from "@/types";

export function jsonError(
  message: string,
  status = 400,
  code?: string,
  details?: unknown
) {
  const body: ApiError = { error: message };
  if (code) body.code = code;
  if (details) body.details = details;
  return NextResponse.json(body, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError("Validation failed", 400, "VALIDATION_ERROR", error.flatten());
  }

  if (error instanceof InsufficientCreditsError) {
    return jsonError(error.message, 402, "INSUFFICIENT_CREDITS");
  }

  if (error instanceof Error) {
    if (error.message.includes("rate limit") || error.message.includes("429")) {
      return jsonError("AI service rate limit exceeded. Try again shortly.", 429, "AI_RATE_LIMIT");
    }
    console.error("[API Error]", error.message);
    return jsonError(error.message, 500, "INTERNAL_ERROR");
  }

  console.error("[API Error]", error);
  return jsonError("An unexpected error occurred", 500, "INTERNAL_ERROR");
}
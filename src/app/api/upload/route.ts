import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAuth } from "@/lib/auth";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { extractFromPdf } from "@/lib/ai/extractors";
import type { UploadResponse } from "@/types";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return jsonError("Authentication required", 401, "UNAUTHORIZED");
    }

    const rateLimitResult = rateLimit(`upload:${session.user.id}`, 10);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429, headers: rateLimitHeaders(rateLimitResult) },
      );
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return jsonError(
        "File upload is not configured. Set BLOB_READ_WRITE_TOKEN.",
        503,
        "SERVICE_UNAVAILABLE",
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return jsonError("No file provided", 400, "MISSING_FILE");
    }

    if (file.size > MAX_FILE_SIZE) {
      return jsonError(
        `File exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        400,
        "FILE_TOO_LARGE",
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return jsonError(
        `File type not allowed. Accepted: PDF, TXT, Markdown, DOC, DOCX`,
        400,
        "INVALID_FILE_TYPE",
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const pathname = `uploads/${session.user.id}/${Date.now()}-${sanitizedName}`;

    const blob = await put(pathname, buffer, {
      access: "public",
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    const response: UploadResponse = {
      url: blob.url,
      pathname: blob.pathname,
      contentType: file.type,
      size: file.size,
    };

    if (file.type === "application/pdf") {
      try {
        const extracted = await extractFromPdf(buffer);
        response.extractedContent = extracted.content;
        response.wordCount = extracted.wordCount;
      } catch (error) {
        console.error("[Upload] PDF extraction failed:", error);
      }
    } else if (file.type === "text/plain" || file.type === "text/markdown") {
      const text = buffer.toString("utf-8");
      response.extractedContent = text;
      response.wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    }

    return NextResponse.json(response, {
      headers: rateLimitHeaders(rateLimitResult),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
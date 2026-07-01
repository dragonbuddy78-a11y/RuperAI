import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { fromOutputFormat } from "@/types";
import type { OutputFormat } from "@/generated/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    if (!session) {
      return jsonError("Authentication required", 401, "UNAUTHORIZED");
    }

    const { id } = await params;

    const content = await prisma.content.findFirst({
      where: { id, userId: session.user.id },
      include: {
        outputs: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            format: true,
            output: true,
            status: true,
            creditsUsed: true,
            createdAt: true,
            metadata: true,
          },
        },
      },
    });

    if (!content) {
      return jsonError("Content not found", 404, "NOT_FOUND");
    }

    return NextResponse.json({
      id: content.id,
      title: content.title,
      sourceType: content.sourceType,
      sourceUrl: content.sourceUrl,
      rawContent: content.rawContent,
      wordCount: content.wordCount,
      creditsUsed: content.creditsUsed,
      status: content.status,
      metadata: content.metadata,
      createdAt: content.createdAt.toISOString(),
      updatedAt: content.updatedAt.toISOString(),
      outputs: content.outputs.map((o) => ({
        id: o.id,
        format: o.format,
        formatKey:
          fromOutputFormat(o.format as OutputFormat) ?? o.format.toLowerCase(),
        output: o.output,
        status: o.status,
        creditsUsed: o.creditsUsed,
        createdAt: o.createdAt.toISOString(),
        metadata: o.metadata,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
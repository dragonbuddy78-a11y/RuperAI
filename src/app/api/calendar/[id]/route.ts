import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { handleApiError, jsonError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(50000).optional(),
  platform: z.string().min(1).max(50).optional(),
  scheduledAt: z.string().datetime().optional(),
  status: z.enum(["SCHEDULED", "POSTED", "SKIPPED"]).optional(),
  notes: z.string().max(500).optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    if (!session) {
      return jsonError("Authentication required", 401, "UNAUTHORIZED");
    }

    const { id } = await params;
    const existing = await prisma.scheduledPost.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return jsonError("Scheduled post not found", 404, "NOT_FOUND");
    }

    const body = await request.json();
    const parsed = patchSchema.parse(body);

    const post = await prisma.scheduledPost.update({
      where: { id },
      data: {
        ...(parsed.title !== undefined ? { title: parsed.title } : {}),
        ...(parsed.content !== undefined ? { content: parsed.content } : {}),
        ...(parsed.platform !== undefined ? { platform: parsed.platform } : {}),
        ...(parsed.scheduledAt !== undefined
          ? { scheduledAt: new Date(parsed.scheduledAt) }
          : {}),
        ...(parsed.status !== undefined ? { status: parsed.status } : {}),
        ...(parsed.notes !== undefined ? { notes: parsed.notes } : {}),
      },
    });

    return NextResponse.json({
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        platform: post.platform,
        scheduledAt: post.scheduledAt.toISOString(),
        status: post.status,
        notes: post.notes,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAuth();
    if (!session) {
      return jsonError("Authentication required", 401, "UNAUTHORIZED");
    }

    const { id } = await params;
    const existing = await prisma.scheduledPost.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return jsonError("Scheduled post not found", 404, "NOT_FOUND");
    }

    await prisma.scheduledPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
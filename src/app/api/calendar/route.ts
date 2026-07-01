import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { handleApiError, jsonError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50000),
  platform: z.string().min(1).max(50),
  scheduledAt: z.string().datetime(),
  outputId: z.string().optional(),
  contentId: z.string().optional(),
  notes: z.string().max(500).optional(),
});

const bulkSchema = z.object({
  posts: z.array(createSchema).min(1).max(30),
});

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return jsonError("Authentication required", 401, "UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const status = searchParams.get("status");

    const where: {
      userId: string;
      scheduledAt?: { gte: Date; lte: Date };
      status?: "SCHEDULED" | "POSTED" | "SKIPPED";
    } = { userId: session.user.id };

    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [year, mon] = month.split("-").map(Number);
      const start = new Date(year, mon - 1, 1);
      const end = new Date(year, mon, 0, 23, 59, 59, 999);
      where.scheduledAt = { gte: start, lte: end };
    }

    if (status === "SCHEDULED" || status === "POSTED" || status === "SKIPPED") {
      where.status = status;
    }

    const posts = await prisma.scheduledPost.findMany({
      where,
      orderBy: { scheduledAt: "asc" },
    });

    return NextResponse.json({
      posts: posts.map((p) => ({
        id: p.id,
        title: p.title,
        content: p.content,
        platform: p.platform,
        scheduledAt: p.scheduledAt.toISOString(),
        status: p.status,
        outputId: p.outputId,
        contentId: p.contentId,
        notes: p.notes,
        createdAt: p.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return jsonError("Authentication required", 401, "UNAUTHORIZED");
    }

    const body = await request.json();

    if (body.posts) {
      const parsed = bulkSchema.parse(body);
      const created = await prisma.$transaction(
        parsed.posts.map((post) =>
          prisma.scheduledPost.create({
            data: {
              userId: session.user.id,
              title: post.title,
              content: post.content,
              platform: post.platform,
              scheduledAt: new Date(post.scheduledAt),
              outputId: post.outputId,
              contentId: post.contentId,
              notes: post.notes,
            },
          }),
        ),
      );

      return NextResponse.json({
        posts: created.map((p) => ({
          id: p.id,
          title: p.title,
          platform: p.platform,
          scheduledAt: p.scheduledAt.toISOString(),
          status: p.status,
        })),
        count: created.length,
      });
    }

    const parsed = createSchema.parse(body);
    const post = await prisma.scheduledPost.create({
      data: {
        userId: session.user.id,
        title: parsed.title,
        content: parsed.content,
        platform: parsed.platform,
        scheduledAt: new Date(parsed.scheduledAt),
        outputId: parsed.outputId,
        contentId: parsed.contentId,
        notes: parsed.notes,
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
        outputId: post.outputId,
        contentId: post.contentId,
        notes: post.notes,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
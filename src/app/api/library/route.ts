import { NextRequest, NextResponse } from "next/server";

import { requireAuth } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userId = session.user.id;
    const search = request.nextUrl.searchParams.get("search")?.trim() ?? "";
    const page = Math.max(1, Number(request.nextUrl.searchParams.get("page") ?? 1));
    const limit = Math.min(
      50,
      Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 12)),
    );
    const skip = (page - 1) * limit;

    const where = {
      userId,
      status: "COMPLETED" as const,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { rawContent: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          sourceType: true,
          sourceUrl: true,
          wordCount: true,
          creditsUsed: true,
          status: true,
          createdAt: true,
          _count: { select: { outputs: true } },
        },
      }),
      prisma.content.count({ where }),
    ]);

    return NextResponse.json({
      items: items.map((item) => ({
        id: item.id,
        title: item.title,
        sourceType: item.sourceType,
        sourceUrl: item.sourceUrl,
        wordCount: item.wordCount,
        formatCount: item._count.outputs,
        creditsUsed: item.creditsUsed,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
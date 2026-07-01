import { NextRequest, NextResponse } from "next/server";

import { handleApiError, jsonError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { contentListSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return jsonError("Authentication required", 401, "UNAUTHORIZED");
    }

    const { searchParams } = new URL(request.url);
    const parsed = contentListSchema.safeParse({
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      sourceType: searchParams.get("sourceType") ?? undefined,
    });

    if (!parsed.success) {
      return jsonError("Invalid query parameters", 400, "VALIDATION_ERROR", parsed.error.flatten());
    }

    const { page, limit, status, sourceType } = parsed.data;
    const skip = (page - 1) * limit;

    const where = {
      userId: session.user.id,
      ...(status ? { status } : {}),
      ...(sourceType ? { sourceType } : {}),
    };

    const [contents, total] = await Promise.all([
      prisma.content.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          sourceType: true,
          wordCount: true,
          status: true,
          rawContent: true,
          summary: true,
          createdAt: true,
          _count: { select: { outputs: true } },
        },
      }),
      prisma.content.count({ where }),
    ]);

    return NextResponse.json({
      contents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
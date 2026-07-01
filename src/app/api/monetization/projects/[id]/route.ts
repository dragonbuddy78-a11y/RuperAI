import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma";

import { handleApiError, jsonError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MONETIZATION_TYPES } from "@/types";

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(2000).optional().nullable(),
  niche: z.string().max(200).optional().nullable(),
  targetAudience: z.string().max(500).optional().nullable(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
});

const saveAssetsSchema = z.object({
  assets: z
    .array(
      z.object({
        type: z.enum(MONETIZATION_TYPES),
        title: z.string().max(200).optional(),
        output: z.string().min(1),
        context: z.record(z.string(), z.unknown()).optional(),
        creditsUsed: z.number().int().min(0).optional(),
      }),
    )
    .min(1)
    .max(10),
});

async function getOwnedProject(userId: string, id: string) {
  return prisma.monetizationProject.findFirst({
    where: { id, userId },
    include: {
      assets: { orderBy: { createdAt: "desc" } },
    },
  });
}

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
    const project = await getOwnedProject(session.user.id, id);

    if (!project) {
      return jsonError("Project not found", 404, "NOT_FOUND");
    }

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        niche: project.niche,
        targetAudience: project.targetAudience,
        status: project.status,
        assets: project.assets.map((a) => ({
          id: a.id,
          type: a.type,
          title: a.title,
          output: a.output,
          context: a.context,
          creditsUsed: a.creditsUsed,
          createdAt: a.createdAt.toISOString(),
        })),
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

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
    const existing = await prisma.monetizationProject.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return jsonError("Project not found", 404, "NOT_FOUND");
    }

    const body = await request.json();

    if (body.assets) {
      const parsed = saveAssetsSchema.parse(body);
      const assets = await prisma.$transaction(
        parsed.assets.map((asset) =>
          prisma.monetizationAsset.create({
            data: {
              projectId: id,
              userId: session.user.id,
              type: asset.type,
              title: asset.title,
              output: asset.output,
              context: asset.context as Prisma.InputJsonValue | undefined,
              creditsUsed: asset.creditsUsed ?? 0,
            },
          }),
        ),
      );

      await prisma.monetizationProject.update({
        where: { id },
        data: { updatedAt: new Date() },
      });

      return NextResponse.json({
        assets: assets.map((a) => ({
          id: a.id,
          type: a.type,
          title: a.title,
          output: a.output,
          creditsUsed: a.creditsUsed,
          createdAt: a.createdAt.toISOString(),
        })),
      });
    }

    const parsed = patchSchema.parse(body);
    const project = await prisma.monetizationProject.update({
      where: { id },
      data: {
        ...(parsed.name !== undefined ? { name: parsed.name } : {}),
        ...(parsed.description !== undefined
          ? { description: parsed.description }
          : {}),
        ...(parsed.niche !== undefined ? { niche: parsed.niche } : {}),
        ...(parsed.targetAudience !== undefined
          ? { targetAudience: parsed.targetAudience }
          : {}),
        ...(parsed.status !== undefined ? { status: parsed.status } : {}),
      },
    });

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        status: project.status,
        updatedAt: project.updatedAt.toISOString(),
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
    const existing = await prisma.monetizationProject.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return jsonError("Project not found", 404, "NOT_FOUND");
    }

    await prisma.monetizationProject.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
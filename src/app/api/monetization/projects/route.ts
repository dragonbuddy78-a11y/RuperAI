import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import type { PlanType } from "@/generated/prisma";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import {
  canCreateMonetizationProject,
  getMaxMonetizationProjects,
} from "@/lib/monetization-projects";
import { hasFeature } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  niche: z.string().max(200).optional(),
  targetAudience: z.string().max(500).optional(),
});

export async function GET() {
  try {
    const session = await requireAuth();
    if (!session) {
      return jsonError("Authentication required", 401, "UNAUTHORIZED");
    }

    const projects = await prisma.monetizationProject.findMany({
      where: { userId: session.user.id },
      include: {
        _count: { select: { assets: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        niche: p.niche,
        targetAudience: p.targetAudience,
        status: p.status,
        assetCount: p._count.assets,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
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

    const plan = session.user.plan as PlanType;
    if (!hasFeature(plan, "monetization")) {
      return jsonError(
        "Monetization projects require a paid plan",
        403,
        "PLAN_LIMIT",
      );
    }

    const allowed = await canCreateMonetizationProject(
      session.user.id,
      plan,
    );
    if (!allowed) {
      const max = getMaxMonetizationProjects(plan);
      return jsonError(
        `Project limit reached (${max} max on your plan)`,
        403,
        "PLAN_LIMIT",
      );
    }

    const body = await request.json();
    const parsed = createSchema.parse(body);

    const project = await prisma.monetizationProject.create({
      data: {
        userId: session.user.id,
        name: parsed.name,
        description: parsed.description,
        niche: parsed.niche,
        targetAudience: parsed.targetAudience,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        niche: project.niche,
        targetAudience: project.targetAudience,
        status: project.status,
        assetCount: 0,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
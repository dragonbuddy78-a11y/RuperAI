import { NextRequest, NextResponse } from "next/server";
import { subDays, startOfDay, format } from "date-fns";

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
    const section = request.nextUrl.searchParams.get("section");

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = subDays(startOfDay(now), 29);

    if (section === "activity") {
      const [contents, usageLogs] = await Promise.all([
        prisma.content.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            title: true,
            status: true,
            creditsUsed: true,
            createdAt: true,
            _count: { select: { outputs: true } },
          },
        }),
        prisma.usageLog.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            action: true,
            creditsUsed: true,
            createdAt: true,
            metadata: true,
          },
        }),
      ]);

      const activity = [
        ...contents.map((c) => ({
          id: c.id,
          type: "repurpose" as const,
          title: c.title,
          description: `${c._count.outputs} format${c._count.outputs !== 1 ? "s" : ""} generated`,
          status: c.status,
          creditsUsed: c.creditsUsed,
          createdAt: c.createdAt.toISOString(),
        })),
        ...usageLogs
          .filter((l) => l.action !== "generate")
          .map((l) => ({
            id: l.id,
            type: l.action as string,
            title: l.action.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase()),
            description: l.creditsUsed
              ? `${l.creditsUsed} credits used`
              : "Activity logged",
            status: "COMPLETED",
            creditsUsed: l.creditsUsed,
            createdAt: l.createdAt.toISOString(),
          })),
      ]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 10);

      return NextResponse.json({ activity });
    }

    if (section === "chart") {
      const contents = await prisma.content.findMany({
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo },
          status: "COMPLETED",
        },
        select: { createdAt: true },
      });

      const dayMap = new Map<string, number>();
      for (let i = 0; i < 30; i++) {
        const day = format(subDays(now, 29 - i), "MMM d");
        dayMap.set(day, 0);
      }

      for (const content of contents) {
        const day = format(content.createdAt, "MMM d");
        if (dayMap.has(day)) {
          dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
        }
      }

      const usageChart = Array.from(dayMap.entries()).map(([date, count]) => ({
        date,
        count,
      }));

      return NextResponse.json({ usageChart });
    }

    const [
      user,
      repurposesThisMonth,
      savedToLibrary,
      monetizationProjects,
      recentContents,
      usageLogs,
      chartContents,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true, name: true, plan: true },
      }),
      prisma.content.count({
        where: {
          userId,
          createdAt: { gte: monthStart },
          status: "COMPLETED",
        },
      }),
      prisma.content.count({
        where: { userId, status: "COMPLETED" },
      }),
      prisma.monetizationProject.count({ where: { userId } }),
      prisma.content.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          status: true,
          creditsUsed: true,
          createdAt: true,
          _count: { select: { outputs: true } },
        },
      }),
      prisma.usageLog.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          action: true,
          creditsUsed: true,
          createdAt: true,
        },
      }),
      prisma.content.findMany({
        where: {
          userId,
          createdAt: { gte: thirtyDaysAgo },
          status: "COMPLETED",
        },
        select: { createdAt: true },
      }),
    ]);

    const activity = [
      ...recentContents.map((c) => ({
        id: c.id,
        type: "repurpose" as const,
        title: c.title,
        description: `${c._count.outputs} format${c._count.outputs !== 1 ? "s" : ""} generated`,
        status: c.status,
        creditsUsed: c.creditsUsed,
        createdAt: c.createdAt.toISOString(),
      })),
      ...usageLogs
        .filter((l) => l.action !== "generate")
        .map((l) => ({
          id: l.id,
          type: l.action,
          title: l.action.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase()),
          description: l.creditsUsed
            ? `${l.creditsUsed} credits used`
            : "Activity logged",
          status: "COMPLETED",
          creditsUsed: l.creditsUsed,
          createdAt: l.createdAt.toISOString(),
        })),
    ]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, 10);

    const dayMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const day = format(subDays(now, 29 - i), "MMM d");
      dayMap.set(day, 0);
    }
    for (const content of chartContents) {
      const day = format(content.createdAt, "MMM d");
      if (dayMap.has(day)) {
        dayMap.set(day, (dayMap.get(day) ?? 0) + 1);
      }
    }
    const usageChart = Array.from(dayMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    return NextResponse.json({
      stats: {
        creditsRemaining: user?.credits ?? 0,
        repurposesThisMonth,
        savedToLibrary,
        monetizationProjects,
        plan: user?.plan ?? "FREE",
      },
      activity,
      usageChart,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
import { NextResponse } from "next/server";
import { subDays, startOfDay, format, differenceInWeeks } from "date-fns";

import { handleApiError, jsonError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import { formatToPlatform, getFormatLabel } from "@/lib/format-utils";
import { prisma } from "@/lib/prisma";
import { fromOutputFormat } from "@/types";

export async function GET() {
  try {
    const session = await requireAuth();
    if (!session) {
      return jsonError("Authentication required", 401, "UNAUTHORIZED");
    }

    const userId = session.user.id;
    const thirtyDaysAgo = subDays(new Date(), 30);

    const [outputs, usageLogs, creditTransactions, contents] = await Promise.all([
      prisma.repurposedOutput.findMany({
        where: { userId },
        select: {
          id: true,
          format: true,
          creditsUsed: true,
          createdAt: true,
          contentId: true,
          content: { select: { title: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.usageLog.findMany({
        where: { userId },
        select: { creditsUsed: true, createdAt: true, action: true },
      }),
      prisma.creditTransaction.findMany({
        where: { userId, type: "DEDUCTION" },
        select: { amount: true, createdAt: true },
      }),
      prisma.content.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          createdAt: true,
          _count: { select: { outputs: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
    ]);

    const totalRepurposes = outputs.length;
    const creditsUsed = Math.abs(
      creditTransactions.reduce((sum, tx) => sum + tx.amount, 0),
    );

    const formatCounts = new Map<string, number>();
    for (const output of outputs) {
      const snakeFormat =
        fromOutputFormat(output.format as Parameters<typeof fromOutputFormat>[0]) ??
        output.format.toLowerCase();
      formatCounts.set(snakeFormat, (formatCounts.get(snakeFormat) ?? 0) + 1);
    }

    let topFormat = "—";
    let topFormatCount = 0;
    for (const [format, count] of formatCounts.entries()) {
      if (count > topFormatCount) {
        topFormat = getFormatLabel(format);
        topFormatCount = count;
      }
    }

    const firstActivity = outputs[outputs.length - 1]?.createdAt ?? new Date();
    const weeksActive = Math.max(
      differenceInWeeks(new Date(), firstActivity),
      1,
    );
    const avgPerWeek = Math.round((totalRepurposes / weeksActive) * 10) / 10;

    const repurposesByDay = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i));
      repurposesByDay.set(format(day, "MMM d"), 0);
    }

    for (const output of outputs) {
      if (output.createdAt >= thirtyDaysAgo) {
        const key = format(startOfDay(output.createdAt), "MMM d");
        if (repurposesByDay.has(key)) {
          repurposesByDay.set(key, (repurposesByDay.get(key) ?? 0) + 1);
        }
      }
    }

    const repurposesOverTime = Array.from(repurposesByDay.entries()).map(
      ([date, count]) => ({ date, count }),
    );

    const formatBreakdown = Array.from(formatCounts.entries())
      .map(([format, count]) => ({
        format: getFormatLabel(format),
        count,
        value: count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const platformCounts = new Map<string, number>();
    for (const [format, count] of formatCounts.entries()) {
      const platform = formatToPlatform(format);
      platformCounts.set(platform, (platformCounts.get(platform) ?? 0) + count);
    }

    const platformUsage = Array.from(platformCounts.entries())
      .map(([platform, count]) => ({ platform, count }))
      .sort((a, b) => b.count - a.count);

    const contentInsights = contents
      .filter((c) => c._count.outputs > 0)
      .map((content) => {
        const contentOutputs = outputs.filter((o) => o.contentId === content.id);
        const formatSet = new Set(
          contentOutputs.map(
            (o) =>
              fromOutputFormat(o.format as Parameters<typeof fromOutputFormat>[0]) ??
              o.format,
          ),
        );
        const credits = contentOutputs.reduce((sum, o) => sum + o.creditsUsed, 0);

        return {
          id: content.id,
          title: content.title,
          outputCount: content._count.outputs,
          formats: Array.from(formatSet).map(getFormatLabel),
          creditsUsed: credits,
          lastRepurposed: contentOutputs[0]?.createdAt ?? content.createdAt,
        };
      })
      .slice(0, 20);

    const monetizationCount = usageLogs.filter((log) =>
      log.action.startsWith("monetize:"),
    ).length;

    return NextResponse.json({
      stats: {
        totalRepurposes,
        creditsUsed,
        topFormat,
        avgPerWeek,
        monetizationCount,
      },
      repurposesOverTime,
      formatBreakdown,
      platformUsage,
      contentInsights,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
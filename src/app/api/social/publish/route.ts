import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  getAyrshareProfileDetails,
  publishToAyrshare,
  isAyrshareConfigured,
} from "@/lib/ayrshare";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  formatToAyrsharePlatform,
  pickConnectedPlatform,
} from "@/lib/social-platforms";

const publishSchema = z.object({
  content: z.string().min(1).max(50000),
  format: z.string().optional(),
  platforms: z.array(z.string()).optional(),
  publishAll: z.boolean().optional(),
  scheduleDate: z.string().datetime().optional(),
  title: z.string().max(200).optional(),
  outputId: z.string().optional(),
  contentId: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return jsonError("Authentication required", 401, "UNAUTHORIZED");
    }

    if (!isAyrshareConfigured()) {
      return jsonError(
        "Social publishing is not configured yet.",
        503,
        "NOT_CONFIGURED",
      );
    }

    const body = publishSchema.parse(await request.json());

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { ayrshareProfileKey: true },
    });

    if (!user?.ayrshareProfileKey) {
      return jsonError(
        "Connect your social accounts in Settings first.",
        400,
        "NO_PROFILE",
      );
    }

    const profile = await getAyrshareProfileDetails(user.ayrshareProfileKey);
    const connected = profile.activeSocialAccounts ?? [];

    if (connected.length === 0) {
      return jsonError(
        "No social accounts linked yet. Connect them in Settings.",
        400,
        "NO_ACCOUNTS",
      );
    }

    let targetPlatforms: string[] = [];

    if (body.publishAll) {
      targetPlatforms = connected;
    } else if (body.platforms?.length) {
      targetPlatforms = body.platforms.filter((p) => connected.includes(p));
    } else if (body.format) {
      const mapped = pickConnectedPlatform(body.format, connected);
      if (mapped) targetPlatforms = [mapped];
    }

    if (targetPlatforms.length === 0) {
      return jsonError(
        "No matching connected account for this content format.",
        400,
        "NO_MATCHING_PLATFORM",
      );
    }

    const result = await publishToAyrshare(user.ayrshareProfileKey, {
      post: body.content,
      platforms: targetPlatforms,
      scheduleDate: body.scheduleDate,
      notes: body.notes,
    });

    const isScheduled = result.status === "scheduled" || Boolean(body.scheduleDate);
    const ayrsharePostId = result.id;

    if (body.scheduleDate || isScheduled) {
      const platformLabel =
        body.format && formatToAyrsharePlatform(body.format)
          ? body.format
          : targetPlatforms.join(",");

      await prisma.scheduledPost.create({
        data: {
          userId: session.user.id,
          title: body.title ?? "Scheduled social post",
          content: body.content,
          platform: platformLabel,
          scheduledAt: new Date(body.scheduleDate ?? result.scheduleDate ?? new Date()),
          status: isScheduled ? "SCHEDULED" : "POSTED",
          outputId: body.outputId,
          contentId: body.contentId,
          notes: body.notes,
          ayrsharePostId: ayrsharePostId ?? undefined,
        },
      });
    }

    return NextResponse.json({
      status: result.status,
      platforms: targetPlatforms,
      ayrsharePostId,
      postIds: result.postIds ?? [],
      errors: result.errors ?? [],
      scheduled: Boolean(body.scheduleDate),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
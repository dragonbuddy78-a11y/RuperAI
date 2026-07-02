import { NextRequest, NextResponse } from "next/server";

import {
  ensureAyrshareProfileForUser,
  generateAyrshareConnectUrl,
  isAyrshareConfigured,
} from "@/lib/ayrshare";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return jsonError("Authentication required", 401, "UNAUTHORIZED");
    }

    if (!isAyrshareConfigured()) {
      return jsonError(
        "Social publishing is not configured yet. Add Ayrshare API keys.",
        503,
        "NOT_CONFIGURED",
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        ayrshareProfileKey: true,
        ayrshareRefId: true,
      },
    });

    if (!user) {
      return jsonError("User not found", 404, "NOT_FOUND");
    }

    const profile = await ensureAyrshareProfileForUser(user);

    if (!user.ayrshareProfileKey) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          ayrshareProfileKey: profile.profileKey,
          ayrshareRefId: profile.refId,
        },
      });
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.AUTH_URL ??
      request.nextUrl.origin;
    const redirectUrl = `${appUrl}/settings?social=connected`;

    const jwt = await generateAyrshareConnectUrl(
      profile.profileKey,
      redirectUrl,
    );

    return NextResponse.json({
      url: jwt.url,
      expiresInMinutes: 5,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
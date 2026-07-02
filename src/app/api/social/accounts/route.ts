import { NextResponse } from "next/server";

import { getAyrshareProfileDetails, isAyrshareConfigured } from "@/lib/ayrshare";
import { AYRSHARE_PLATFORM_LABELS } from "@/lib/social-platforms";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await requireAuth();
    if (!session) {
      return jsonError("Authentication required", 401, "UNAUTHORIZED");
    }

    const configured = isAyrshareConfigured();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { ayrshareProfileKey: true },
    });

    if (!configured) {
      return NextResponse.json({
        configured: false,
        connected: false,
        accounts: [] as Array<{
          platform: string;
          label: string;
          displayName?: string;
          username?: string;
          profileUrl?: string;
        }>,
      });
    }

    if (!user?.ayrshareProfileKey) {
      return NextResponse.json({
        configured: true,
        connected: false,
        accounts: [],
      });
    }

    const profile = await getAyrshareProfileDetails(user.ayrshareProfileKey);
    const active = profile.activeSocialAccounts ?? [];
    const displayByPlatform = new Map(
      (profile.displayNames ?? []).map((d) => [d.platform, d]),
    );

    const accounts = active.map((platform) => {
      const details = displayByPlatform.get(platform);
      return {
        platform,
        label: AYRSHARE_PLATFORM_LABELS[platform] ?? platform,
        displayName: details?.displayName,
        username: details?.username,
        profileUrl: details?.profileUrl,
      };
    });

    return NextResponse.json({
      configured: true,
      connected: accounts.length > 0,
      accounts,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
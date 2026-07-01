import { NextRequest, NextResponse } from "next/server";

import { handleApiError, jsonError } from "@/lib/api-utils";
import { auth, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { settingsSchema, safeParseBody } from "@/lib/validations";

export async function GET() {
  try {
    const session = await requireAuth();
    if (!session) {
      return jsonError("Authentication required", 401, "UNAUTHORIZED");
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        defaultTone: true,
        defaultPlatforms: true,
        plan: true,
        credits: true,
        password: true,
        accounts: {
          select: {
            provider: true,
            providerAccountId: true,
          },
        },
      },
    });

    if (!user) {
      return jsonError("User not found", 404, "NOT_FOUND");
    }

    const { password, accounts, ...profile } = user;

    return NextResponse.json({
      user: {
        ...profile,
        hasPassword: Boolean(password),
        connectedAccounts: accounts.map((a) => ({
          provider: a.provider,
          providerAccountId: a.providerAccountId,
        })),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth();
    if (!session) {
      return jsonError("Authentication required", 401, "UNAUTHORIZED");
    }

    const body = await request.json();
    const parsed = safeParseBody(settingsSchema, body);

    if (!parsed.success) {
      return jsonError("Validation failed", 400, "VALIDATION_ERROR", parsed.error.flatten());
    }

    const { name, defaultTone, defaultPlatforms } = parsed.data;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(defaultTone !== undefined ? { defaultTone } : {}),
        ...(defaultPlatforms !== undefined ? { defaultPlatforms } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        defaultTone: true,
        defaultPlatforms: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return jsonError("Authentication required", 401, "UNAUTHORIZED");
    }

    await prisma.user.delete({
      where: { id: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
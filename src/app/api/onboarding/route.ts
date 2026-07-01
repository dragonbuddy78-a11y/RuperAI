import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { onboardingSchema, safeParseBody } from "@/lib/validations";

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = safeParseBody(onboardingSchema, body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const {
      companyName,
      industry,
      contentGoals,
      contentTypes,
      platforms,
      onboardingStep,
      onboardingCompleted,
    } = parsed.data;

    const updateData: {
      companyName?: string;
      industry?: string;
      contentGoals?: string[];
      onboardingStep?: number;
      onboardingCompleted?: boolean;
    } = {};

    if (companyName !== undefined) updateData.companyName = companyName;
    if (industry !== undefined) updateData.industry = industry;
    if (contentGoals !== undefined) updateData.contentGoals = contentGoals;
    if (contentTypes !== undefined) updateData.contentGoals = contentTypes;
    if (platforms !== undefined) updateData.industry = platforms.join(", ");
    if (onboardingStep !== undefined) updateData.onboardingStep = onboardingStep;
    if (onboardingCompleted !== undefined) {
      updateData.onboardingCompleted = onboardingCompleted;
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        contentGoals: true,
        industry: true,
        onboardingStep: true,
        onboardingCompleted: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
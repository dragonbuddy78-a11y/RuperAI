import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { trainBrandVoiceProfile } from "@/lib/ai/brand-voice-trainer";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { requireAuth } from "@/lib/auth";
import {
  parseBrandVoiceExamples,
  type BrandVoiceExample,
} from "@/lib/brand-voice";
import { hasFeature } from "@/lib/plans";
import { prisma } from "@/lib/prisma";
import { getUserPlan } from "@/lib/user-plan";

const exampleSchema = z.object({
  id: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  content: z.string().min(50).max(5000),
});

const brandVoiceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  examples: z.array(exampleSchema).min(5).max(10),
  isEnabled: z.boolean().optional(),
  retrain: z.boolean().optional(),
});

const patchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  isEnabled: z.boolean().optional(),
  examples: z.array(exampleSchema).min(5).max(10).optional(),
  retrain: z.boolean().optional(),
});

function serializeVoice(
  voice: {
    id: string;
    name: string;
    voiceProfile: string | null;
    examples: unknown;
    isEnabled: boolean;
    trainedAt: Date | null;
  },
) {
  return {
    id: voice.id,
    name: voice.name,
    voiceProfile: voice.voiceProfile,
    examples: parseBrandVoiceExamples(voice.examples),
    isEnabled: voice.isEnabled,
    trainedAt: voice.trainedAt?.toISOString() ?? null,
  };
}

export async function GET() {
  try {
    const session = await requireAuth();
    if (!session) {
      return jsonError("Authentication required", 401, "UNAUTHORIZED");
    }

    const voice = await prisma.brandVoice.findUnique({
      where: { userId: session.user.id },
    });

    const plan = await getUserPlan(session.user.id);
    const hasAccess = hasFeature(plan, "customBranding");

    return NextResponse.json({
      hasAccess,
      plan,
      brandVoice: voice ? serializeVoice(voice) : null,
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

    const plan = await getUserPlan(session.user.id);
    if (!hasFeature(plan, "customBranding")) {
      return jsonError(
        "Brand Voice requires a Pro plan or higher",
        403,
        "PLAN_LIMIT",
      );
    }

    const body = await request.json();
    const parsed = brandVoiceSchema.parse(body);

    const profile = await trainBrandVoiceProfile(parsed.examples, plan);

    const voice = await prisma.brandVoice.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        name: parsed.name ?? "My Brand Voice",
        examples: parsed.examples,
        voiceProfile: profile,
        isEnabled: parsed.isEnabled ?? true,
        trainedAt: new Date(),
      },
      update: {
        name: parsed.name ?? undefined,
        examples: parsed.examples,
        voiceProfile: profile,
        isEnabled: parsed.isEnabled ?? true,
        trainedAt: new Date(),
      },
    });

    return NextResponse.json({
      brandVoice: serializeVoice(voice),
      message: "Brand voice trained successfully",
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

    const plan = await getUserPlan(session.user.id);
    if (!hasFeature(plan, "customBranding")) {
      return jsonError(
        "Brand Voice requires a Pro plan or higher",
        403,
        "PLAN_LIMIT",
      );
    }

    const existing = await prisma.brandVoice.findUnique({
      where: { userId: session.user.id },
    });

    if (!existing) {
      return jsonError("No brand voice found. Train one first.", 404, "NOT_FOUND");
    }

    const body = await request.json();
    const parsed = patchSchema.parse(body);

    let voiceProfile = existing.voiceProfile;
    let examples = parseBrandVoiceExamples(existing.examples);
    let trainedAt = existing.trainedAt;

    if (parsed.examples) {
      examples = parsed.examples;
    }

    if (parsed.retrain || parsed.examples) {
      if (examples.length < 5) {
        return jsonError("At least 5 examples required to train", 400, "VALIDATION_ERROR");
      }
      voiceProfile = await trainBrandVoiceProfile(
        examples as BrandVoiceExample[],
        plan,
      );
      trainedAt = new Date();
    }

    const voice = await prisma.brandVoice.update({
      where: { userId: session.user.id },
      data: {
        ...(parsed.name !== undefined ? { name: parsed.name } : {}),
        ...(parsed.isEnabled !== undefined ? { isEnabled: parsed.isEnabled } : {}),
        ...(parsed.examples ? { examples: parsed.examples } : {}),
        voiceProfile,
        trainedAt,
      },
    });

    return NextResponse.json({
      brandVoice: serializeVoice(voice),
      message: parsed.retrain || parsed.examples
        ? "Brand voice retrained"
        : "Brand voice updated",
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE() {
  try {
    const session = await requireAuth();
    if (!session) {
      return jsonError("Authentication required", 401, "UNAUTHORIZED");
    }

    await prisma.brandVoice.deleteMany({
      where: { userId: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
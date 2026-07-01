import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/plans";
import { getUserPlan } from "@/lib/user-plan";

export interface BrandVoiceExample {
  id: string;
  label: string;
  content: string;
}

export interface BrandVoiceData {
  id: string;
  name: string;
  voiceProfile: string | null;
  examples: BrandVoiceExample[];
  isEnabled: boolean;
  trainedAt: string | null;
}

export async function getActiveBrandVoiceProfile(
  userId: string,
): Promise<string | null> {
  const plan = await getUserPlan(userId);
  if (!hasFeature(plan, "customBranding")) {
    return null;
  }

  const voice = await prisma.brandVoice.findUnique({
    where: { userId },
    select: { voiceProfile: true, isEnabled: true },
  });

  if (!voice?.isEnabled || !voice.voiceProfile?.trim()) {
    return null;
  }

  return voice.voiceProfile.trim();
}

export function parseBrandVoiceExamples(raw: unknown): BrandVoiceExample[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is BrandVoiceExample =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as BrandVoiceExample).id === "string" &&
        typeof (item as BrandVoiceExample).label === "string" &&
        typeof (item as BrandVoiceExample).content === "string",
    )
    .map((e) => ({
      id: e.id,
      label: e.label,
      content: e.content,
    }));
}
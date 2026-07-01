import { generateWithCustomPrompt } from "@/lib/ai/client";
import type { BrandVoiceExample } from "@/lib/brand-voice";

const TRAIN_SYSTEM = `You are a brand voice analyst. Study writing samples and produce a reusable style guide another AI will follow when writing AS this author.

Output a structured profile (max 500 words) with these sections:
## Voice Summary (2-3 sentences)
## Tone & Personality
## Sentence Structure (length, rhythm, fragments vs full sentences)
## Vocabulary (words/phrases they use, words they avoid)
## Opening Hooks (how they start posts)
## CTAs & Closings
## Formatting Habits (emojis, line breaks, hashtags, bullets)
## Do / Don't (5 bullets each)

Be specific — cite patterns from the samples. No generic advice. No preamble.`;

export async function trainBrandVoiceProfile(
  examples: BrandVoiceExample[],
  plan?: string,
): Promise<string> {
  const samples = examples
    .map(
      (ex, i) =>
        `--- Sample ${i + 1}: ${ex.label} ---\n${ex.content.trim()}`,
    )
    .join("\n\n");

  const result = await generateWithCustomPrompt(
    TRAIN_SYSTEM,
    `Analyze these ${examples.length} writing samples and extract the author's brand voice:\n\n${samples}`,
    { temperature: 0.4, maxTokens: 1200, plan },
  );

  const profile = result.output?.trim();
  if (!profile || profile.length < 100) {
    throw new Error("Failed to generate brand voice profile");
  }

  return profile;
}

export function buildBrandVoicePromptBlock(profile: string): string {
  return `\n\nBRAND VOICE (MANDATORY — write exactly as this author):\n${profile}\n\nMatch this voice in every sentence. Do not sound generic or AI-written.`;
}
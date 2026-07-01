import { generateWithCustomPrompt } from "@/lib/ai/client";

/** Max chars sent as source material in monetization prompts */
export const MONETIZATION_SOURCE_CHAR_LIMIT = 5_000;

/** Trigger AI summarization above this length */
export const MONETIZATION_SUMMARIZE_THRESHOLD = 6_000;

const SUMMARY_SYSTEM = `Extract monetization-relevant facts from source content. Output a dense brief (max 400 words) with:
- Core topic & unique insights (bullet points)
- Audience pain points & desires
- Actionable frameworks, steps, or data mentioned
- Stories, examples, or proof points
- Quotable hooks or contrarian takes
Skip fluff. Preserve specifics. No preamble.`;

/**
 * Truncate content at sentence boundaries when possible.
 */
export function truncateForMonetization(
  content: string,
  maxChars = MONETIZATION_SOURCE_CHAR_LIMIT,
): string {
  const trimmed = content.trim();
  if (trimmed.length <= maxChars) return trimmed;

  const slice = trimmed.slice(0, maxChars);
  const lastBreak = Math.max(
    slice.lastIndexOf("\n\n"),
    slice.lastIndexOf(". "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? "),
  );

  if (lastBreak > maxChars * 0.7) {
    return `${slice.slice(0, lastBreak + 1).trim()}\n\n[Content truncated for length — key material preserved from start of source.]`;
  }

  return `${slice.trim()}…\n\n[Content truncated — beginning of source preserved.]`;
}

/**
 * For long transcripts/articles, compress to a monetization-focused brief
 * before sending to asset-generation prompts.
 */
export async function prepareMonetizationSource(
  content: string,
  plan?: string,
): Promise<{ source: string; summarized: boolean }> {
  const trimmed = content.trim();

  if (trimmed.length <= MONETIZATION_SUMMARIZE_THRESHOLD) {
    return {
      source: truncateForMonetization(trimmed),
      summarized: false,
    };
  }

  try {
    const result = await generateWithCustomPrompt(
      SUMMARY_SYSTEM,
      `Summarize this content for monetization asset creation:\n\n---\n${truncateForMonetization(trimmed, 12_000)}\n---`,
      { temperature: 0.3, maxTokens: 800, plan },
    );

    const summary = result.output?.trim();
    if (summary && summary.length > 200) {
      return {
        source: `[AI-extracted brief from ${trimmed.length.toLocaleString()} char source]\n\n${summary}`,
        summarized: true,
      };
    }
  } catch (error) {
    console.warn("[Monetization] Summarization failed, using truncation:", error);
  }

  return {
    source: truncateForMonetization(trimmed),
    summarized: false,
  };
}
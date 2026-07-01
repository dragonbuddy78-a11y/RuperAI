import { generateWithCustomPrompt } from "@/lib/ai/client";
import type { ContentFormat } from "@/types";

export interface QualityIssue {
  type: "grammar" | "spelling" | "readability" | "style";
  message: string;
  suggestion?: string;
}

export interface QualityReport {
  score: number;
  readabilityGrade: string;
  wordCount: number;
  issues: QualityIssue[];
  improvedOutput?: string;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function estimateReadabilityGrade(wordCount: number, sentenceCount: number): string {
  if (sentenceCount === 0) return "N/A";
  const avgWordsPerSentence = wordCount / sentenceCount;
  if (avgWordsPerSentence <= 12) return "Easy";
  if (avgWordsPerSentence <= 18) return "Standard";
  if (avgWordsPerSentence <= 25) return "Moderate";
  return "Dense";
}

function localHeuristics(content: string): QualityIssue[] {
  const issues: QualityIssue[] = [];

  if (/\.\s*[a-z]/.test(content)) {
    issues.push({
      type: "grammar",
      message: "Possible sentence boundary issue after a period",
      suggestion: "Capitalize the word after a period or merge sentences.",
    });
  }

  const repeatedWords = content.match(/\b(\w+)\s+\1\b/gi);
  if (repeatedWords?.length) {
    issues.push({
      type: "style",
      message: `Repeated words detected: ${repeatedWords.slice(0, 2).join(", ")}`,
      suggestion: "Vary word choice for a more polished read.",
    });
  }

  if (content.includes("  ")) {
    issues.push({
      type: "style",
      message: "Extra spacing found",
      suggestion: "Remove double spaces for cleaner formatting.",
    });
  }

  const aiPhrases = [
    "in today's fast-paced world",
    "it's important to note",
    "in conclusion",
    "game-changer",
    "dive deep",
    "leverage",
    "unlock the power",
  ];

  for (const phrase of aiPhrases) {
    if (content.toLowerCase().includes(phrase)) {
      issues.push({
        type: "style",
        message: `Generic phrase detected: "${phrase}"`,
        suggestion: "Replace with a more specific, human-sounding expression.",
      });
      break;
    }
  }

  return issues;
}

export async function checkContentQuality(
  content: string,
  format: ContentFormat,
  plan?: string,
): Promise<QualityReport> {
  const wordCount = countWords(content);
  const sentenceCount = content.split(/[.!?]+/).filter((s) => s.trim()).length;
  const localIssues = localHeuristics(content);

  const systemPrompt = `You are a professional copy editor. Analyze content for grammar, spelling, readability, and style issues.

Return ONLY valid JSON with this shape:
{
  "score": number (0-100),
  "issues": [{ "type": "grammar"|"spelling"|"readability"|"style", "message": string, "suggestion": string }],
  "improvedOutput": string (full corrected content with minor fixes applied, same format/structure)
}

Rules:
- Score 90+ for polished, publish-ready content
- Only flag real issues — do not nitpick intentional style choices (hooks, fragments, emojis)
- improvedOutput should fix grammar/spelling and light style issues only — do not rewrite from scratch
- Preserve platform formatting (${format.replace(/_/g, " ")})
- Maximum 5 issues`;

  const userPrompt = `Review this ${format.replace(/_/g, " ")} content:

---
${content}
---`;

  try {
    const result = await generateWithCustomPrompt(systemPrompt, userPrompt, {
      temperature: 0.2,
      maxTokens: 4096,
      plan,
    });

    const jsonMatch = result.output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as {
        score?: number;
        issues?: QualityIssue[];
        improvedOutput?: string;
      };

      const aiIssues = (parsed.issues ?? []).slice(0, 5);
      const mergedIssues = [...localIssues, ...aiIssues].slice(0, 6);

      return {
        score: Math.min(100, Math.max(0, parsed.score ?? 85)),
        readabilityGrade: estimateReadabilityGrade(wordCount, sentenceCount),
        wordCount,
        issues: mergedIssues,
        improvedOutput:
          parsed.improvedOutput?.trim() && parsed.improvedOutput !== content
            ? parsed.improvedOutput.trim()
            : undefined,
      };
    }
  } catch (error) {
    console.warn("[QualityCheck] AI check failed, using heuristics:", error);
  }

  const score = Math.max(60, 95 - localIssues.length * 8);

  return {
    score,
    readabilityGrade: estimateReadabilityGrade(wordCount, sentenceCount),
    wordCount,
    issues: localIssues,
    improvedOutput:
      localIssues.length > 0
        ? content.replace(/  +/g, " ").replace(/\n{3,}/g, "\n\n")
        : undefined,
  };
}
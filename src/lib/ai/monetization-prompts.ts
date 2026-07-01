import type { MonetizationContext, MonetizationType } from "@/types";

/** Shared once — avoid repeating in every type prompt */
const BASE = `Expert monetization strategist & direct-response copywriter. Ground every output in the source material — cite specific topics, insights, and angles. No generic advice. Output only the deliverable.`;

const TYPE_PROMPTS: Record<MonetizationType, string> = {
  analyze: `Assess monetization potential. Use headings:
## Score (1-10) + why
## Top 3 Offers (product + angle each)
## Buyer Personas (pain, willingness to pay)
## Quick Wins (7 days)
## 30-90 Day Plays
## Price Range Signals
## Content→Offer Map
## Gaps & Risks
Be honest if potential is low.`,

  sales_page: `Write a long-form sales page. Direct-response, "you" voice. Use [PLACEHOLDER] where needed.
Sections: Pre-headline | Headline | Subhead | Story opener | Pain (3-4 bullets) | Solution bridge | What's included (5-8 items, benefit-led) | Before/after | Proof placeholders | 2-3 bonuses | Price + guarantee | FAQ (5-7) | Final CTA`,

  email_sequence: `5-email launch sequence. Per email: Subject (+1 A/B), preview text, body (200-300 words), send day, goal.
Arc: E1 value | E2 pain | E3 offer reveal | E4 proof/objections | E5 urgency+CTA. One CTA per email.`,

  course_outline: `Premium course from this content.
Include: Title/subtitle | Student profile | Transformation promise | 5-6 modules (objectives, 3-4 lesson titles + key points, 1 exercise each) | Bonuses | 2-tier pricing suggestion | 3-step launch plan`,

  affiliate_scripts: `Affiliate monetization kit.
Include: 3-5 product categories + why | 2 integration angles | Short scripts (30s verbal, 3-frame IG story, 1 tweet) | Long scripts (60s YouTube mid-roll, blog paragraph, email block) | FTC disclosure line | 3 conversion tips. Use [PRODUCT] [LINK] placeholders. Authentic tone.`,

  lead_magnet: `Lead magnet funnel.
Include: 3 ranked concepts | Winner detail (title, format, outline, landing headline+bullets+CTA, thank-you + tripwire) | 3 post-opt-in emails (subjects only + 2-sentence body each) | Upsell path | 3 distribution channels. Promise a 10-min win.`,

  pricing_strategy: `Pricing strategy.
Include: Positioning (premium/mid/volume + why) | 3 tiers (name, price, includes, buyer) | 3 psychology tactics | Competitor price range estimate | Value metric | Launch vs evergreen pricing | 3 revenue scenarios (1 line each) | 30-day price test plan`,
};

const OUTPUT_RULES = `Rules: Use markdown headings. Reference source specifics. End with 3 next steps. No process commentary.`;

const EDIT_RULES = `Edit the deliverable per user instruction. Keep structure. Output revised content only. No preamble.`;

function buildContextBlock(context?: MonetizationContext): string {
  if (!context) return "";
  const parts: string[] = [];
  if (context.productName) parts.push(`Product: ${context.productName}`);
  if (context.targetAudience) parts.push(`Audience: ${context.targetAudience}`);
  if (context.pricePoint) parts.push(`Price target: ${context.pricePoint}`);
  if (context.niche) parts.push(`Niche: ${context.niche}`);
  if (context.existingOffer) parts.push(`Existing offer: ${context.existingOffer}`);
  if (context.goals?.length) parts.push(`Goals: ${context.goals.join(", ")}`);
  if (parts.length === 0) return "";
  return `\nContext: ${parts.join(" | ")}`;
}

export const MONETIZATION_MAX_OUTPUT_TOKENS: Record<MonetizationType, number> = {
  analyze: 2048,
  sales_page: 4096,
  email_sequence: 4096,
  course_outline: 4096,
  affiliate_scripts: 3072,
  lead_magnet: 3072,
  pricing_strategy: 3072,
};

export function buildMonetizationPrompt(
  type: MonetizationType,
  content: string,
  context?: MonetizationContext,
  brandVoiceProfile?: string | null,
): { systemPrompt: string; userPrompt: string } {
  const brandBlock = brandVoiceProfile?.trim()
    ? `\n\nBRAND VOICE (MANDATORY): Write as this author:\n${brandVoiceProfile.trim()}`
    : "";

  const systemPrompt = `${BASE}\n\nTask: ${TYPE_PROMPTS[type]}${buildContextBlock(context)}${brandBlock}\n\n${OUTPUT_RULES}`;

  const userPrompt = `Source:\n---\n${content}\n---`;

  return { systemPrompt, userPrompt };
}

const MONETIZATION_TYPE_LABELS: Record<MonetizationType, string> = {
  analyze: "strategies overview",
  sales_page: "sales page",
  email_sequence: "email sequence",
  course_outline: "course outline",
  affiliate_scripts: "affiliate scripts",
  lead_magnet: "lead magnet",
  pricing_strategy: "pricing strategy",
};

export function buildMonetizationEditSystemPrompt(
  type: MonetizationType,
): string {
  return `${BASE}\n\nEditing a ${MONETIZATION_TYPE_LABELS[type]}. ${EDIT_RULES}`;
}

export function buildMonetizationEditUserPrompt(
  currentContent: string,
  instruction: string,
): string {
  return `Content:\n---\n${currentContent}\n---\n\nInstruction: ${instruction}`;
}

// Re-export helpers for backward compatibility
export const analyzeMonetizationPotential = (
  content: string,
  context?: MonetizationContext,
) => buildMonetizationPrompt("analyze", content, context);

export const generateSalesPage = (
  content: string,
  context?: MonetizationContext,
) => buildMonetizationPrompt("sales_page", content, context);

export const generateEmailSequence = (
  content: string,
  context?: MonetizationContext,
) => buildMonetizationPrompt("email_sequence", content, context);

export const generateCourseOutline = (
  content: string,
  context?: MonetizationContext,
) => buildMonetizationPrompt("course_outline", content, context);

export const generateAffiliateScripts = (
  content: string,
  context?: MonetizationContext,
) => buildMonetizationPrompt("affiliate_scripts", content, context);

export const generateLeadMagnets = (
  content: string,
  context?: MonetizationContext,
) => buildMonetizationPrompt("lead_magnet", content, context);

export const generatePricingStrategy = (
  content: string,
  context?: MonetizationContext,
) => buildMonetizationPrompt("pricing_strategy", content, context);
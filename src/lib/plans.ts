import type { OutputFormat, PlanType } from "@/generated/prisma";

export type PlanFeature =
  | "basicFormats"
  | "advancedFormats"
  | "monetization"
  | "analytics"
  | "prioritySupport"
  | "apiAccess"
  | "bulkRepurpose"
  | "customBranding";

export const PLANS: Record<
  PlanType,
  {
    id: PlanType;
    name: string;
    priceMonthly: number;
    creditsMonthly: number;
    maxContentPerMonth: number;
    maxFormatsPerRepurpose: number;
    maxMonetizationProjects: number;
    features: Record<PlanFeature, boolean>;
  }
> = {
  FREE: {
    id: "FREE",
    name: "Free",
    priceMonthly: 0,
    creditsMonthly: 50,
    maxContentPerMonth: 10,
    maxFormatsPerRepurpose: 3,
    maxMonetizationProjects: 1,
    features: {
      basicFormats: true,
      advancedFormats: false,
      monetization: false,
      analytics: false,
      prioritySupport: false,
      apiAccess: false,
      bulkRepurpose: false,
      customBranding: false,
    },
  },
  STARTER: {
    id: "STARTER",
    name: "Starter",
    priceMonthly: 19,
    creditsMonthly: 500,
    maxContentPerMonth: 50,
    maxFormatsPerRepurpose: 8,
    maxMonetizationProjects: 3,
    features: {
      basicFormats: true,
      advancedFormats: true,
      monetization: true,
      analytics: false,
      prioritySupport: false,
      apiAccess: false,
      bulkRepurpose: false,
      customBranding: false,
    },
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    priceMonthly: 29,
    creditsMonthly: 2000,
    maxContentPerMonth: -1,
    maxFormatsPerRepurpose: -1,
    maxMonetizationProjects: -1,
    features: {
      basicFormats: true,
      advancedFormats: true,
      monetization: true,
      analytics: true,
      prioritySupport: true,
      apiAccess: true,
      bulkRepurpose: true,
      customBranding: true,
    },
  },
  ENTERPRISE: {
    id: "ENTERPRISE",
    name: "Enterprise",
    priceMonthly: 99,
    creditsMonthly: 10000,
    maxContentPerMonth: -1,
    maxFormatsPerRepurpose: -1,
    maxMonetizationProjects: -1,
    features: {
      basicFormats: true,
      advancedFormats: true,
      monetization: true,
      analytics: true,
      prioritySupport: true,
      apiAccess: true,
      bulkRepurpose: true,
      customBranding: true,
    },
  },
};

const BASIC_FORMATS: OutputFormat[] = [
  "TWITTER_THREAD",
  "LINKEDIN_POST",
  "INSTAGRAM_CAPTION",
  "FACEBOOK_POST",
];

const ADVANCED_FORMATS: OutputFormat[] = [
  "LINKEDIN_ARTICLE",
  "INSTAGRAM_CAROUSEL",
  "THREADS_POST",
  "BLOG_POST",
  "SEO_BLOG",
  "NEWSLETTER",
  "EMAIL_NEWSLETTER",
  "YOUTUBE_DESCRIPTION",
  "YOUTUBE_CHAPTERS",
  "TIKTOK_SCRIPT",
  "EMAIL_SEQUENCE",
  "SEO_META",
  "THREAD_HOOKS",
  "CAROUSEL",
  "SHORTS_SCRIPT",
  "AD_COPY",
  "LEAD_MAGNET",
  "PINTEREST_PIN",
];

export function getPlan(plan: PlanType) {
  return PLANS[plan] ?? PLANS.FREE;
}

export function hasFeature(plan: PlanType, feature: PlanFeature): boolean {
  return getPlan(plan).features[feature];
}

export function canUseFormat(plan: PlanType, format: OutputFormat): boolean {
  if (BASIC_FORMATS.includes(format)) {
    return true;
  }

  if (ADVANCED_FORMATS.includes(format)) {
    return hasFeature(plan, "advancedFormats");
  }

  return false;
}

export function getMaxFormatsPerRepurpose(plan: PlanType): number {
  const limit = getPlan(plan).maxFormatsPerRepurpose;
  return limit === -1 ? Number.POSITIVE_INFINITY : limit;
}

export function getMaxContentPerMonth(plan: PlanType): number {
  const limit = getPlan(plan).maxContentPerMonth;
  return limit === -1 ? Number.POSITIVE_INFINITY : limit;
}

export function getMaxMonetizationProjects(plan: PlanType): number {
  const limit = getPlan(plan).maxMonetizationProjects;
  return limit === -1 ? Number.POSITIVE_INFINITY : limit;
}

export function getMonthlyCredits(plan: PlanType): number {
  return getPlan(plan).creditsMonthly;
}

export function isPaidPlan(plan: PlanType): boolean {
  return plan !== "FREE";
}

export function getAvailableFormats(plan: PlanType): OutputFormat[] {
  const formats: OutputFormat[] = [...BASIC_FORMATS];

  if (hasFeature(plan, "advancedFormats")) {
    formats.push(...ADVANCED_FORMATS);
  }

  return formats;
}
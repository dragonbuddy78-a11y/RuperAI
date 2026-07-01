import type { ContentSourceType, OutputFormat, PlanType } from "@/generated/prisma";

export const CONTENT_FORMATS = [
  "twitter_thread",
  "linkedin_post",
  "linkedin_article",
  "instagram_carousel",
  "instagram_caption",
  "tiktok_script",
  "youtube_description",
  "youtube_chapters",
  "email_newsletter",
  "seo_blog",
  "ad_copy",
  "lead_magnet",
  "facebook_post",
  "threads_post",
  "pinterest_pin",
] as const;

export type ContentFormat = (typeof CONTENT_FORMATS)[number];

export const MONETIZATION_TYPES = [
  "analyze",
  "sales_page",
  "email_sequence",
  "course_outline",
  "affiliate_scripts",
  "lead_magnet",
  "pricing_strategy",
] as const;

export type MonetizationType = (typeof MONETIZATION_TYPES)[number];

export const SOURCE_TYPES = [
  "text",
  "url",
  "youtube",
  "pdf",
  "file",
  "audio",
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

export const TONE_OPTIONS = [
  "professional",
  "casual",
  "witty",
  "authoritative",
  "empathetic",
  "bold",
  "educational",
  "inspirational",
] as const;

export type Tone = (typeof TONE_OPTIONS)[number];

export const LENGTH_OPTIONS = ["short", "medium", "long", "auto"] as const;
export type Length = (typeof LENGTH_OPTIONS)[number];

export type Plan = PlanType;

export interface GenerationOptions {
  tone?: Tone;
  audience?: string;
  keywords?: string[];
  length?: Length;
  variants?: number;
  cta?: string;
  hashtags?: boolean;
  emojis?: boolean;
  brandVoice?: string;
  language?: string;
}

export interface GenerateRequest {
  content: string;
  sourceType?: SourceType;
  sourceUrl?: string;
  title?: string;
  formats: ContentFormat[];
  options?: GenerationOptions;
}

export interface MonetizeRequest {
  content: string;
  type: MonetizationType;
  context?: MonetizationContext;
}

export interface MonetizationContext {
  productName?: string;
  targetAudience?: string;
  pricePoint?: string;
  niche?: string;
  existingOffer?: string;
  goals?: string[];
}

export interface ExtractRequest {
  sourceType: "url" | "youtube";
  input: string;
}

export interface ExtractedContent {
  title?: string;
  content: string;
  wordCount: number;
  metadata?: Record<string, unknown>;
}

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

export interface GeneratedOutput {
  id?: string;
  format: ContentFormat;
  output: string;
  tokensUsed?: number;
  model?: string;
  metadata?: Record<string, unknown>;
  quality?: QualityReport;
}

export interface GenerateResponse {
  contentId: string;
  outputs: GeneratedOutput[];
  creditsUsed: number;
  creditsRemaining: number;
}

export interface MonetizeOutput {
  type: MonetizationType;
  output: string;
  creditsUsed: number;
  tokensUsed?: number;
  model?: string;
}

export interface MonetizeResponse extends MonetizeOutput {
  creditsRemaining: number;
}

export interface MonetizeBulkResponse {
  outputs: MonetizeOutput[];
  creditsUsed: number;
  creditsRemaining: number;
  failedTypes?: MonetizationType[];
}

export interface UploadResponse {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
  extractedContent?: string;
  wordCount?: number;
}

export type ScheduledPostStatus = "SCHEDULED" | "POSTED" | "SKIPPED";

export interface ScheduledPostData {
  id: string;
  title: string;
  content: string;
  platform: string;
  scheduledAt: string;
  status: ScheduledPostStatus;
  outputId?: string | null;
  contentId?: string | null;
  notes?: string | null;
}

export interface MonetizationProjectData {
  id: string;
  name: string;
  description?: string | null;
  niche?: string | null;
  targetAudience?: string | null;
  status: string;
  assetCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MonetizationAssetData {
  id: string;
  type: string;
  title?: string | null;
  output: string;
  context?: unknown;
  creditsUsed: number;
  createdAt: string;
}

export interface PlanLimits {
  monthlyCredits: number;
  maxFormatsPerRequest: number;
  maxContentLength: number;
  monetizationAccess: boolean;
  streamingAccess: boolean;
  rateLimitPerMinute: number;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  FREE: {
    monthlyCredits: 50,
    maxFormatsPerRequest: 3,
    maxContentLength: 8000,
    monetizationAccess: false,
    streamingAccess: false,
    rateLimitPerMinute: 10,
  },
  STARTER: {
    monthlyCredits: 500,
    maxFormatsPerRequest: 8,
    maxContentLength: 25000,
    monetizationAccess: true,
    streamingAccess: true,
    rateLimitPerMinute: 30,
  },
  PRO: {
    monthlyCredits: 2000,
    maxFormatsPerRequest: 15,
    maxContentLength: 50000,
    monetizationAccess: true,
    streamingAccess: true,
    rateLimitPerMinute: 60,
  },
  ENTERPRISE: {
    monthlyCredits: 10000,
    maxFormatsPerRequest: 15,
    maxContentLength: 100000,
    monetizationAccess: true,
    streamingAccess: true,
    rateLimitPerMinute: 120,
  },
};

export const FORMAT_TO_OUTPUT: Record<ContentFormat, OutputFormat> = {
  twitter_thread: "TWITTER_THREAD",
  linkedin_post: "LINKEDIN_POST",
  linkedin_article: "LINKEDIN_ARTICLE",
  instagram_carousel: "INSTAGRAM_CAROUSEL",
  instagram_caption: "INSTAGRAM_CAPTION",
  tiktok_script: "TIKTOK_SCRIPT",
  youtube_description: "YOUTUBE_DESCRIPTION",
  youtube_chapters: "YOUTUBE_CHAPTERS",
  email_newsletter: "EMAIL_NEWSLETTER",
  seo_blog: "SEO_BLOG",
  ad_copy: "AD_COPY",
  lead_magnet: "LEAD_MAGNET",
  facebook_post: "FACEBOOK_POST",
  threads_post: "THREADS_POST",
  pinterest_pin: "PINTEREST_PIN",
};

export const OUTPUT_TO_FORMAT: Record<OutputFormat, ContentFormat | null> = {
  TWITTER_THREAD: "twitter_thread",
  LINKEDIN_POST: "linkedin_post",
  LINKEDIN_ARTICLE: "linkedin_article",
  INSTAGRAM_CAPTION: "instagram_caption",
  INSTAGRAM_CAROUSEL: "instagram_carousel",
  FACEBOOK_POST: "facebook_post",
  THREADS_POST: "threads_post",
  BLOG_POST: "seo_blog",
  SEO_BLOG: "seo_blog",
  NEWSLETTER: "email_newsletter",
  EMAIL_NEWSLETTER: "email_newsletter",
  YOUTUBE_DESCRIPTION: "youtube_description",
  YOUTUBE_CHAPTERS: "youtube_chapters",
  TIKTOK_SCRIPT: "tiktok_script",
  EMAIL_SEQUENCE: "email_newsletter",
  SEO_META: "seo_blog",
  THREAD_HOOKS: "twitter_thread",
  CAROUSEL: "instagram_carousel",
  SHORTS_SCRIPT: "tiktok_script",
  AD_COPY: "ad_copy",
  LEAD_MAGNET: "lead_magnet",
  PINTEREST_PIN: "pinterest_pin",
};

export const SOURCE_TYPE_MAP: Record<SourceType, ContentSourceType> = {
  text: "TEXT",
  url: "URL",
  youtube: "YOUTUBE",
  pdf: "PDF",
  file: "TEXT",
  audio: "AUDIO",
};

export const FORMAT_CREDIT_COST = 1;

export const MONETIZATION_CREDIT_COSTS: Record<MonetizationType, number> = {
  analyze: 2,
  sales_page: 5,
  email_sequence: 4,
  course_outline: 4,
  affiliate_scripts: 3,
  lead_magnet: 3,
  pricing_strategy: 2,
};

export interface StreamEvent {
  type: "format_start" | "format_complete" | "format_error" | "done" | "error";
  format?: ContentFormat;
  output?: string;
  error?: string;
  contentId?: string;
  creditsUsed?: number;
  creditsRemaining?: number;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: unknown;
}

export function toOutputFormat(format: ContentFormat): OutputFormat {
  return FORMAT_TO_OUTPUT[format];
}

export function fromOutputFormat(format: OutputFormat): ContentFormat | null {
  return OUTPUT_TO_FORMAT[format];
}

export function getPlanLimits(plan: PlanType): PlanLimits {
  return PLAN_LIMITS[plan];
}
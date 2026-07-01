import { z } from "zod";

export const outputFormatSchema = z.enum([
  "TWITTER_THREAD",
  "LINKEDIN_POST",
  "INSTAGRAM_CAPTION",
  "FACEBOOK_POST",
  "BLOG_POST",
  "NEWSLETTER",
  "YOUTUBE_DESCRIPTION",
  "TIKTOK_SCRIPT",
  "EMAIL_SEQUENCE",
  "SEO_META",
  "THREAD_HOOKS",
  "CAROUSEL",
  "SHORTS_SCRIPT",
]);

export const contentSourceTypeSchema = z.enum([
  "TEXT",
  "URL",
  "YOUTUBE",
  "PDF",
  "AUDIO",
]);

export const planTypeSchema = z.enum(["FREE", "PRO", "ENTERPRISE"]);

export const credentialsSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export const loginSchema = credentialsSchema;

export const onboardingSchema = z.object({
  companyName: z.string().max(100).optional(),
  industry: z.string().max(200).optional(),
  contentGoals: z.array(z.string().max(100)).max(20).optional(),
  contentTypes: z.array(z.string().max(100)).max(20).optional(),
  platforms: z.array(z.string().max(100)).max(20).optional(),
  onboardingStep: z.number().int().min(0).max(10).optional(),
  onboardingCompleted: z.boolean().optional(),
});

export const createContentSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    sourceType: contentSourceTypeSchema,
    sourceUrl: z.string().url().optional(),
    rawContent: z.string().min(10, "Content must be at least 10 characters").max(100_000),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .refine(
    (data) => {
      if (data.sourceType === "TEXT") {
        return true;
      }
      return Boolean(data.sourceUrl);
    },
    {
      message: "Source URL is required for non-text content types",
      path: ["sourceUrl"],
    },
  );

export const repurposeSchema = z.object({
  contentId: z.string().cuid(),
  formats: z
    .array(outputFormatSchema)
    .min(1, "Select at least one format")
    .max(13),
  options: z
    .object({
      tone: z
        .enum(["professional", "casual", "witty", "inspirational", "educational"])
        .optional(),
      audience: z.string().max(200).optional(),
      brandVoice: z.string().max(500).optional(),
      includeHashtags: z.boolean().optional(),
      includeEmojis: z.boolean().optional(),
    })
    .optional(),
});

export const updateContentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  summary: z.string().max(5000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const createMonetizationProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(5000).optional(),
  niche: z.string().max(200).optional(),
  targetAudience: z.string().max(500).optional(),
  revenueGoal: z.number().positive().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateMonetizationProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  niche: z.string().max(200).optional(),
  targetAudience: z.string().max(500).optional(),
  revenueGoal: z.number().positive().nullable().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const checkoutSchema = z.object({
  plan: z.enum(["pro"]).default("pro"),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const contentListSchema = paginationSchema.extend({
  status: z.enum(["PENDING", "PROCESSING", "COMPLETED", "FAILED"]).optional(),
  sourceType: contentSourceTypeSchema.optional(),
});

export const usageLogSchema = z.object({
  action: z.string().min(1).max(100),
  creditsUsed: z.number().int().min(0).default(0),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  companyName: z.string().max(100).optional(),
  industry: z.string().max(100).optional(),
  contentGoals: z.array(z.string().max(100)).max(10).optional(),
});

export const settingsSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  defaultTone: z
    .enum([
      "professional",
      "casual",
      "witty",
      "authoritative",
      "empathetic",
      "bold",
      "educational",
      "inspirational",
    ])
    .optional()
    .nullable(),
  defaultPlatforms: z
    .array(
      z.enum([
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
      ]),
    )
    .max(15)
    .optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z
    .string()
    .min(8)
    .max(128)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and a number",
    ),
});

export function parseBody<T extends z.ZodType>(
  schema: T,
  data: unknown,
): z.infer<T> {
  return schema.parse(data);
}

export function safeParseBody<T extends z.ZodType>(
  schema: T,
  data: unknown,
):
  | { success: true; data: z.infer<T> }
  | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
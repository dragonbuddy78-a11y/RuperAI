import type { ContentFormat } from "@/types";

export const FORMAT_CREDIT_COST = 1;

export const SNAKE_CASE_FORMAT_COSTS: Record<ContentFormat, number> = {
  twitter_thread: 2,
  linkedin_post: 2,
  linkedin_article: 5,
  instagram_carousel: 4,
  instagram_caption: 2,
  tiktok_script: 3,
  youtube_description: 3,
  youtube_chapters: 3,
  email_newsletter: 5,
  seo_blog: 5,
  ad_copy: 3,
  lead_magnet: 4,
  facebook_post: 2,
  threads_post: 2,
  pinterest_pin: 2,
};

export function getFormatCreditCost(format: ContentFormat | string): number {
  if (format in SNAKE_CASE_FORMAT_COSTS) {
    return SNAKE_CASE_FORMAT_COSTS[format as ContentFormat];
  }
  return FORMAT_CREDIT_COST;
}

export function getCreditCost(formats: Array<ContentFormat | string>): number {
  return formats.reduce(
    (total, format) => total + getFormatCreditCost(format),
    0,
  );
}
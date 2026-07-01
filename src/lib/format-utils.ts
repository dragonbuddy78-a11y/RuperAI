import type { ContentFormat } from "@/types";

export const FORMAT_LABELS: Record<ContentFormat, string> = {
  twitter_thread: "Twitter / X Thread",
  linkedin_post: "LinkedIn Post",
  linkedin_article: "LinkedIn Article",
  instagram_carousel: "Instagram Carousel",
  instagram_caption: "Instagram Caption",
  tiktok_script: "TikTok Script",
  youtube_description: "YouTube Description",
  youtube_chapters: "YouTube Chapters",
  email_newsletter: "Email Newsletter",
  seo_blog: "SEO Blog",
  ad_copy: "Ad Copy",
  lead_magnet: "Lead Magnet",
  facebook_post: "Facebook Post",
  threads_post: "Threads Post",
  pinterest_pin: "Pinterest Pin",
};

export const PLATFORM_GROUPS: Record<string, ContentFormat[]> = {
  "Twitter / X": ["twitter_thread"],
  LinkedIn: ["linkedin_post", "linkedin_article"],
  Instagram: ["instagram_carousel", "instagram_caption"],
  Facebook: ["facebook_post"],
  Threads: ["threads_post"],
  TikTok: ["tiktok_script"],
  YouTube: ["youtube_description", "youtube_chapters"],
  Email: ["email_newsletter"],
  Blog: ["seo_blog"],
  Ads: ["ad_copy"],
  Other: ["lead_magnet", "pinterest_pin"],
};

export function getFormatLabel(format: string): string {
  return FORMAT_LABELS[format as ContentFormat] ?? format.replace(/_/g, " ");
}

export function formatToPlatform(format: string): string {
  for (const [platform, formats] of Object.entries(PLATFORM_GROUPS)) {
    if (formats.includes(format as ContentFormat)) {
      return platform;
    }
  }
  return "Other";
}
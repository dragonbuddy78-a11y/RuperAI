import {
  BookOpen,
  FileText,
  Hash,
  Image,
  Mail,
  Megaphone,
  MessageSquare,
  Search,
  Share2,
  Sparkles,
  Video,
  type LucideIcon,
} from "lucide-react";

import { getFormatCreditCost, getCreditCost } from "@/lib/credit-costs";
import type { ContentFormat } from "@/types";

export interface FormatMeta {
  label: string;
  description: string;
  icon: LucideIcon;
  category: "social" | "longform" | "video" | "email" | "ads";
  credits: number;
}

export const FORMAT_META: Record<ContentFormat, FormatMeta> = {
  twitter_thread: {
    label: "Twitter / X Thread",
    description: "Engaging multi-tweet thread with hooks",
    icon: Hash,
    category: "social",
    credits: getFormatCreditCost("twitter_thread"),
  },
  linkedin_post: {
    label: "LinkedIn Post",
    description: "Professional post with strong CTA",
    icon: Share2,
    category: "social",
    credits: getFormatCreditCost("linkedin_post"),
  },
  linkedin_article: {
    label: "LinkedIn Article",
    description: "Long-form thought leadership piece",
    icon: FileText,
    category: "longform",
    credits: getFormatCreditCost("linkedin_article"),
  },
  instagram_carousel: {
    label: "Instagram Carousel",
    description: "Swipeable slide-by-slide content",
    icon: Image,
    category: "social",
    credits: getFormatCreditCost("instagram_carousel"),
  },
  instagram_caption: {
    label: "Instagram Caption",
    description: "Caption with hashtags and emojis",
    icon: Image,
    category: "social",
    credits: getFormatCreditCost("instagram_caption"),
  },
  tiktok_script: {
    label: "TikTok Script",
    description: "Short-form video script with hooks",
    icon: Video,
    category: "video",
    credits: getFormatCreditCost("tiktok_script"),
  },
  youtube_description: {
    label: "YouTube Description",
    description: "SEO-optimized video description",
    icon: Video,
    category: "video",
    credits: getFormatCreditCost("youtube_description"),
  },
  youtube_chapters: {
    label: "YouTube Chapters",
    description: "Timestamped chapter markers",
    icon: Video,
    category: "video",
    credits: getFormatCreditCost("youtube_chapters"),
  },
  email_newsletter: {
    label: "Email Newsletter",
    description: "Subscriber-ready newsletter edition",
    icon: Mail,
    category: "email",
    credits: getFormatCreditCost("email_newsletter"),
  },
  seo_blog: {
    label: "SEO Blog Post",
    description: "Search-optimized long-form article",
    icon: Search,
    category: "longform",
    credits: getFormatCreditCost("seo_blog"),
  },
  ad_copy: {
    label: "Ad Copy",
    description: "High-converting ad variations",
    icon: Megaphone,
    category: "ads",
    credits: getFormatCreditCost("ad_copy"),
  },
  lead_magnet: {
    label: "Lead Magnet",
    description: "Downloadable resource outline",
    icon: BookOpen,
    category: "ads",
    credits: getFormatCreditCost("lead_magnet"),
  },
  facebook_post: {
    label: "Facebook Post",
    description: "Community-focused social post",
    icon: MessageSquare,
    category: "social",
    credits: getFormatCreditCost("facebook_post"),
  },
  threads_post: {
    label: "Threads Post",
    description: "Conversational Threads content",
    icon: Hash,
    category: "social",
    credits: getFormatCreditCost("threads_post"),
  },
  pinterest_pin: {
    label: "Pinterest Pin",
    description: "Pin description with keywords",
    icon: Image,
    category: "social",
    credits: getFormatCreditCost("pinterest_pin"),
  },
};

export interface StudioTemplate {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  formats: ContentFormat[];
  gradient: string;
}

export interface BulkPreset {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  formats: ContentFormat[];
  gradient: string;
  badge?: string;
}

/** One-click bundles for bulk generation */
export const BULK_PRESETS: BulkPreset[] = [
  {
    id: "social-trinity",
    name: "Social Trinity",
    description: "Twitter thread + LinkedIn + Instagram caption",
    icon: Share2,
    formats: ["twitter_thread", "linkedin_post", "instagram_caption"],
    gradient: "from-violet-500/15 to-fuchsia-600/10",
    badge: "Most popular",
  },
  {
    id: "full-social-kit",
    name: "Full Social Kit",
    description: "All major social platforms in one click",
    icon: Hash,
    formats: [
      "twitter_thread",
      "linkedin_post",
      "instagram_caption",
      "facebook_post",
      "threads_post",
    ],
    gradient: "from-cyan-500/15 to-blue-600/10",
  },
  {
    id: "video-repurpose",
    name: "Video Repurpose",
    description: "YouTube description + TikTok script + social hooks",
    icon: Video,
    formats: ["youtube_description", "tiktok_script", "twitter_thread"],
    gradient: "from-amber-500/15 to-orange-600/10",
  },
  {
    id: "thought-leadership",
    name: "Thought Leadership",
    description: "LinkedIn post + thread + newsletter snippet",
    icon: FileText,
    formats: ["linkedin_post", "twitter_thread", "email_newsletter"],
    gradient: "from-emerald-500/15 to-teal-600/10",
    badge: "Pro",
  },
];

export const STUDIO_TEMPLATES: StudioTemplate[] = [
  {
    id: "youtube-social",
    name: "YouTube → Full Social Kit",
    description: "Turn your video into a complete cross-platform social package",
    icon: Video,
    formats: [
      "twitter_thread",
      "linkedin_post",
      "instagram_carousel",
      "tiktok_script",
      "youtube_description",
    ],
    gradient: "from-violet-500/20 to-purple-600/10",
  },
  {
    id: "blog-plan",
    name: "Blog → 30-Day Content Plan",
    description: "Repurpose one article into a month of social content",
    icon: BookOpen,
    formats: [
      "twitter_thread",
      "linkedin_post",
      "instagram_caption",
      "facebook_post",
      "threads_post",
      "pinterest_pin",
    ],
    gradient: "from-cyan-500/20 to-blue-600/10",
  },
  {
    id: "newsletter-blast",
    name: "Newsletter → Multi-Channel Blast",
    description: "Expand your newsletter into every major platform",
    icon: Mail,
    formats: [
      "email_newsletter",
      "linkedin_post",
      "twitter_thread",
      "facebook_post",
      "seo_blog",
    ],
    gradient: "from-emerald-500/20 to-teal-600/10",
  },
  {
    id: "podcast-clips",
    name: "Podcast → Clip Scripts",
    description: "Extract short-form video scripts and social hooks",
    icon: Sparkles,
    formats: [
      "tiktok_script",
      "youtube_chapters",
      "twitter_thread",
      "instagram_caption",
      "threads_post",
    ],
    gradient: "from-amber-500/20 to-orange-600/10",
  },
  {
    id: "sales-funnel",
    name: "Content → Sales Funnel",
    description: "Build ad copy, lead magnets, and nurture emails",
    icon: Megaphone,
    formats: ["ad_copy", "lead_magnet", "email_newsletter", "linkedin_post"],
    gradient: "from-rose-500/20 to-pink-600/10",
  },
  {
    id: "seo-suite",
    name: "Article → SEO Suite",
    description: "Maximize search visibility across formats",
    icon: Search,
    formats: [
      "seo_blog",
      "linkedin_article",
      "youtube_description",
      "pinterest_pin",
      "email_newsletter",
    ],
    gradient: "from-indigo-500/20 to-violet-600/10",
  },
];

export function formatLabel(format: ContentFormat | string): string {
  if (format in FORMAT_META) {
    return FORMAT_META[format as ContentFormat].label;
  }
  return format.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function outputFormatLabel(format: string): string {
  const snake = format.toLowerCase();
  if (snake in FORMAT_META) {
    return FORMAT_META[snake as ContentFormat].label;
  }
  return format.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getFormatCredits(formats: ContentFormat[]): number {
  return getCreditCost(formats);
}
/** Maps RepurAI output formats to Ayrshare platform identifiers. */
const FORMAT_TO_AYRSHARE: Record<string, string> = {
  TWITTER_THREAD: "twitter",
  THREAD_HOOKS: "twitter",
  LINKEDIN_POST: "linkedin",
  LINKEDIN_ARTICLE: "linkedin",
  INSTAGRAM_CAPTION: "instagram",
  INSTAGRAM_CAROUSEL: "instagram",
  FACEBOOK_POST: "facebook",
  THREADS_POST: "threads",
  TIKTOK_SCRIPT: "tiktok",
  YOUTUBE_DESCRIPTION: "youtube",
  PINTEREST_PIN: "pinterest",
  SHORTS_SCRIPT: "youtube",
};

const FORMAT_TO_AYRSHARE_SNAKE: Record<string, string> = {
  twitter_thread: "twitter",
  thread_hooks: "twitter",
  linkedin_post: "linkedin",
  linkedin_article: "linkedin",
  instagram_caption: "instagram",
  instagram_carousel: "instagram",
  facebook_post: "facebook",
  threads_post: "threads",
  tiktok_script: "tiktok",
  youtube_description: "youtube",
  pinterest_pin: "pinterest",
  shorts_script: "youtube",
};

export const AYRSHARE_PLATFORM_LABELS: Record<string, string> = {
  bluesky: "Bluesky",
  facebook: "Facebook",
  gmb: "Google Business",
  instagram: "Instagram",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
  reddit: "Reddit",
  snapchat: "Snapchat",
  telegram: "Telegram",
  threads: "Threads",
  tiktok: "TikTok",
  twitter: "X (Twitter)",
  youtube: "YouTube",
};

export function formatToAyrsharePlatform(format: string): string | null {
  const upper = format.toUpperCase().replace(/-/g, "_");
  if (FORMAT_TO_AYRSHARE[upper]) return FORMAT_TO_AYRSHARE[upper];
  const lower = format.toLowerCase().replace(/-/g, "_");
  return FORMAT_TO_AYRSHARE_SNAKE[lower] ?? null;
}

export function isPublishableFormat(format: string): boolean {
  return formatToAyrsharePlatform(format) !== null;
}

export function pickConnectedPlatform(
  format: string,
  connected: string[],
): string | null {
  const platform = formatToAyrsharePlatform(format);
  if (!platform) return null;
  return connected.includes(platform) ? platform : null;
}
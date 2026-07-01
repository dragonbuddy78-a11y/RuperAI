import * as cheerio from "cheerio";
import { PDFParse } from "pdf-parse";
import { YoutubeTranscript } from "youtube-transcript";
import type { ExtractedContent, SourceType } from "@/types";

const MAX_CONTENT_LENGTH = 100_000;
const FETCH_TIMEOUT_MS = 15_000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; RepurAI/1.0; +https://repurai.com)";

function truncateContent(text: string, maxLength = MAX_CONTENT_LENGTH): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength)}…`;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      redirect: "follow",
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function extractFromUrl(url: string): Promise<ExtractedContent> {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("Invalid URL provided");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are supported");
  }

  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  $("script, style, nav, footer, header, aside, iframe, noscript, .ad, .advertisement, .sidebar, .comments, .comment-section, .social-share, .newsletter-signup").remove();

  const title =
    $("meta[property='og:title']").attr("content") ||
    $("meta[name='twitter:title']").attr("content") ||
    $("title").text().trim() ||
    $("h1").first().text().trim() ||
    undefined;

  const author =
    $("meta[name='author']").attr("content") ||
    $("[rel='author']").text().trim() ||
    $(".author, .byline, [class*='author']").first().text().trim() ||
    undefined;

  const publishedDate =
    $("meta[property='article:published_time']").attr("content") ||
    $("time[datetime]").attr("datetime") ||
    undefined;

  const description =
    $("meta[property='og:description']").attr("content") ||
    $("meta[name='description']").attr("content") ||
    undefined;

  const contentSelectors = [
    "article",
    "[role='main']",
    "main",
    ".post-content",
    ".entry-content",
    ".article-content",
    ".article-body",
    ".blog-post",
    ".content",
    "#content",
    ".post",
  ];

  let content = "";
  for (const selector of contentSelectors) {
    const element = $(selector);
    if (element.length > 0) {
      content = element
        .find("p, h1, h2, h3, h4, h5, h6, li, blockquote")
        .map((_, el) => $(el).text().trim())
        .get()
        .filter(Boolean)
        .join("\n\n");
      if (content.length > 200) break;
    }
  }

  if (!content || content.length < 200) {
    content = $("p")
      .map((_, el) => $(el).text().trim())
      .get()
      .filter((text) => text.length > 40)
      .join("\n\n");
  }

  if (!content || content.length < 100) {
    throw new Error("Could not extract meaningful content from this URL");
  }

  const finalContent = truncateContent(content);

  return {
    title,
    content: finalContent,
    wordCount: countWords(finalContent),
    metadata: {
      url,
      author,
      publishedDate,
      description,
      source: "url",
    },
  };
}

export async function extractFromYouTube(url: string): Promise<ExtractedContent> {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    throw new Error("Invalid YouTube URL or video ID");
  }

  let transcript;
  try {
    transcript = await YoutubeTranscript.fetchTranscript(videoId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    if (message.includes("Transcript is disabled")) {
      throw new Error(
        "This video has no captions on YouTube (transcripts are disabled by the creator). Use a video that has subtitles, or switch to the Paste Text tab and paste the script or notes manually.",
      );
    }

    if (message.includes("No transcript")) {
      throw new Error(
        "No transcript found for this video. Make sure the video has captions/subtitles enabled on YouTube.",
      );
    }

    throw new Error(`Could not extract YouTube content: ${message}`);
  }

  if (!transcript.length) {
    throw new Error("No transcript available for this video");
  }

  const content = truncateContent(
    transcript.map((segment) => segment.text).join(" ")
  );

  if (content.length < 50) {
    throw new Error("Transcript too short to repurpose");
  }

  const durationSeconds = transcript.reduce(
    (max, segment) => Math.max(max, (segment.offset + segment.duration) / 1000),
    0
  );

  return {
    title: `YouTube Video ${videoId}`,
    content,
    wordCount: countWords(content),
    metadata: {
      videoId,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      durationSeconds: Math.round(durationSeconds),
      segmentCount: transcript.length,
      source: "youtube",
    },
  };
}

export async function extractFromPdf(buffer: Buffer): Promise<ExtractedContent> {
  if (!buffer || buffer.length === 0) {
    throw new Error("Empty PDF buffer provided");
  }

  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    const content = truncateContent(result.text ?? "");

    if (!content || content.length < 50) {
      throw new Error("Could not extract meaningful text from PDF");
    }

    let title: string | undefined;
    try {
      const info = await parser.getInfo();
      title = info.info?.Title || undefined;
    } catch {
      // Title extraction is optional
    }

    return {
      title,
      content,
      wordCount: countWords(content),
      metadata: {
        pageCount: result.total,
        source: "pdf",
      },
    };
  } finally {
    await parser.destroy();
  }
}

export function extractFromText(text: string): ExtractedContent {
  if (!text?.trim()) {
    throw new Error("Text content is empty");
  }

  const content = truncateContent(text);

  return {
    content,
    wordCount: countWords(content),
    metadata: { source: "text" },
  };
}

export async function extractContent(
  sourceType: SourceType,
  input: string | Buffer
): Promise<ExtractedContent> {
  switch (sourceType) {
    case "url":
      if (typeof input !== "string") {
        throw new Error("URL extraction requires a string input");
      }
      return extractFromUrl(input);

    case "youtube":
      if (typeof input !== "string") {
        throw new Error("YouTube extraction requires a URL string");
      }
      return extractFromYouTube(input);

    case "pdf":
      if (!Buffer.isBuffer(input)) {
        throw new Error("PDF extraction requires a Buffer input");
      }
      return extractFromPdf(input);

    case "text":
    case "file":
    case "audio":
      if (typeof input !== "string") {
        throw new Error("Text extraction requires a string input");
      }
      return extractFromText(input);

    default:
      throw new Error(`Unsupported source type: ${sourceType}`);
  }
}
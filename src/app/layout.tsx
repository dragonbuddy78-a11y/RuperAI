import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";

import { Providers } from "@/components/providers";

import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "RepurAI — AI Content Repurposing Platform",
    template: "%s | RepurAI",
  },
  description:
    "Transform your content into platform-ready posts, threads, and campaigns with AI-powered repurposing.",
  keywords: [
    "content repurposing",
    "AI content",
    "social media",
    "content marketing",
    "RepurAI",
  ],
  authors: [{ name: "RepurAI" }],
  creator: "RepurAI",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "RepurAI",
    title: "RepurAI — AI Content Repurposing Platform",
    description:
      "Transform your content into platform-ready posts, threads, and campaigns with AI-powered repurposing.",
  },
  twitter: {
    card: "summary_large_image",
    title: "RepurAI — AI Content Repurposing Platform",
    description:
      "Transform your content into platform-ready posts, threads, and campaigns with AI-powered repurposing.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
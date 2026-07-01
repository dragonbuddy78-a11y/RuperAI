"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Check,
  Coins,
  FileText,
  Globe,
  Layers,
  Mic,
  Quote,
  Sparkles,
  Star,
  Upload,
  Wand2,
  Zap,
} from "lucide-react";

import { BetaBanner } from "@/components/marketing/beta-banner";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { Footer } from "@/components/marketing/footer";
import {
  FadeIn,
  StaggerContainer,
  StaggerItem,
} from "@/components/marketing/motion";
import { Navbar } from "@/components/marketing/navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isBetaFreePro } from "@/lib/beta";
import { PLANS } from "@/lib/plans";

const features = [
  {
    icon: Wand2,
    title: "AI Repurposing Engine",
    description: "Transform any source into platform-native copy in seconds.",
  },
  {
    icon: Layers,
    title: "20+ Output Formats",
    description: "Threads, carousels, newsletters, scripts, and more.",
    highlight: false,
  },
  {
    icon: Sparkles,
    title: "Monetization Studio",
    description: "Sales pages, email sequences, lead magnets, and pricing strategy.",
    highlight: true,
  },
  {
    icon: Globe,
    title: "URL & Blog Extraction",
    description: "Paste a link and pull clean content automatically.",
  },
  {
    icon: Mic,
    title: "YouTube Transcripts",
    description: "Repurpose long-form video into short-form gold.",
  },
  {
    icon: Upload,
    title: "PDF & File Upload",
    description: "Upload documents and extract repurposable content.",
  },
  {
    icon: FileText,
    title: "Brand Voice Control",
    description: "Set tone, audience, and voice for consistent output.",
  },
  {
    icon: Zap,
    title: "Bulk Repurpose",
    description: "Generate multiple formats in a single workflow.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track usage, credits, and content performance.",
  },
  {
    icon: Coins,
    title: "Smart Credit System",
    description: "Transparent usage with monthly credit allocations.",
  },
  {
    icon: Check,
    title: "One-Click Export",
    description: "Copy, download, and ship assets without friction.",
  },
  {
    icon: Star,
    title: "SEO-Optimized Content",
    description: "Meta descriptions, blog posts, and search-ready copy.",
  },
];

const steps = [
  {
    step: "01",
    title: "Add your source",
    description: "Paste text, drop a URL, upload a PDF, or import a YouTube video.",
    icon: Upload,
  },
  {
    step: "02",
    title: "Pick your formats",
    description: "Choose from 20+ outputs tailored to each platform's best practices.",
    icon: Layers,
  },
  {
    step: "03",
    title: "Generate & refine",
    description: "AI drafts platform-ready assets you can edit, export, and publish.",
    icon: Wand2,
  },
  {
    step: "04",
    title: "Monetize",
    description: "Turn insights into sales pages, funnels, and revenue-ready campaigns.",
    icon: Sparkles,
  },
];

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Newsletter creator · 42k subscribers",
    quote:
      "I used to spend 6 hours repurposing each podcast episode. RepurAI gets me 40+ assets in under 20 minutes. My LinkedIn grew 3x in two months.",
    avatar: "SC",
  },
  {
    name: "Marcus Rivera",
    role: "Agency founder",
    quote:
      "We white-label outputs for 12 clients. The Monetization Studio alone paid for Pro in the first week — sales page drafts that actually convert.",
    avatar: "MR",
  },
  {
    name: "Priya Patel",
    role: "Course creator",
    quote:
      "From one webinar recording I got email sequences, ad copy, and a lead magnet outline. It feels like having a content team on demand.",
    avatar: "PP",
  },
];

const faqItems = [
  {
    question: "What types of content can I repurpose?",
    answer:
      "RepurAI supports text, URLs, YouTube videos, PDFs, and uploaded files. Paste a blog post, drop a podcast transcript, or import a video — we'll extract and transform it into platform-ready assets.",
  },
  {
    question: "How many outputs can I generate from one piece of content?",
    answer:
      "Depending on your plan, you can generate 3 to unlimited formats per repurpose. Pro users routinely create 50+ assets from a single long-form source across social, email, SEO, and monetization formats.",
  },
  {
    question: "What is the Monetization Studio?",
    answer:
      "Monetization Studio is RepurAI's revenue layer — generate sales pages, email sequences, course outlines, affiliate scripts, lead magnets, and pricing strategies from your existing content.",
  },
  {
    question: "How do credits work?",
    answer:
      "Each generation uses credits based on the formats and features you use. Free plans include 50 credits per month; Pro includes 2,000. Unused credits don't roll over, but you can upgrade anytime.",
  },
  {
    question: "Can I cancel my subscription?",
    answer:
      "Yes. Cancel anytime from your billing settings. You'll keep Pro access until the end of your billing period, then revert to the Free plan with its included credits.",
  },
  {
    question: "Is my content used to train AI models?",
    answer:
      "No. Your content is processed only to generate your outputs and is not used to train third-party models. We take data privacy seriously.",
  },
];

function HeroMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.3 }}
      className="relative mx-auto mt-16 max-w-4xl"
    >
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/20 via-violet-500/10 to-cyan-500/20 blur-2xl" />
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-2xl backdrop-blur">
        <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-green-500/80" />
          <span className="ml-2 text-xs text-muted-foreground">RepurAI Studio</span>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-3 sm:p-6">
          <div className="rounded-xl border border-border/50 bg-background/60 p-4 sm:col-span-1">
            <p className="text-xs font-medium text-primary">Source</p>
            <p className="mt-2 text-sm text-muted-foreground line-clamp-4">
              How I built a $10k/mo content business with one weekly newsletter...
            </p>
          </div>
          <div className="space-y-2 sm:col-span-2">
            {[
              { label: "Twitter Thread", chars: "12 tweets" },
              { label: "LinkedIn Post", chars: "1,240 chars" },
              { label: "Email Sequence", chars: "5 emails" },
              { label: "Sales Page", chars: "Monetization" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-lg border border-border/40 bg-background/40 px-3 py-2"
              >
                <span className="text-sm">{item.label}</span>
                <Badge variant="secondary" className="text-xs">
                  {item.chars}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function LandingPage() {
  const freePlan = PLANS.FREE;
  const proPlan = PLANS.PRO;
  const betaMode = isBetaFreePro();

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-background to-background" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <FadeIn>
            <Badge variant="secondary" className="mb-6 border-primary/20 bg-primary/10 text-primary">
              AI-powered content repurposing
            </Badge>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl lg:leading-[1.1]">
              Turn one piece of content into{" "}
              <span className="bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent">
                50+ revenue-ready assets
              </span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
              Repurpose blogs, videos, and podcasts into social posts, emails, SEO
              content, and monetization funnels — in minutes, not days.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button size="lg" className="h-12 px-8 text-base" asChild>
                <Link href="/sign-up">
                  Start free — 50 credits
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-12 px-8 text-base" asChild>
                <Link href="#how-it-works">See how it works</Link>
              </Button>
            </div>
          </FadeIn>

          <HeroMockup />
        </div>
      </section>

      {/* Problem / Solution */}
      <section className="border-y border-border/40 bg-card/20 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <FadeIn>
              <div>
                <Badge variant="outline" className="mb-4 text-destructive border-destructive/30">
                  The problem
                </Badge>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  Great content dies on one platform
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  You spend hours creating a newsletter, podcast, or video — then
                  manually rewrite it for Twitter, LinkedIn, email, and ads. Most
                  creators never finish. The best ideas stay buried in a single format.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "6+ hours to manually repurpose one piece",
                    "Inconsistent voice across platforms",
                    "No time for monetization assets",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-destructive/80" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8">
                <Badge className="mb-4">The solution</Badge>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  One source → every channel
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed">
                  RepurAI ingests your content once and generates dozens of
                  platform-optimized outputs — plus revenue assets through
                  Monetization Studio.
                </p>
                <ul className="mt-6 space-y-3">
                  {[
                    "50+ assets from a single upload",
                    "Brand voice applied consistently",
                    "Sales pages & funnels included",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Four steps from raw content to revenue-ready distribution.
            </p>
          </FadeIn>

          <StaggerContainer className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((item) => (
              <StaggerItem key={item.step}>
                <Card className="h-full border-border/60 bg-card/50 transition-colors hover:border-primary/30">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-primary">{item.step}</span>
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </CardHeader>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-y border-border/40 bg-card/20 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to scale content
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              From extraction to monetization — one platform, unlimited possibilities.
            </p>
          </FadeIn>

          <StaggerContainer className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <StaggerItem key={feature.title}>
                <Card
                  className={
                    feature.highlight
                      ? "h-full border-primary/40 bg-gradient-to-br from-primary/10 to-card/80 ring-1 ring-primary/20"
                      : "h-full border-border/60 bg-card/50"
                  }
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div
                        className={
                          feature.highlight
                            ? "flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20"
                            : "flex h-10 w-10 items-center justify-center rounded-lg bg-secondary"
                        }
                      >
                        <feature.icon
                          className={
                            feature.highlight ? "h-5 w-5 text-primary" : "h-5 w-5"
                          }
                        />
                      </div>
                      {feature.highlight && (
                        <Badge className="text-xs">Pro feature</Badge>
                      )}
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Loved by creators who ship
            </h2>
          </FadeIn>

          <StaggerContainer className="mt-16 grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <StaggerItem key={t.name}>
                <Card className="h-full border-border/60 bg-card/50">
                  <CardContent className="pt-6">
                    <Quote className="h-8 w-8 text-primary/40" />
                    <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                      &ldquo;{t.quote}&rdquo;
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                        {t.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="border-y border-border/40 bg-card/20 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {betaMode ? "Open beta — Pro is free" : "Simple, transparent pricing"}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              {betaMode
                ? "Sign up and get full Pro access while we build in the open."
                : "Start free. Upgrade when you're ready to scale."}
            </p>
          </FadeIn>

          {betaMode && (
            <div className="mx-auto mt-8 max-w-2xl">
              <BetaBanner />
            </div>
          )}

          <div
            className={`mx-auto mt-12 grid gap-6 ${
              betaMode ? "max-w-md" : "max-w-3xl sm:grid-cols-2"
            }`}
          >
            {!betaMode && (
            <FadeIn delay={0.1}>
              <Card className="border-border/60">
                <CardHeader>
                  <CardTitle>{freePlan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">$0</span>
                    <span className="text-muted-foreground">/mo</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {freePlan.creditsMonthly} credits/month
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {freePlan.maxFormatsPerRepurpose} formats per repurpose
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </FadeIn>
            )}

            <FadeIn delay={betaMode ? 0.1 : 0.2}>
              <Card className="border-primary/40 bg-gradient-to-b from-primary/10 to-card ring-1 ring-primary/20">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{proPlan.name}</CardTitle>
                    <Badge>{betaMode ? "Free beta" : "Popular"}</Badge>
                  </div>
                  <CardDescription>
                    {betaMode ? (
                      <>
                        <span className="text-3xl font-bold text-foreground">$0</span>
                        <span className="ml-2 text-muted-foreground line-through">
                          ${proPlan.priceMonthly}/mo
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-foreground">
                          ${proPlan.priceMonthly}
                        </span>
                        <span className="text-muted-foreground">/mo</span>
                      </>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {proPlan.creditsMonthly.toLocaleString()} credits/month
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      Unlimited formats + Monetization Studio
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </FadeIn>
          </div>

          <FadeIn className="mt-10 text-center">
            <Button size="lg" variant={betaMode ? "default" : "outline"} asChild>
              <Link href={betaMode ? "/sign-up" : "/pricing"}>
                {betaMode ? "Start free beta" : "Compare all plans"}
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Frequently asked questions
            </h2>
          </FadeIn>
          <div className="mt-12">
            <FaqAccordion items={faqItems} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card px-8 py-16 text-center sm:px-16">
              <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to multiply your content?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Join creators turning one piece of content into a full distribution
                engine. Start free today.
              </p>
              <Button size="lg" className="mt-8 h-12 px-8" asChild>
                <Link href="/sign-up">
                  Get started free
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      <Footer />
    </div>
  );
}
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { Check, Minus, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { BetaBanner } from "@/components/marketing/beta-banner";
import { FaqAccordion } from "@/components/marketing/faq-accordion";
import { Footer } from "@/components/marketing/footer";
import { FadeIn } from "@/components/marketing/motion";
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

const comparisonRows = [
  {
    feature: "Monthly credits",
    free: "50",
    pro: "2,000",
  },
  {
    feature: "Content uploads / month",
    free: "10",
    pro: "Unlimited",
  },
  {
    feature: "Formats per repurpose",
    free: "3",
    pro: "Unlimited",
  },
  {
    feature: "Basic formats (Twitter, LinkedIn, etc.)",
    free: true,
    pro: true,
  },
  {
    feature: "Advanced formats (SEO, scripts, carousels)",
    free: false,
    pro: true,
  },
  {
    feature: "Monetization Studio",
    free: false,
    pro: true,
  },
  {
    feature: "Analytics dashboard",
    free: false,
    pro: true,
  },
  {
    feature: "Bulk repurpose",
    free: false,
    pro: true,
  },
  {
    feature: "API access",
    free: false,
    pro: true,
  },
  {
    feature: "Priority support",
    free: false,
    pro: true,
  },
];

const pricingFaqBeta = [
  {
    question: "Is RepurAI really free right now?",
    answer:
      "Yes. During our open beta, every new account gets full Pro access — 2,000 credits, Monetization Studio, Brand Voice, Calendar, and all formats. No credit card required.",
  },
  {
    question: "What happens when I run out of credits?",
    answer:
      "You won't be able to generate until you get more credits. We're monitoring usage during beta and may adjust allocations based on feedback.",
  },
  {
    question: "Will Pro stay free forever?",
    answer:
      "No — this is a limited beta to gather feedback. When we launch paid plans, early testers will get a heads-up and special pricing.",
  },
  {
    question: "How can I give feedback?",
    answer:
      "Use the product, note what you love and what's broken, and share it with us. Your input directly shapes what we build next.",
  },
];

const pricingFaq = [
  {
    question: "Can I try RepurAI before paying?",
    answer:
      "Yes. The Free plan includes 50 credits per month — enough to repurpose several pieces of content and explore the platform. No credit card required.",
  },
  {
    question: "What happens when I run out of credits?",
    answer:
      "You won't be able to generate new content until your credits refresh next month, or you upgrade to Pro for 2,000 monthly credits.",
  },
  {
    question: "Can I switch between plans?",
    answer:
      "Absolutely. Upgrade to Pro anytime from billing settings. Downgrade at the end of your billing cycle — you'll keep Pro access until then.",
  },
  {
    question: "Is there a refund policy?",
    answer:
      "If Pro doesn't meet your expectations within the first 7 days, contact support for a full refund. We want you to love the product.",
  },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") {
    return <span className="text-sm font-medium">{value}</span>;
  }
  return value ? (
    <Check className="mx-auto h-4 w-4 text-primary" />
  ) : (
    <Minus className="mx-auto h-4 w-4 text-muted-foreground/50" />
  );
}

export default function PricingPage() {
  const { data: session } = useSession();
  const [upgrading, setUpgrading] = useState(false);

  const betaMode = isBetaFreePro();
  const freePlan = PLANS.FREE;
  const proPlan = PLANS.PRO;
  const isPro = session?.user?.plan === "PRO";
  const faqItems = betaMode ? pricingFaqBeta : pricingFaq;

  async function handleUpgrade() {
    if (!session) {
      window.location.href = "/sign-up";
      return;
    }

    setUpgrading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Failed to start checkout");
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
      setUpgrading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-28 pb-16 sm:pt-36">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <FadeIn>
            <Badge variant="secondary" className="mb-4 border-primary/20 bg-primary/10 text-primary">
              {betaMode ? "Open Beta" : "Pricing"}
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              {betaMode ? "Pro is free during beta" : "Choose your plan"}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              {betaMode
                ? "Sign up and get full Pro access — help us test, break things, and tell us what to improve."
                : "Start free, upgrade when you need more credits, formats, and monetization tools."}
            </p>
          </FadeIn>

          {betaMode && (
            <div className="mx-auto mt-8 max-w-2xl">
              <BetaBanner />
            </div>
          )}

          <div
            className={`mx-auto mt-16 grid gap-8 ${
              betaMode ? "max-w-lg" : "max-w-4xl lg:grid-cols-2"
            }`}
          >
            {!betaMode && (
            <FadeIn delay={0.1}>
              <Card className="h-full border-border/60 text-left">
                <CardHeader>
                  <CardTitle className="text-2xl">{freePlan.name}</CardTitle>
                  <CardDescription>For getting started</CardDescription>
                  <div className="pt-2">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3 text-sm">
                    {[
                      `${freePlan.creditsMonthly} credits per month`,
                      `${freePlan.maxContentPerMonth} content uploads`,
                      `${freePlan.maxFormatsPerRepurpose} formats per repurpose`,
                      "Basic social formats",
                      "Community support",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/sign-up">Sign up free</Link>
                  </Button>
                </CardContent>
              </Card>
            </FadeIn>
            )}

            <FadeIn delay={betaMode ? 0.1 : 0.2}>
              <Card className="relative h-full border-primary/40 bg-gradient-to-b from-primary/10 to-card text-left ring-1 ring-primary/20">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="shadow-lg">
                    {betaMode ? "Free during beta" : "Most popular"}
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Sparkles className="h-5 w-5 text-primary" />
                    {proPlan.name}
                  </CardTitle>
                  <CardDescription>
                    {betaMode ? "Full access for testers" : "For serious creators"}
                  </CardDescription>
                  <div className="pt-2">
                    {betaMode ? (
                      <>
                        <span className="text-4xl font-bold">$0</span>
                        <span className="ml-2 text-lg text-muted-foreground line-through">
                          ${proPlan.priceMonthly}/mo
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-4xl font-bold">
                          ${proPlan.priceMonthly}
                        </span>
                        <span className="text-muted-foreground">/month</span>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-3 text-sm">
                    {[
                      `${proPlan.creditsMonthly.toLocaleString()} credits`,
                      "Unlimited content uploads",
                      "Unlimited formats per repurpose",
                      "Monetization Studio",
                      "Brand Voice & Calendar",
                      "Analytics dashboard",
                    ].map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  {betaMode ? (
                    <Button className="w-full" asChild>
                      <Link href={session ? "/studio" : "/sign-up"}>
                        {session ? "Go to Studio" : "Start free beta"}
                      </Link>
                    </Button>
                  ) : isPro ? (
                    <Button className="w-full" disabled>
                      Current plan
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={handleUpgrade}
                      disabled={upgrading}
                    >
                      {upgrading
                        ? "Redirecting..."
                        : session
                          ? "Upgrade to Pro"
                          : "Get started with Pro"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section className="border-y border-border/40 bg-card/20 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              Feature comparison
            </h2>
          </FadeIn>

          <FadeIn delay={0.1}>
            <div className="mt-10 overflow-hidden rounded-xl border border-border/60">
              <div className="grid grid-cols-3 border-b border-border/60 bg-card/80 px-4 py-4 text-sm font-semibold sm:px-6">
                <span>Feature</span>
                <span className="text-center">Free</span>
                <span className="text-center text-primary">Pro</span>
              </div>
              {comparisonRows.map((row, i) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-3 items-center px-4 py-3 text-sm sm:px-6 ${
                    i % 2 === 0 ? "bg-background/40" : ""
                  }`}
                >
                  <span className="text-muted-foreground">{row.feature}</span>
                  <div className="text-center">
                    <FeatureCell value={row.free} />
                  </div>
                  <div className="text-center">
                    <FeatureCell value={row.pro} />
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn className="text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Pricing FAQ
            </h2>
          </FadeIn>
          <div className="mt-10">
            <FaqAccordion items={faqItems} />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
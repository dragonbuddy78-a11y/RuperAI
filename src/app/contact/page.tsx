import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageSquare, Shield } from "lucide-react";

import { Footer } from "@/components/marketing/footer";
import { Navbar } from "@/components/marketing/navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Contact | RepurAI",
  description: "Get in touch with the RepurAI team for support, billing, or feedback.",
};

const contactOptions = [
  {
    icon: Mail,
    title: "General support",
    description: "Account help, bugs, feature questions, and beta feedback.",
    email: LEGAL.supportEmail,
    subject: "RepurAI Support",
  },
  {
    icon: MessageSquare,
    title: "Billing & refunds",
    description: "Subscription, payment, or refund requests.",
    email: LEGAL.supportEmail,
    subject: "RepurAI Billing",
  },
  {
    icon: Shield,
    title: "Security & privacy",
    description: "Report vulnerabilities or privacy-related requests.",
    email: LEGAL.supportEmail,
    subject: "RepurAI Security",
  },
];

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-10 text-center">
          <p className="text-sm font-medium text-primary">Contact</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Get in touch
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-muted-foreground">
            We&apos;re a small team building in the open. We read every message
            and typically respond within 2–3 business days.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-1">
          {contactOptions.map((option) => (
            <Card key={option.title} className="border-border/60">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
                    <option.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{option.title}</CardTitle>
                    <CardDescription>{option.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full sm:w-auto">
                  <a
                    href={`mailto:${option.email}?subject=${encodeURIComponent(option.subject)}`}
                  >
                    <Mail className="h-4 w-4" />
                    {option.email}
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 rounded-xl border border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Before you email</p>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            <li>
              Check the{" "}
              <Link href="/pricing" className="text-primary hover:underline">
                Pricing FAQ
              </Link>{" "}
              for billing questions
            </li>
            <li>
              Read our{" "}
              <Link href="/refund" className="text-primary hover:underline">
                Refund Policy
              </Link>{" "}
              for refund eligibility
            </li>
            <li>Include your account email so we can find your account faster</li>
          </ul>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Last updated: {LEGAL.lastUpdated}
        </p>
      </main>
      <Footer />
    </div>
  );
}
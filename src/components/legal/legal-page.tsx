import Link from "next/link";
import type { ReactNode } from "react";

import { Footer } from "@/components/marketing/footer";
import { Navbar } from "@/components/marketing/navbar";
import { LEGAL } from "@/lib/legal";

interface LegalPageProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export function LegalPage({ title, description, children }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-10 border-b border-border/60 pb-8">
          <p className="text-sm font-medium text-primary">Legal</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">{description}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            Last updated: {LEGAL.lastUpdated} ·{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Contact us
            </Link>
          </p>
        </div>

        <div className="space-y-10">{children}</div>

        <div className="mt-12 rounded-xl border border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Related policies</p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            <li>
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/refund" className="text-primary hover:underline">
                Refund Policy
              </Link>
            </li>
            <li>
              <Link href="/cookies" className="text-primary hover:underline">
                Cookie Policy
              </Link>
            </li>
            <li>
              <Link href="/security" className="text-primary hover:underline">
                Security
              </Link>
            </li>
          </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
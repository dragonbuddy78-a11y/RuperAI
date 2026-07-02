import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Cookie Policy | RepurAI",
  description: "How RepurAI uses cookies and similar tracking technologies.",
};

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      description={`This policy explains how ${LEGAL.appName} uses cookies and similar technologies when you visit our website.`}
    >
      <LegalSection id="what" title="1. What are cookies?">
        <p>
          Cookies are small text files stored on your device when you visit a
          website. They help sites remember your preferences, keep you signed
          in, and understand how the service is used. We also use similar
          technologies such as local storage and session tokens.
        </p>
      </LegalSection>

      <LegalSection id="types" title="2. Cookies we use">
        <p className="font-medium text-foreground">Essential cookies (required)</p>
        <p>
          These are necessary for the Service to function. Without them, you
          cannot sign in or use core features.
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-foreground">Authentication session</strong> —
            Keeps you logged in securely (NextAuth / Auth.js session cookie)
          </li>
          <li>
            <strong className="text-foreground">Security tokens</strong> — CSRF
            protection for form submissions
          </li>
        </ul>

        <p className="font-medium text-foreground">Functional cookies</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Remember UI preferences and onboarding progress</li>
          <li>Maintain your session across page loads</li>
        </ul>

        <p className="font-medium text-foreground">Analytics cookies (if enabled)</p>
        <p>
          We may use privacy-friendly analytics to understand how visitors use
          our marketing pages and improve the product. These do not sell your
          data to advertisers.
        </p>
      </LegalSection>

      <LegalSection id="third-party" title="3. Third-party cookies">
        <p>Some third-party services may set their own cookies when you use {LEGAL.appName}:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-foreground">OAuth providers</strong> (Google,
            GitHub) — when you choose social sign-in
          </li>
          <li>
            <strong className="text-foreground">Payment processor</strong> (Lemon
            Squeezy) — when you purchase a paid plan
          </li>
          <li>
            <strong className="text-foreground">Hosting</strong> (Vercel) —
            infrastructure and performance
          </li>
        </ul>
        <p>
          These providers have their own cookie policies. We do not control
          third-party cookies.
        </p>
      </LegalSection>

      <LegalSection id="duration" title="4. How long cookies last">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-foreground">Session cookies</strong> — deleted
            when you close your browser
          </li>
          <li>
            <strong className="text-foreground">Persistent cookies</strong> —
            remain until they expire or you clear them (auth sessions typically
            last up to 30 days)
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="control" title="5. Your choices">
        <p>You can control cookies by:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Adjusting your browser settings to block or delete cookies</li>
          <li>Signing out of {LEGAL.appName} to end your session</li>
          <li>Using browser private/incognito mode</li>
        </ul>
        <p>
          Blocking essential cookies will prevent you from signing in and using
          the Service.
        </p>
      </LegalSection>

      <LegalSection id="do-not-track" title="6. Do Not Track">
        <p>
          Some browsers offer a &quot;Do Not Track&quot; signal. There is no
          industry standard for how to respond. We currently do not respond to
          DNT signals, but we minimize tracking to what is needed to operate the
          Service.
        </p>
      </LegalSection>

      <LegalSection id="updates" title="7. Updates">
        <p>
          We may update this Cookie Policy when our practices change. Check this
          page for the latest version. See also our{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection id="contact" title="8. Contact">
        <p>
          Questions?{" "}
          <a
            href={`mailto:${LEGAL.supportEmail}`}
            className="text-primary hover:underline"
          >
            {LEGAL.supportEmail}
          </a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Security | RepurAI",
  description:
    "How RepurAI protects your account, content, and data.",
};

export default function SecurityPage() {
  return (
    <LegalPage
      title="Security"
      description={`How we protect your account, content, and data at ${LEGAL.appName}.`}
    >
      <LegalSection id="commitment" title="1. Our commitment">
        <p>
          Security is core to {LEGAL.appName}. We handle your content, account
          credentials, and billing information with care. This page summarizes
          the measures we take — it is not a guarantee against all risks.
        </p>
      </LegalSection>

      <LegalSection id="infrastructure" title="2. Infrastructure">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-foreground">HTTPS everywhere</strong> — All
            traffic is encrypted in transit (TLS)
          </li>
          <li>
            <strong className="text-foreground">Hosted on Vercel</strong> —
            Industry-standard cloud infrastructure with automatic security
            patches
          </li>
          <li>
            <strong className="text-foreground">PostgreSQL on Neon</strong> —
            Managed database with encryption at rest and automated backups
          </li>
          <li>
            <strong className="text-foreground">Environment secrets</strong> —
            API keys and credentials are stored as encrypted environment
            variables, never in source code
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="account" title="3. Account security">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Passwords are hashed with bcrypt before storage — we never see or
            store your plain-text password
          </li>
          <li>Session tokens are signed and validated on each request</li>
          <li>OAuth sign-in available via Google and GitHub (when configured)</li>
          <li>You can delete your account and data from Settings</li>
        </ul>
        <p>
          Use a strong, unique password and enable 2FA on your email account for
          best protection.
        </p>
      </LegalSection>

      <LegalSection id="content" title="4. Your content">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Content you submit is stored in your private account — not publicly
            accessible to other users
          </li>
          <li>
            Input is sent to AI providers only to fulfill your generation
            requests
          </li>
          <li>We do not use your content to train AI models</li>
          <li>
            Account deletion removes your personal data within a reasonable
            period
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="payment" title="5. Payment security">
        <p>
          When paid billing is enabled, payments are handled by Lemon Squeezy (a
          PCI-compliant payment processor). {LEGAL.appName} does not store full
          credit card numbers on our servers.
        </p>
      </LegalSection>

      <LegalSection id="your-role" title="6. What you can do">
        <ul className="list-disc space-y-2 pl-5">
          <li>Use a strong password and do not share your account</li>
          <li>Sign out on shared or public devices</li>
          <li>Review AI-generated content before publishing</li>
          <li>Do not submit highly sensitive data you cannot afford to expose</li>
          <li>Report suspicious activity immediately</li>
        </ul>
      </LegalSection>

      <LegalSection id="incidents" title="7. Security incidents">
        <p>
          If we become aware of a data breach that affects your personal
          information, we will notify affected users and relevant authorities
          as required by applicable law.
        </p>
      </LegalSection>

      <LegalSection id="report" title="8. Report a vulnerability">
        <p>
          Found a security issue? Please report it responsibly to{" "}
          <a
            href={`mailto:${LEGAL.supportEmail}?subject=Security%20Report`}
            className="text-primary hover:underline"
          >
            {LEGAL.supportEmail}
          </a>{" "}
          with the subject line &quot;Security Report.&quot; Do not publicly
          disclose vulnerabilities before we have had a reasonable time to
          address them.
        </p>
      </LegalSection>

      <LegalSection id="more" title="9. More information">
        <p>
          See our{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>{" "}
          for additional details.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
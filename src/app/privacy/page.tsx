import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy | RepurAI",
  description:
    "How RepurAI collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description={`This policy explains what data ${LEGAL.appName} collects, how we use it, and the choices you have.`}
    >
      <LegalSection id="overview" title="1. Overview">
        <p>
          {LEGAL.companyName} (&quot;we,&quot; &quot;us&quot;) operates{" "}
          {LEGAL.appName}. We respect your privacy and are committed to handling
          your data responsibly. This Privacy Policy describes our practices when
          you visit {LEGAL.website} or use our application.
        </p>
      </LegalSection>

      <LegalSection id="collect" title="2. Information we collect">
        <p className="font-medium text-foreground">Account information</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Name and email address when you register</li>
          <li>
            Password (stored as a secure hash — we never store plain-text
            passwords)
          </li>
          <li>OAuth profile data if you sign in with Google or GitHub</li>
        </ul>

        <p className="font-medium text-foreground">Content you provide</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Text, URLs, files, audio, and other material you submit for
            repurposing
          </li>
          <li>Generated outputs, brand voice settings, and saved library items</li>
          <li>Scheduled posts and monetization project data</li>
        </ul>

        <p className="font-medium text-foreground">Usage information</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Credit usage, feature usage, and analytics within your dashboard</li>
          <li>Device, browser, and log data (IP address, timestamps, errors)</li>
          <li>Cookies and similar technologies (see our Cookie Policy)</li>
        </ul>

        <p className="font-medium text-foreground">Payment information</p>
        <p>
          When paid plans are available, payments are processed by Lemon
          Squeezy (or another payment processor). We do not store full credit
          card numbers on our servers.
        </p>
      </LegalSection>

      <LegalSection id="use" title="3. How we use your information">
        <p>We use your data to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Create and manage your account</li>
          <li>Provide AI content generation and related features</li>
          <li>Track credits, billing, and subscription status</li>
          <li>Improve reliability, security, and product experience</li>
          <li>Respond to support requests and send service-related notices</li>
          <li>Comply with legal obligations</li>
        </ul>
        <p>
          <strong className="text-foreground">
            We do not use your content to train AI models.
          </strong>{" "}
          Your Input is processed only to generate your requested Output and is
          stored in your account so you can access it later.
        </p>
      </LegalSection>

      <LegalSection id="sharing" title="4. How we share information">
        <p>We share data only with:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-foreground">AI providers</strong> (e.g. Groq)
            — to process your generation requests
          </li>
          <li>
            <strong className="text-foreground">Infrastructure providers</strong>{" "}
            — hosting (Vercel), database (Neon), and file storage as needed
          </li>
          <li>
            <strong className="text-foreground">Payment processors</strong> —
            when you purchase a paid plan
          </li>
          <li>
            <strong className="text-foreground">Legal authorities</strong> —
            when required by law or to protect rights and safety
          </li>
        </ul>
        <p>We do not sell your personal information.</p>
      </LegalSection>

      <LegalSection id="retention" title="5. Data retention">
        <p>
          We retain your account data and content for as long as your account is
          active. When you delete your account, we delete or anonymize your
          personal data within a reasonable period, except where retention is
          required for legal, security, or backup purposes.
        </p>
      </LegalSection>

      <LegalSection id="security" title="6. Security">
        <p>
          We use industry-standard measures including encrypted connections
          (HTTPS), hashed passwords, and access controls. No method of
          transmission or storage is 100% secure. See our{" "}
          <Link href="/security" className="text-primary hover:underline">
            Security page
          </Link>{" "}
          for more detail.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="7. Your rights">
        <p>Depending on your location, you may have the right to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Access, correct, or delete your personal data</li>
          <li>Export your data</li>
          <li>Object to or restrict certain processing</li>
          <li>Withdraw consent where processing is consent-based</li>
          <li>Lodge a complaint with a data protection authority</li>
        </ul>
        <p>
          To exercise these rights, email{" "}
          <a
            href={`mailto:${LEGAL.supportEmail}`}
            className="text-primary hover:underline"
          >
            {LEGAL.supportEmail}
          </a>{" "}
          or delete your account in Settings.
        </p>
      </LegalSection>

      <LegalSection id="international" title="8. International transfers">
        <p>
          Your data may be processed in the United States and other countries
          where our service providers operate. We take steps to ensure
          appropriate safeguards when data crosses borders.
        </p>
      </LegalSection>

      <LegalSection id="children" title="9. Children">
        <p>
          The Service is not directed to children under 16. We do not knowingly
          collect personal information from children. Contact us if you believe
          a child has provided us data.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="10. Changes to this policy">
        <p>
          We may update this Privacy Policy periodically. We will post changes
          on this page and update the &quot;Last updated&quot; date. Significant
          changes may be communicated by email or in-app notice.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="11. Contact us">
        <p>
          Privacy questions? Email{" "}
          <a
            href={`mailto:${LEGAL.supportEmail}`}
            className="text-primary hover:underline"
          >
            {LEGAL.supportEmail}
          </a>{" "}
          or visit{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Contact
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
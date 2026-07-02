import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Service | RepurAI",
  description:
    "Terms and conditions for using RepurAI, the AI content repurposing platform.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      description={`These terms govern your access to and use of ${LEGAL.appName}. By creating an account or using the service, you agree to these terms.`}
    >
      <LegalSection id="agreement" title="1. Agreement to terms">
        <p>
          These Terms of Service (&quot;Terms&quot;) constitute a binding
          agreement between you and {LEGAL.companyName} (&quot;we,&quot;
          &quot;us,&quot; or &quot;our&quot;) regarding your use of the{" "}
          {LEGAL.appName} website and application at{" "}
          <Link href={LEGAL.website} className="text-primary hover:underline">
            {LEGAL.website}
          </Link>{" "}
          (the &quot;Service&quot;).
        </p>
        <p>
          If you do not agree to these Terms, do not use the Service. We may
          update these Terms from time to time. Material changes will be posted
          on this page with an updated date. Continued use after changes means
          you accept the revised Terms.
        </p>
      </LegalSection>

      <LegalSection id="eligibility" title="2. Eligibility">
        <p>
          You must be at least 16 years old (or the age of digital consent in
          your country) to use the Service. By using {LEGAL.appName}, you
          represent that you meet this requirement and that the information you
          provide is accurate.
        </p>
      </LegalSection>

      <LegalSection id="account" title="3. Your account">
        <p>
          You are responsible for maintaining the confidentiality of your login
          credentials and for all activity under your account. Notify us
          immediately at{" "}
          <a
            href={`mailto:${LEGAL.supportEmail}`}
            className="text-primary hover:underline"
          >
            {LEGAL.supportEmail}
          </a>{" "}
          if you suspect unauthorized access.
        </p>
        <p>
          You may not share your account, resell access, or use the Service for
          unlawful purposes, spam, harassment, or generating content that
          violates applicable law or third-party rights.
        </p>
      </LegalSection>

      <LegalSection id="service" title="4. The service">
        <p>
          {LEGAL.appName} is an AI-powered content repurposing tool. You may
          submit text, URLs, files, audio, or other content (&quot;Input&quot;)
          and receive generated outputs (&quot;Output&quot;) in various formats
          for social media, email, SEO, and monetization workflows.
        </p>
        <p>
          The Service is provided on an &quot;as is&quot; and &quot;as
          available&quot; basis. AI-generated Output may contain errors,
          inaccuracies, or content that requires human review before
          publication. You are solely responsible for reviewing, editing, and
          approving Output before use.
        </p>
      </LegalSection>

      <LegalSection id="content" title="5. Your content">
        <p>
          You retain ownership of your Input. You grant us a limited license to
          process Input solely to provide the Service — including transmitting
          it to AI providers (such as Groq) for generation, storage in your
          account, and display in your library.
        </p>
        <p>
          You represent that you have the rights to submit Input and that your
          use of Output will not infringe any copyright, trademark, privacy, or
          other rights. Do not submit confidential information you are not
          authorized to share.
        </p>
      </LegalSection>

      <LegalSection id="ai" title="6. AI and third-party services">
        <p>
          {LEGAL.appName} uses third-party AI and infrastructure providers. Your
          Input is sent to these providers only to fulfill your requests. We do
          not use your content to train our own models. Third-party providers
          have their own terms and privacy practices.
        </p>
        <p>
          Output is not guaranteed to be unique, accurate, or fit for any
          particular purpose. You must not rely on Output as legal, financial,
          medical, or professional advice.
        </p>
      </LegalSection>

      <LegalSection id="credits" title="7. Credits, plans, and billing">
        <p>
          The Service uses a credit-based system. Credits are consumed when you
          generate content, transcribe audio, or use certain features. Credit
          costs are displayed before use where applicable.
        </p>
        <p>
          During our open beta, Pro features may be offered at no charge. When
          paid plans launch, pricing, billing cycles, and payment processing
          (via Lemon Squeezy or another processor) will be described at
          checkout. Paid subscriptions renew automatically unless canceled
          before the renewal date.
        </p>
        <p>
          See our{" "}
          <Link href="/refund" className="text-primary hover:underline">
            Refund Policy
          </Link>{" "}
          for information about refunds on paid subscriptions.
        </p>
      </LegalSection>

      <LegalSection id="prohibited" title="8. Prohibited uses">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Violate any law or regulation</li>
          <li>Generate spam, malware, hate speech, or deceptive content</li>
          <li>Attempt to reverse engineer, scrape, or overload the Service</li>
          <li>Circumvent credit limits, access controls, or security measures</li>
          <li>Impersonate others or misrepresent your affiliation</li>
          <li>
            Use the Service in ways that harm {LEGAL.appName}, other users, or
            third parties
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="termination" title="9. Suspension and termination">
        <p>
          We may suspend or terminate your account if you violate these Terms or
          if we reasonably believe your use poses risk to the Service or others.
          You may delete your account at any time from Settings.
        </p>
        <p>
          Upon termination, your right to use the Service ends. Provisions that
          by nature should survive (including limitations of liability and
          dispute terms) will survive.
        </p>
      </LegalSection>

      <LegalSection id="disclaimer" title="10. Disclaimers">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SERVICE IS PROVIDED
          WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING
          MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
          NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE
          UNINTERRUPTED, ERROR-FREE, OR SECURE.
        </p>
      </LegalSection>

      <LegalSection id="liability" title="11. Limitation of liability">
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, {LEGAL.companyName} AND ITS
          OPERATORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR
          GOODWILL, ARISING FROM YOUR USE OF THE SERVICE.
        </p>
        <p>
          Our total liability for any claim relating to the Service shall not
          exceed the greater of (a) the amount you paid us in the twelve months
          before the claim, or (b) fifty US dollars ($50).
        </p>
      </LegalSection>

      <LegalSection id="indemnity" title="12. Indemnification">
        <p>
          You agree to indemnify and hold harmless {LEGAL.companyName} from claims
          arising out of your Input, your use of Output, your violation of these
          Terms, or your violation of any third-party rights.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="13. Contact">
        <p>
          Questions about these Terms? Email{" "}
          <a
            href={`mailto:${LEGAL.supportEmail}`}
            className="text-primary hover:underline"
          >
            {LEGAL.supportEmail}
          </a>{" "}
          or visit our{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Contact page
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
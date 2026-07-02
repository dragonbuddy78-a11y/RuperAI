import type { Metadata } from "next";
import Link from "next/link";

import { LegalPage, LegalSection } from "@/components/legal/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Refund Policy | RepurAI",
  description:
    "RepurAI refund policy for subscriptions, credits, and open beta access.",
};

export default function RefundPage() {
  return (
    <LegalPage
      title="Refund Policy"
      description="Clear rules for refunds on paid plans, credits, and billing disputes."
    >
      <LegalSection id="summary" title="1. Summary">
        <p>
          We want you to be happy with {LEGAL.appName}. This Refund Policy
          explains when you can receive a refund for paid subscriptions and
          related charges. During our open beta, Pro access is free — no payment
          is required.
        </p>
      </LegalSection>

      <LegalSection id="beta" title="2. Open beta (current)">
        <p>
          While {LEGAL.appName} is in open beta, new accounts receive Pro
          features at no cost. Because no payment is collected during beta, no
          refund applies — there is nothing to refund.
        </p>
        <p>
          Beta access, credit allocations, and features may change as we improve
          the product. We will provide notice before enabling paid billing.
        </p>
      </LegalSection>

      <LegalSection id="subscriptions" title="3. Paid subscriptions">
        <p>When paid Pro or other plans launch, the following applies:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-foreground">7-day money-back guarantee</strong>{" "}
            — If you subscribe to a paid plan and are not satisfied, contact us
            within 7 days of your first payment for a full refund of that
            payment.
          </li>
          <li>
            <strong className="text-foreground">Renewals</strong> — Subscription
            renewals are generally non-refundable. Cancel before your renewal
            date to avoid future charges.
          </li>
          <li>
            <strong className="text-foreground">Annual plans</strong> — Refund
            requests within 14 days of purchase may receive a prorated refund at
            our discretion.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="credits" title="4. Credits">
        <p>
          Credits are consumed when you use AI generation and related features.
          Used credits are non-refundable because the underlying AI processing
          cost has already been incurred.
        </p>
        <p>
          <strong className="text-foreground">Failed generations:</strong> If a
          generation fails due to a system error on our side, credits are
          automatically returned to your account. You do not need to request a
          refund for failed generations.
        </p>
        <p>
          Purchased credit packs (if offered) are non-refundable once credits
          have been used. Unused purchased credits may be refunded within 7
          days of purchase upon request.
        </p>
      </LegalSection>

      <LegalSection id="how" title="5. How to request a refund">
        <p>To request a refund on a paid charge:</p>
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            Email{" "}
            <a
              href={`mailto:${LEGAL.supportEmail}`}
              className="text-primary hover:underline"
            >
              {LEGAL.supportEmail}
            </a>{" "}
            from the email address on your account
          </li>
          <li>
            Include your account email, date of charge, and reason for the
            request
          </li>
          <li>We will respond within 3–5 business days</li>
        </ol>
        <p>
          Approved refunds are processed through our payment provider (Lemon
          Squeezy) and may take 5–10 business days to appear on your statement.
        </p>
      </LegalSection>

      <LegalSection id="exceptions" title="6. Exceptions">
        <p>We may deny refund requests when:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>The request is made outside the eligible window</li>
          <li>There is evidence of abuse, fraud, or Terms violations</li>
          <li>A significant portion of credits or features has already been used</li>
          <li>The charge is disputed through a bank chargeback (contact us first)</li>
        </ul>
      </LegalSection>

      <LegalSection id="cancel" title="7. Canceling your subscription">
        <p>
          You can cancel a paid subscription anytime from the Billing page in
          your dashboard. Cancellation stops future renewals; you retain access
          until the end of your current billing period. Canceling does not
          automatically trigger a refund unless you qualify under Section 3.
        </p>
      </LegalSection>

      <LegalSection id="chargebacks" title="8. Chargebacks">
        <p>
          Please contact us before initiating a chargeback with your bank. We
          resolve most billing issues quickly. Accounts with fraudulent
          chargebacks may be permanently suspended.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="9. Contact">
        <p>
          Billing questions?{" "}
          <a
            href={`mailto:${LEGAL.supportEmail}`}
            className="text-primary hover:underline"
          >
            {LEGAL.supportEmail}
          </a>{" "}
          ·{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Contact page
          </Link>{" "}
          ·{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
          </Link>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
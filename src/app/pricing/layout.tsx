import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Compare Free and Pro plans. Start with 50 free credits or upgrade to Pro for 2,000 credits, Monetization Studio, and unlimited formats.",
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
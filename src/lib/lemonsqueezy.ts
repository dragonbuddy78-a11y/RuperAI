import {
  createCheckout,
  getSubscription,
  lemonSqueezySetup,
} from "@lemonsqueezy/lemonsqueezy.js";
import type { PlanType } from "@/generated/prisma";
import { PLANS } from "@/lib/plans";

export const LS_PLANS = {
  free: {
    plan: "FREE" as PlanType,
    name: PLANS.FREE.name,
    priceMonthly: 0,
    creditsMonthly: PLANS.FREE.creditsMonthly,
    variantId: null,
  },
  pro: {
    plan: "PRO" as PlanType,
    name: PLANS.PRO.name,
    priceMonthly: PLANS.PRO.priceMonthly,
    creditsMonthly: PLANS.PRO.creditsMonthly,
    variantId: process.env.LEMONSQUEEZY_VARIANT_ID_PRO ?? null,
  },
} as const;

export type LSPlanKey = keyof typeof LS_PLANS;

function getAppUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    process.env.NEXTAUTH_URL;

  if (!url) {
    throw new Error(
      "NEXT_PUBLIC_APP_URL, AUTH_URL, or NEXTAUTH_URL must be set",
    );
  }

  return url.replace(/\/$/, "");
}

export function configureLemonSqueezy(): void {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) {
    throw new Error("LEMONSQUEEZY_API_KEY environment variable is not set");
  }

  lemonSqueezySetup({ apiKey });
}

export function mapVariantToPlan(variantId: string | number): PlanType {
  const proVariant = process.env.LEMONSQUEEZY_VARIANT_ID_PRO;
  const starterVariant = process.env.LEMONSQUEEZY_VARIANT_ID_STARTER;

  const id = String(variantId);
  if (proVariant && id === proVariant) return "PRO";
  if (starterVariant && id === starterVariant) return "STARTER";
  return "PRO";
}

export function mapLemonStatus(
  status: string,
): import("@/generated/prisma").SubscriptionStatus {
  const map: Record<string, import("@/generated/prisma").SubscriptionStatus> = {
    active: "ACTIVE",
    on_trial: "TRIALING",
    paused: "CANCELED",
    past_due: "PAST_DUE",
    unpaid: "UNPAID",
    cancelled: "CANCELED",
    expired: "CANCELED",
  };
  return map[status] ?? "CANCELED";
}

export async function createLemonCheckout(params: {
  userId: string;
  email: string;
  planKey?: LSPlanKey;
}): Promise<string> {
  configureLemonSqueezy();

  const planKey = params.planKey ?? "pro";
  const plan = LS_PLANS[planKey];
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;

  if (!storeId) {
    throw new Error("LEMONSQUEEZY_STORE_ID is not configured");
  }

  if (!plan.variantId) {
    throw new Error(
      `Lemon Squeezy variant ID is not configured for plan: ${planKey}`,
    );
  }

  const appUrl = getAppUrl();

  const checkout = await createCheckout(
    parseInt(storeId, 10),
    parseInt(plan.variantId, 10),
    {
      checkoutOptions: {
        embed: false,
        media: true,
        logo: true,
      },
      checkoutData: {
        email: params.email,
        custom: {
          user_id: params.userId,
          plan: plan.plan,
        },
      },
      productOptions: {
        redirectUrl: `${appUrl}/billing?checkout=success`,
      },
    },
  );

  if (checkout.error) {
    throw checkout.error;
  }

  const url = checkout.data?.data.attributes.url;
  if (!url) {
    throw new Error("Failed to create Lemon Squeezy checkout URL");
  }

  return url;
}

export async function getCustomerPortalUrl(
  subscriptionId: string,
): Promise<string | null> {
  configureLemonSqueezy();

  const response = await getSubscription(subscriptionId);
  if (response.error || !response.data) {
    return null;
  }

  const attrs = response.data.data.attributes;
  return (
    attrs.urls?.customer_portal ??
    attrs.urls?.customer_portal_update_subscription ??
    attrs.urls?.update_payment_method ??
    null
  );
}
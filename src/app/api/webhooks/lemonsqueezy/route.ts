import crypto from "crypto";
import { NextResponse } from "next/server";
import type { PlanType } from "@/generated/prisma";
import { addCredits } from "@/lib/credits";
import {
  mapLemonStatus,
  mapVariantToPlan,
} from "@/lib/lemonsqueezy";
import { getMonthlyCredits } from "@/lib/plans";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function verifySignature(payload: string, signature: string): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("LEMONSQUEEZY_WEBHOOK_SECRET is not configured");
  }

  const hmac = crypto.createHmac("sha256", secret);
  const digest = Buffer.from(hmac.update(payload).digest("hex"), "utf8");
  const sig = Buffer.from(signature, "utf8");

  if (digest.length !== sig.length) {
    return false;
  }

  return crypto.timingSafeEqual(digest, sig);
}

interface LemonWebhookEvent {
  meta: {
    event_name: string;
    custom_data?: { user_id?: string; plan?: string };
  };
  data: {
    id: string;
    attributes: {
      status: string;
      variant_id: number;
      customer_id: number;
      renews_at: string | null;
      ends_at: string | null;
      cancelled: boolean;
      custom_data?: { user_id?: string; plan?: string };
      urls?: {
        customer_portal?: string;
        update_payment_method?: string;
      };
    };
  };
}

async function resolveUserId(
  customUserId: string | undefined,
  email?: string,
): Promise<string | null> {
  if (customUserId) {
    const user = await prisma.user.findUnique({
      where: { id: customUserId },
      select: { id: true },
    });
    if (user) return user.id;
  }

  if (email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (user) return user.id;
  }

  return null;
}

async function syncSubscription(
  userId: string,
  event: LemonWebhookEvent,
  grantCredits = false,
): Promise<void> {
  const attrs = event.data.attributes;
  const plan = mapVariantToPlan(attrs.variant_id);
  const status = mapLemonStatus(attrs.status);
  const now = new Date();
  const periodEnd = attrs.renews_at
    ? new Date(attrs.renews_at)
    : attrs.ends_at
      ? new Date(attrs.ends_at)
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const portalUrl =
    attrs.urls?.customer_portal ?? attrs.urls?.update_payment_method ?? null;

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        plan,
        lemonSqueezyCustomerId: String(attrs.customer_id),
      },
    });

    await tx.subscription.upsert({
      where: { userId },
      create: {
        userId,
        lemonSqueezySubscriptionId: event.data.id,
        lemonSqueezyVariantId: String(attrs.variant_id),
        lemonSqueezyCustomerId: String(attrs.customer_id),
        customerPortalUrl: portalUrl,
        status,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: attrs.cancelled,
      },
      update: {
        lemonSqueezySubscriptionId: event.data.id,
        lemonSqueezyVariantId: String(attrs.variant_id),
        lemonSqueezyCustomerId: String(attrs.customer_id),
        customerPortalUrl: portalUrl,
        status,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: attrs.cancelled,
      },
    });

    if (grantCredits && (status === "ACTIVE" || status === "TRIALING")) {
      const monthlyCredits = getMonthlyCredits(plan);
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { credits: true },
      });

      if (user && user.credits < monthlyCredits) {
        const grantAmount = monthlyCredits - user.credits;
        const newBalance = user.credits + grantAmount;

        await tx.user.update({
          where: { id: userId },
          data: { credits: newBalance },
        });

        await tx.creditTransaction.create({
          data: {
            userId,
            amount: grantAmount,
            balance: newBalance,
            type: "SUBSCRIPTION",
            description: `${plan} plan credits granted`,
            metadata: { source: "lemonsqueezy", event: event.meta.event_name },
          },
        });
      }
    }
  });
}

async function downgradeToFree(userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { plan: "FREE" },
    }),
    prisma.subscription.updateMany({
      where: { userId },
      data: { status: "CANCELED", cancelAtPeriodEnd: true },
    }),
  ]);
}

export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("x-signature") ?? "";

  try {
    if (!verifySignature(payload, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } catch (error) {
    console.error("Webhook signature error:", error);
    return NextResponse.json({ error: "Webhook misconfigured" }, { status: 500 });
  }

  let event: LemonWebhookEvent;
  try {
    event = JSON.parse(payload) as LemonWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const eventName = event.meta.event_name;
  const customUserId =
    event.meta.custom_data?.user_id ??
    event.data.attributes.custom_data?.user_id;

  try {
    if (
      eventName === "subscription_created" ||
      eventName === "subscription_updated" ||
      eventName === "subscription_payment_success"
    ) {
      const userId = await resolveUserId(customUserId);
      if (!userId) {
        console.warn("Lemon Squeezy webhook: user not found", customUserId);
        return NextResponse.json({ received: true });
      }

      await syncSubscription(
        userId,
        event,
        eventName === "subscription_created" ||
          eventName === "subscription_payment_success",
      );
    }

    if (
      eventName === "subscription_cancelled" ||
      eventName === "subscription_expired"
    ) {
      const userId = await resolveUserId(customUserId);
      if (userId) {
        await downgradeToFree(userId);
      }
    }

    if (eventName === "order_created") {
      const userId = await resolveUserId(customUserId);
      if (userId) {
        const plan =
          (event.meta.custom_data?.plan as PlanType | undefined) ?? "PRO";
        await addCredits(
          userId,
          getMonthlyCredits(plan),
          "PURCHASE",
          "One-time purchase credits",
          { source: "lemonsqueezy", orderId: event.data.id },
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Lemon Squeezy webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }
}
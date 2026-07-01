import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCustomerPortalUrl } from "@/lib/lemonsqueezy";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: session.user.id },
      select: {
        customerPortalUrl: true,
        lemonSqueezySubscriptionId: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "No subscription found. Please subscribe first." },
        { status: 400 },
      );
    }

    let url = subscription.customerPortalUrl;

    if (!url) {
      url = await getCustomerPortalUrl(
        subscription.lemonSqueezySubscriptionId,
      );

      if (url) {
        await prisma.subscription.update({
          where: { userId: session.user.id },
          data: { customerPortalUrl: url },
        });
      }
    }

    if (!url) {
      return NextResponse.json(
        {
          error:
            "Customer portal unavailable. Check your email from Lemon Squeezy for subscription management links.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Billing portal error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to open billing portal",
      },
      { status: 500 },
    );
  }
}
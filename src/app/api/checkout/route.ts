import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isBetaFreePro } from "@/lib/beta";
import { createLemonCheckout } from "@/lib/lemonsqueezy";
import { checkoutSchema, safeParseBody } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    if (isBetaFreePro()) {
      return NextResponse.json(
        {
          error:
            "Paid plans are paused during our open beta. Sign up to get Pro free.",
        },
        { status: 403 },
      );
    }

    const session = await auth();

    if (!session?.user?.id || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const parsed = safeParseBody(checkoutSchema, body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const url = await createLemonCheckout({
      userId: session.user.id,
      email: session.user.email,
      planKey: parsed.data.plan,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create checkout session",
      },
      { status: 500 },
    );
  }
}
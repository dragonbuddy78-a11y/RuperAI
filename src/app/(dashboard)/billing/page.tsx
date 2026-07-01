import { Suspense } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { BillingClient, type BillingData } from "./billing-client";

export default async function BillingPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const [user, transactions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        plan: true,
        credits: true,
        subscription: {
          select: {
            status: true,
            currentPeriodEnd: true,
            cancelAtPeriodEnd: true,
          },
        },
      },
    }),
    prisma.creditTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        amount: true,
        balance: true,
        type: true,
        description: true,
        createdAt: true,
      },
    }),
  ]);

  if (!user) {
    redirect("/sign-in");
  }

  const initialData: BillingData = {
    plan: user.plan,
    credits: user.credits,
    subscription: user.subscription
      ? {
          status: user.subscription.status,
          currentPeriodEnd: user.subscription.currentPeriodEnd.toISOString(),
          cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
        }
      : null,
    transactions: transactions.map((tx) => ({
      ...tx,
      createdAt: tx.createdAt.toISOString(),
    })),
  };

  return (
    <Suspense>
      <BillingClient initialData={initialData} />
    </Suspense>
  );
}
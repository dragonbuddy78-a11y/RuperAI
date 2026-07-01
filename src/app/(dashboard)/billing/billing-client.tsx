"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  CreditCard,
  Crown,
  ExternalLink,
  Loader2,
  Sparkles,
  Zap,
} from "lucide-react";
import { format } from "date-fns";

import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { BetaBanner } from "@/components/marketing/beta-banner";
import { isBetaFreePro } from "@/lib/beta";
import { getPlan, getMonthlyCredits } from "@/lib/plans";
import type { PlanType, SubscriptionStatus } from "@/generated/prisma";

interface CreditTransaction {
  id: string;
  amount: number;
  balance: number;
  type: string;
  description: string;
  createdAt: string;
}

interface Subscription {
  status: SubscriptionStatus;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface BillingData {
  plan: PlanType;
  credits: number;
  subscription: Subscription | null;
  transactions: CreditTransaction[];
}

const PRO_FEATURES = [
  "2,000 credits per month",
  "Unlimited formats per repurpose",
  "Monetization Studio access",
  "Advanced analytics dashboard",
  "Priority support",
  "API access",
];

function getStatusBadgeVariant(
  status: SubscriptionStatus | "FREE",
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "ACTIVE":
    case "TRIALING":
      return "default";
    case "PAST_DUE":
    case "UNPAID":
      return "destructive";
    case "CANCELED":
      return "secondary";
    default:
      return "outline";
  }
}

export function BillingClient({ initialData }: { initialData: BillingData }) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [data] = useState(initialData);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const betaMode = isBetaFreePro();
  const plan = session?.user?.plan ?? data.plan;
  const credits = session?.user?.credits ?? data.credits;
  const planInfo = getPlan(plan);
  const monthlyCredits = getMonthlyCredits(plan);
  const creditPercent = Math.min((credits / monthlyCredits) * 100, 100);

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      toast.success("Subscription activated!", {
        description: "Your plan has been upgraded successfully.",
      });
    }
  }, [searchParams]);

  async function handleUpgrade() {
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "pro" }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to start checkout");
        return;
      }
      window.location.href = json.url;
    } catch {
      toast.error("Failed to start checkout");
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Failed to open billing portal");
        return;
      }
      window.location.href = json.url;
    } catch {
      toast.error("Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  }

  return (
    <>
      <Header
        title="Billing & Subscriptions"
        description="Manage your plan, credits, and payment details"
      />

      <div className="flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-5xl space-y-8">
          {betaMode && <BetaBanner />}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Current plan */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Current Plan</CardTitle>
                  <Badge variant={getStatusBadgeVariant(data.subscription?.status ?? "FREE")}>
                    {data.subscription?.status ?? (plan === "FREE" ? "Free" : plan)}
                  </Badge>
                </div>
                <CardDescription>Your active subscription details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold">{planInfo.name}</span>
                  <span className="text-muted-foreground">
                    {betaMode && plan === "PRO"
                      ? "Free during beta"
                      : `$${planInfo.priceMonthly}/mo`}
                  </span>
                </div>

                {data.subscription && (
                  <div className="rounded-lg bg-muted/50 p-4 text-sm">
                    <p className="text-muted-foreground">
                      {data.subscription.cancelAtPeriodEnd
                        ? "Cancels on"
                        : "Renews on"}{" "}
                      <span className="font-medium text-foreground">
                        {format(
                          new Date(data.subscription.currentPeriodEnd),
                          "MMMM d, yyyy",
                        )}
                      </span>
                    </p>
                  </div>
                )}

                {!betaMode && plan !== "PRO" && plan !== "ENTERPRISE" && (
                  <Button
                    className="w-full gap-2"
                    onClick={handleUpgrade}
                    disabled={checkoutLoading}
                  >
                    {checkoutLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Crown className="h-4 w-4" />
                    )}
                    Upgrade to Pro
                  </Button>
                )}

                {data.subscription && (
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                  >
                    {portalLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                    Manage Subscription
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Credits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Credits Remaining</CardTitle>
                <CardDescription>
                  Credits reset with your monthly plan allocation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <span className="text-3xl font-bold">{credits}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    of {monthlyCredits} monthly
                  </span>
                </div>
                <Progress value={creditPercent} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {creditPercent.toFixed(0)}% of monthly allocation remaining
                </p>
              </CardContent>
              {!betaMode && (
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={handleUpgrade}
                    disabled={checkoutLoading || plan === "PRO"}
                  >
                    <Sparkles className="h-4 w-4" />
                    Top Up Credits (Upgrade Plan)
                  </Button>
                </CardFooter>
              )}
            </Card>
          </div>

          {/* Pro upgrade CTA */}
          {!betaMode && plan !== "PRO" && plan !== "ENTERPRISE" && (
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Crown className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Upgrade to Pro</CardTitle>
                    <CardDescription>
                      Unlock the full power of RepurAI
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {PRO_FEATURES.map((feature) => (
                    <div key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                      {feature}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={handleUpgrade}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Get Pro — $29/mo
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Usage history */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Usage History</CardTitle>
              <CardDescription>Recent credit transactions</CardDescription>
            </CardHeader>
            <CardContent>
              {data.transactions.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No transactions yet
                </p>
              ) : (
                <div className="space-y-0">
                  {data.transactions.map((tx, i) => (
                    <div key={tx.id}>
                      <div className="flex items-center justify-between py-4">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium">{tx.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(tx.createdAt), "MMM d, yyyy · h:mm a")}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-sm font-semibold ${
                              tx.amount > 0 ? "text-emerald-500" : "text-foreground"
                            }`}
                          >
                            {tx.amount > 0 ? "+" : ""}
                            {tx.amount}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Bal: {tx.balance}
                          </p>
                        </div>
                      </div>
                      {i < data.transactions.length - 1 && <Separator />}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
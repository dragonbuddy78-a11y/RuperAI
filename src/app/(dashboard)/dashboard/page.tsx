import Link from "next/link";
import {
  BookOpen,
  DollarSign,
  Library,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";

import { RecentActivity } from "@/components/dashboard/recent-activity";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getDashboardStats(userId: string) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [user, repurposesThisMonth, savedToLibrary, monetizationProjects] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { credits: true, name: true, plan: true },
      }),
      prisma.content.count({
        where: {
          userId,
          createdAt: { gte: monthStart },
          status: "COMPLETED",
        },
      }),
      prisma.content.count({
        where: { userId, status: "COMPLETED" },
      }),
      prisma.monetizationProject.count({ where: { userId } }),
    ]);

  return {
    creditsRemaining: user?.credits ?? 0,
    repurposesThisMonth,
    savedToLibrary,
    monetizationProjects,
    plan: user?.plan ?? "FREE",
    name: user?.name,
  };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id;
  const stats = await getDashboardStats(userId);
  const firstName = stats.name?.split(" ")[0] ?? "there";

  const statCards = [
    {
      title: "Credits Remaining",
      value: stats.creditsRemaining.toLocaleString(),
      description: `${stats.plan} plan`,
      icon: Zap,
      accent: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Repurposes This Month",
      value: stats.repurposesThisMonth.toLocaleString(),
      description: "Completed generations",
      icon: Wand2,
      accent: "text-chart-2",
      bg: "bg-chart-2/10",
    },
    {
      title: "Saved to Library",
      value: stats.savedToLibrary.toLocaleString(),
      description: "Total content pieces",
      icon: Library,
      accent: "text-chart-3",
      bg: "bg-chart-3/10",
    },
    {
      title: "Monetization Projects",
      value: stats.monetizationProjects.toLocaleString(),
      description: "Active & draft projects",
      icon: DollarSign,
      accent: "text-chart-4",
      bg: "bg-chart-4/10",
    },
  ];

  const quickActions = [
    {
      title: "New Repurpose",
      description: "Transform content into multiple formats",
      href: "/studio",
      icon: Wand2,
      variant: "default" as const,
    },
    {
      title: "Open Library",
      description: "Browse your saved content",
      href: "/library",
      icon: BookOpen,
      variant: "outline" as const,
    },
    {
      title: "Monetization Studio",
      description: "Turn content into revenue",
      href: "/monetization",
      icon: DollarSign,
      variant: "outline" as const,
    },
  ];

  return (
    <>
      <Header
        title={`${getGreeting()}, ${firstName}`}
        description="Here's an overview of your content repurposing activity"
        actions={
          <Button asChild>
            <Link href="/studio">
              <Sparkles className="h-4 w-4" />
              New Repurpose
            </Link>
          </Button>
        }
      />

      <ScrollArea className="flex-1">
        <div className="space-y-8 p-8">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => (
              <Card
                key={card.title}
                className="border-border/60 transition-colors hover:border-primary/30"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.bg}`}
                  >
                    <card.icon className={`h-4 w-4 ${card.accent}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tracking-tight">
                    {card.value}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Quick Actions
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href}>
                  <Card className="group h-full cursor-pointer border-border/60 transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                          <action.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{action.title}</CardTitle>
                          <CardDescription className="mt-0.5">
                            {action.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Badge
                        variant={action.variant === "default" ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {action.variant === "default" ? "Get started" : "Open"}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Chart + Activity */}
          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <UsageChart />
            </div>
            <div className="lg:col-span-2">
              <RecentActivity />
            </div>
          </div>
        </div>
      </ScrollArea>
    </>
  );
}
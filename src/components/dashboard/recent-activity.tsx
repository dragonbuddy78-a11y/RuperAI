"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowRight,
  Clock,
  DollarSign,
  Sparkles,
  Wand2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  creditsUsed: number;
  createdAt: string;
}

function ActivityIcon({ type }: { type: string }) {
  if (type === "repurpose") {
    return <Wand2 className="h-4 w-4 text-primary" />;
  }
  if (type.includes("monetiz")) {
    return <DollarSign className="h-4 w-4 text-chart-4" />;
  }
  return <Sparkles className="h-4 w-4 text-chart-2" />;
}

export function RecentActivity() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch("/api/dashboard?section=activity");
        if (res.ok) {
          const json = await res.json();
          setActivity(json.activity ?? []);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchActivity();
  }, []);

  if (loading) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <Skeleton className="h-5 w-36" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/60">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/library">
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {activity.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10 text-center">
            <Clock className="mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-muted-foreground">
              No activity yet
            </p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              Your repurposing history will appear here once you generate content
            </p>
            <Button className="mt-4" size="sm" asChild>
              <Link href="/studio">Create your first repurpose</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {activity.map((item) => (
              <Link
                key={item.id}
                href={item.type === "repurpose" ? `/library?open=${item.id}` : "#"}
                className="flex items-center gap-3 rounded-lg border border-transparent p-3 transition-colors hover:border-border hover:bg-muted/30"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <ActivityIcon type={item.type} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(item.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  {item.creditsUsed > 0 && (
                    <Badge variant="secondary" className="text-[10px]">
                      {item.creditsUsed} cr
                    </Badge>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
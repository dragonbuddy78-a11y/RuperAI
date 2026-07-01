"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BarChart3,
  FileText,
  Loader2,
  TrendingUp,
  Zap,
} from "lucide-react";
import { format } from "date-fns";

import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalyticsData {
  stats: {
    totalRepurposes: number;
    creditsUsed: number;
    topFormat: string;
    avgPerWeek: number;
    monetizationCount: number;
  };
  repurposesOverTime: { date: string; count: number }[];
  formatBreakdown: { format: string; count: number; value: number }[];
  platformUsage: { platform: string; count: number }[];
  contentInsights: {
    id: string;
    title: string;
    outputCount: number;
    formats: string[];
    creditsUsed: number;
    lastRepurposed: string;
  }[];
}

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
];

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  loading,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">{value}</p>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ChartSkeleton() {
  return (
    <div className="flex h-[300px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/analytics");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to load analytics");
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load analytics";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  return (
    <>
      <Header
        title="Analytics"
        description="Track your repurposing performance and content insights"
        actions={
          <Badge variant="outline" className="gap-1.5">
            <BarChart3 className="h-3.5 w-3.5" />
            Last 30 days
          </Badge>
        }
      />

      <div className="flex-1 overflow-auto p-8">
        {error && !loading ? (
          <Card className="border-destructive/50">
            <CardContent className="flex flex-col items-center gap-4 py-12">
              <p className="text-muted-foreground">{error}</p>
              <button
                type="button"
                onClick={loadAnalytics}
                className="text-sm text-primary hover:underline"
              >
                Try again
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Repurposes"
                value={data?.stats.totalRepurposes ?? 0}
                icon={FileText}
                loading={loading}
              />
              <StatCard
                title="Credits Used"
                value={data?.stats.creditsUsed ?? 0}
                icon={Zap}
                loading={loading}
              />
              <StatCard
                title="Top Format"
                value={data?.stats.topFormat ?? "—"}
                icon={TrendingUp}
                loading={loading}
              />
              <StatCard
                title="Avg per Week"
                value={data?.stats.avgPerWeek ?? 0}
                description="Repurposes per week"
                icon={BarChart3}
                loading={loading}
              />
            </div>

            {/* Charts */}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Repurposes Over Time</CardTitle>
                  <CardDescription>Daily output volume</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <ChartSkeleton />
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={data?.repurposesOverTime ?? []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                          tickLine={false}
                          axisLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="count"
                          stroke="var(--primary)"
                          strokeWidth={2}
                          dot={{ fill: "var(--primary)", r: 3 }}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Format Breakdown</CardTitle>
                  <CardDescription>Distribution by output type</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <ChartSkeleton />
                  ) : (data?.formatBreakdown.length ?? 0) === 0 ? (
                    <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                      No repurposes yet
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={data?.formatBreakdown ?? []}
                          dataKey="value"
                          nameKey="format"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                        >
                          {(data?.formatBreakdown ?? []).map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Platform Usage</CardTitle>
                  <CardDescription>Outputs grouped by platform</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <ChartSkeleton />
                  ) : (data?.platformUsage.length ?? 0) === 0 ? (
                    <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
                      No platform data yet
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={data?.platformUsage ?? []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis
                          dataKey="platform"
                          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--card)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar
                          dataKey="count"
                          fill="var(--primary)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Content insights table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Per-Content Insights</CardTitle>
                <CardDescription>
                  Performance breakdown by source content
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (data?.contentInsights.length ?? 0) === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No content insights yet. Start repurposing to see data here.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-left text-muted-foreground">
                          <th className="pb-3 pr-4 font-medium">Content</th>
                          <th className="pb-3 pr-4 font-medium">Outputs</th>
                          <th className="pb-3 pr-4 font-medium">Formats</th>
                          <th className="pb-3 pr-4 font-medium">Credits</th>
                          <th className="pb-3 font-medium">Last Activity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data?.contentInsights.map((row) => (
                          <tr
                            key={row.id}
                            className="border-b border-border/60 last:border-0"
                          >
                            <td className="py-3 pr-4 font-medium">
                              {row.title}
                            </td>
                            <td className="py-3 pr-4">{row.outputCount}</td>
                            <td className="py-3 pr-4">
                              <div className="flex flex-wrap gap-1">
                                {row.formats.slice(0, 3).map((f) => (
                                  <Badge
                                    key={f}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {f}
                                  </Badge>
                                ))}
                                {row.formats.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{row.formats.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="py-3 pr-4">{row.creditsUsed}</td>
                            <td className="py-3 text-muted-foreground">
                              {format(new Date(row.lastRepurposed), "MMM d, yyyy")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
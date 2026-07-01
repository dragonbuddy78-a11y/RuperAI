"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Loader2,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

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
import { Skeleton } from "@/components/ui/skeleton";
import { formatLabel } from "@/lib/format-meta";
import { cn } from "@/lib/utils";
import type { ContentFormat, ScheduledPostData } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-primary/15 text-primary border-primary/30",
  POSTED: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  SKIPPED: "bg-muted text-muted-foreground border-border",
};

export function ContentCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [posts, setPosts] = useState<ScheduledPostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [selectedPost, setSelectedPost] = useState<ScheduledPostData | null>(
    null,
  );
  const [updating, setUpdating] = useState(false);

  const monthKey = format(currentMonth, "yyyy-MM");

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/calendar?month=${monthKey}`);
      if (!res.ok) throw new Error("Failed to load calendar");
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch {
      toast.error("Could not load calendar");
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = endOfWeek(monthEnd);
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentMonth]);

  const postsByDay = useMemo(() => {
    const map = new Map<string, ScheduledPostData[]>();
    for (const post of posts) {
      const key = format(new Date(post.scheduledAt), "yyyy-MM-dd");
      const existing = map.get(key) ?? [];
      existing.push(post);
      map.set(key, existing);
    }
    return map;
  }, [posts]);

  const selectedDayPosts = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return postsByDay.get(key) ?? [];
  }, [selectedDate, postsByDay]);

  async function updatePostStatus(
    post: ScheduledPostData,
    status: ScheduledPostData["status"],
  ) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/calendar/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      await loadPosts();
      setSelectedPost((prev) => (prev?.id === post.id ? { ...prev, status } : prev));
      toast.success(status === "POSTED" ? "Marked as posted" : "Status updated");
    } catch {
      toast.error("Failed to update");
    } finally {
      setUpdating(false);
    }
  }

  async function deletePost(post: ScheduledPostData) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/calendar/${post.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setSelectedPost(null);
      await loadPosts();
      toast.success("Removed from calendar");
    } catch {
      toast.error("Failed to delete");
    } finally {
      setUpdating(false);
    }
  }

  function platformLabel(platform: string) {
    try {
      return formatLabel(platform as ContentFormat);
    } catch {
      return platform.replace(/_/g, " ");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-primary" />
              {format(currentMonth, "MMMM yyyy")}
            </CardTitle>
            <CardDescription>Plan and track your content schedule</CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCurrentMonth(new Date());
                setSelectedDate(new Date());
              }}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[420px] w-full" />
          ) : (
            <>
              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="py-2">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const dayPosts = postsByDay.get(key) ?? [];
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const inMonth = isSameMonth(day, currentMonth);

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "relative flex min-h-[72px] flex-col rounded-lg border p-1.5 text-left transition-colors",
                        inMonth
                          ? "border-border/60 hover:border-primary/40 hover:bg-muted/30"
                          : "border-transparent text-muted-foreground/40",
                        isSelected && "border-primary bg-primary/5",
                        isToday(day) && "ring-1 ring-primary/40",
                      )}
                    >
                      <span
                        className={cn(
                          "text-xs font-medium",
                          isToday(day) && "text-primary",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayPosts.slice(0, 2).map((p) => (
                          <div
                            key={p.id}
                            className={cn(
                              "truncate rounded px-1 py-0.5 text-[9px] font-medium",
                              STATUS_COLORS[p.status],
                            )}
                          >
                            {p.title}
                          </div>
                        ))}
                        {dayPosts.length > 2 && (
                          <span className="text-[9px] text-muted-foreground">
                            +{dayPosts.length - 2} more
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">
            {selectedDate
              ? format(selectedDate, "EEEE, MMM d")
              : "Select a day"}
          </CardTitle>
          <CardDescription>
            {selectedDayPosts.length} post
            {selectedDayPosts.length !== 1 ? "s" : ""} scheduled
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[480px] pr-3">
            {selectedDayPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-muted-foreground">
                <CalendarDays className="mb-3 h-8 w-8 opacity-40" />
                <p>No posts scheduled</p>
                <p className="mt-1 text-xs">
                  Schedule from Library or Content Studio
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDayPosts.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => setSelectedPost(post)}
                    className={cn(
                      "w-full rounded-xl border p-3 text-left transition-colors hover:border-primary/40",
                      selectedPost?.id === post.id
                        ? "border-primary bg-primary/5"
                        : "border-border/60",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{post.title}</p>
                      <Badge
                        variant="outline"
                        className={cn("shrink-0 text-[10px]", STATUS_COLORS[post.status])}
                      >
                        {post.status.toLowerCase()}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {format(new Date(post.scheduledAt), "h:mm a")} ·{" "}
                      {platformLabel(post.platform)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>

          {selectedPost && (
            <div className="mt-4 space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{selectedPost.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {platformLabel(selectedPost.platform)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setSelectedPost(null)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="line-clamp-6 whitespace-pre-wrap text-sm">
                {selectedPost.content}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedPost.content);
                    toast.success("Copied");
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </Button>
                {selectedPost.status === "SCHEDULED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={updating}
                    onClick={() => updatePostStatus(selectedPost, "POSTED")}
                  >
                    {updating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    Posted
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={updating}
                  onClick={() => deletePost(selectedPost)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
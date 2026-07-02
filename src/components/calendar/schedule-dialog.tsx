"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Bell, CalendarPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatLabel } from "@/lib/format-meta";
import { buildIcsCalendar, downloadFile } from "@/lib/share-utils";
import type { ContentFormat } from "@/types";

interface ScheduleDialogProps {
  title: string;
  content: string;
  platform: string;
  outputId?: string;
  contentId?: string;
  trigger?: React.ReactNode;
  onScheduled?: () => void;
}

export function ScheduleDialog({
  title: defaultTitle,
  content,
  platform,
  outputId,
  contentId,
  trigger,
  onScheduled,
}: ScheduleDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(defaultTitle);
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return format(d, "yyyy-MM-dd'T'HH:mm");
  });
  const [notes, setNotes] = useState("");

  const platformLabel = (() => {
    try {
      return formatLabel(platform as ContentFormat);
    } catch {
      return platform.replace(/_/g, " ");
    }
  })();

  async function handleSchedule() {
    setSaving(true);
    try {
      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          platform,
          scheduledAt: new Date(scheduledAt).toISOString(),
          outputId,
          contentId,
          notes: notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to schedule");

      toast.success("Added to calendar", {
        description: format(new Date(scheduledAt), "MMM d 'at' h:mm a"),
      });
      setOpen(false);
      onScheduled?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to schedule post",
      );
    } finally {
      setSaving(false);
    }
  }

  function downloadReminder() {
    const start = new Date(scheduledAt);
    const ics = buildIcsCalendar([
      {
        uid: `repurai-${Date.now()}@repurai.app`,
        title: title.trim() || defaultTitle,
        description: `${platformLabel} post\n\n${content}`,
        start,
      },
    ]);
    const slug = (title.trim() || "post")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40);
    downloadFile(`repurai-reminder-${slug}.ics`, ics, "text/calendar;charset=utf-8");
    toast.success("Reminder downloaded", {
      description: "Open the .ics file to add to your phone calendar",
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline" className="gap-1.5">
            <CalendarPlus className="h-3.5 w-3.5" />
            Schedule
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule to Calendar</DialogTitle>
          <DialogDescription>
            Plan when to post this {platformLabel} content. Copy and paste
            manually when your reminder fires — no paid APIs required.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="schedule-title">Title</Label>
            <Input
              id="schedule-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-date">Date & time</Label>
            <Input
              id="schedule-date"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="schedule-notes">Notes (optional)</Label>
            <Textarea
              id="schedule-notes"
              placeholder="Reminders, hashtags to add, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">
              Preview
            </p>
            <p className="line-clamp-4 text-sm">{content}</p>
          </div>
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            onClick={downloadReminder}
            disabled={!title.trim()}
            className="gap-1.5 sm:mr-auto"
          >
            <Bell className="h-4 w-4" />
            Download reminder (.ics)
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={saving || !title.trim()}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CalendarPlus className="mr-2 h-4 w-4" />
            )}
            Add to Calendar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
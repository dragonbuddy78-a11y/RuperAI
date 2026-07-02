"use client";

import { useEffect, useState } from "react";
import { format as formatDate } from "date-fns";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { formatLabel } from "@/lib/format-meta";
import { isPublishableFormat } from "@/lib/social-platforms";
import type { ContentFormat } from "@/types";

interface PublishDialogProps {
  title: string;
  content: string;
  format: string;
  outputId?: string;
  contentId?: string;
  trigger?: React.ReactNode;
  onPublished?: () => void;
}

export function PublishDialog({
  title: defaultTitle,
  content,
  format,
  outputId,
  contentId,
  trigger,
  onPublished,
}: PublishDialogProps) {
  const [open, setOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [hasAccounts, setHasAccounts] = useState(false);
  const [publishAll, setPublishAll] = useState(false);
  const [scheduleLater, setScheduleLater] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return formatDate(d, "yyyy-MM-dd'T'HH:mm");
  });

  const publishable = isPublishableFormat(format);

  useEffect(() => {
    if (!open) return;
    fetch("/api/social/accounts")
      .then((r) => r.json())
      .then((data) => setHasAccounts(Boolean(data.connected)))
      .catch(() => setHasAccounts(false));
  }, [open]);

  if (!publishable) return null;

  const platformLabel = (() => {
    try {
      return formatLabel(format as ContentFormat);
    } catch {
      return format.replace(/_/g, " ");
    }
  })();

  async function handlePublish() {
    setPublishing(true);
    try {
      const res = await fetch("/api/social/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: defaultTitle,
          content,
          format,
          publishAll,
          outputId,
          contentId,
          scheduleDate: scheduleLater
            ? new Date(scheduledAt).toISOString()
            : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to publish");

      if (scheduleLater) {
        toast.success("Scheduled for publishing", {
          description: formatDate(new Date(scheduledAt), "MMM d 'at' h:mm a"),
        });
      } else {
        const urls = (data.postIds ?? [])
          .filter((p: { postUrl?: string }) => p.postUrl)
          .map((p: { postUrl: string }) => p.postUrl);
        toast.success(
          urls.length > 0
            ? `Published to ${data.platforms?.join(", ") ?? "social"}`
            : "Published successfully",
        );
      }

      setOpen(false);
      onPublished?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to publish to social",
      );
    } finally {
      setPublishing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" variant="outline">
            <Send className="h-3.5 w-3.5" />
            Publish
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Publish to social</DialogTitle>
          <DialogDescription>
            Post this {platformLabel} to your connected accounts.
          </DialogDescription>
        </DialogHeader>

        {!hasAccounts ? (
          <p className="text-sm text-muted-foreground">
            Connect your social accounts in{" "}
            <a href="/settings" className="text-primary underline">
              Settings
            </a>{" "}
            first.
          </p>
        ) : (
          <div className="space-y-4">
            <label className="flex items-center gap-3 rounded-lg border p-3">
              <Checkbox
                checked={publishAll}
                onCheckedChange={(v) => setPublishAll(v === true)}
              />
              <div>
                <p className="text-sm font-medium">Publish to all connected accounts</p>
                <p className="text-xs text-muted-foreground">
                  Otherwise posts only to the matching platform ({platformLabel})
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 rounded-lg border p-3">
              <Checkbox
                checked={scheduleLater}
                onCheckedChange={(v) => setScheduleLater(v === true)}
              />
              <div>
                <p className="text-sm font-medium">Schedule for later</p>
                <p className="text-xs text-muted-foreground">
                  Leave unchecked to publish immediately
                </p>
              </div>
            </label>

            {scheduleLater && (
              <div className="space-y-2">
                <Label htmlFor="publish-schedule">Date & time</Label>
                <Input
                  id="publish-schedule"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            disabled={publishing || !hasAccounts}
          >
            {publishing && <Loader2 className="h-4 w-4 animate-spin" />}
            {scheduleLater ? "Schedule publish" : "Publish now"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
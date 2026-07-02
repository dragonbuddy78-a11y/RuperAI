"use client";

import { Share2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ManualPostingGuide() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Share2 className="h-4 w-4" />
          Post to Social (Free)
        </CardTitle>
        <CardDescription>
          No paid APIs needed — generate here, then copy and paste on each
          platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Generate content in Studio or open a saved item in Library.</li>
          <li>
            Click <strong className="text-foreground">Open X / LinkedIn</strong>{" "}
            — text is copied and the site opens in a new tab.
          </li>
          <li>Paste into the compose box and publish.</li>
          <li>
            Use <strong className="text-foreground">Schedule</strong> + download a
            calendar reminder (.ics) so your phone nudges you when to post.
          </li>
        </ol>
        <p className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs">
          Tip: use <strong className="text-foreground">Copy all</strong> or{" "}
          <strong className="text-foreground">Export pack</strong> in Studio to
          grab every format at once.
        </p>
      </CardContent>
    </Card>
  );
}
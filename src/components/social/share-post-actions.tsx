"use client";

import { useState } from "react";
import { Copy, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  canOpenPlatform,
  copyAndOpenPlatform,
  copyToClipboard,
  getPlatformTarget,
} from "@/lib/share-utils";

interface SharePostActionsProps {
  content: string;
  format: string;
  size?: "sm" | "default";
}

export function SharePostActions({
  content,
  format,
  size = "sm",
}: SharePostActionsProps) {
  const [opening, setOpening] = useState(false);
  const platform = getPlatformTarget(format);
  const showOpen = canOpenPlatform(format);

  async function handleCopy() {
    try {
      await copyToClipboard(content);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy");
    }
  }

  async function handleOpenAndCopy() {
    setOpening(true);
    try {
      const { platform: target } = await copyAndOpenPlatform(format, content);
      if (target) {
        toast.success(`Copied — paste into ${target.label}`, {
          description: "Compose window opened in a new tab",
        });
      } else {
        toast.success("Copied to clipboard");
      }
    } catch {
      toast.error("Could not open platform");
    } finally {
      setOpening(false);
    }
  }

  if (!showOpen) {
    return (
      <Button size={size} variant="outline" onClick={handleCopy}>
        <Copy className="h-3.5 w-3.5" />
        Copy
      </Button>
    );
  }

  return (
    <>
      <Button size={size} variant="outline" onClick={handleCopy}>
        <Copy className="h-3.5 w-3.5" />
        Copy
      </Button>
      <Button
        size={size}
        variant="default"
        onClick={handleOpenAndCopy}
        disabled={opening}
        className="gap-1.5"
      >
        {opening ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ExternalLink className="h-3.5 w-3.5" />
        )}
        Open {platform?.label ?? "platform"}
      </Button>
    </>
  );
}
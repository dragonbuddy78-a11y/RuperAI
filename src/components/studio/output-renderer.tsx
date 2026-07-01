"use client";

import { useMemo } from "react";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ContentFormat } from "@/types";

interface OutputRendererProps {
  format: ContentFormat | string;
  output: string;
  className?: string;
}

function parseThread(output: string): string[] {
  const numbered = output.split(/\n(?=\d+[\.\)]\s)/).filter(Boolean);
  if (numbered.length > 1) return numbered;

  const byDoubleNewline = output.split(/\n\n+/).filter((p) => p.trim());
  if (byDoubleNewline.length > 1) return byDoubleNewline;

  const lines = output.split("\n").filter((l) => l.trim());
  if (lines.length > 3) {
    const chunks: string[] = [];
    for (let i = 0; i < lines.length; i += 3) {
      chunks.push(lines.slice(i, i + 3).join("\n"));
    }
    return chunks;
  }

  return [output];
}

function parseCarousel(output: string): string[] {
  const slideMarkers = output.split(/\n(?=(?:Slide|Card)\s*\d+[:.\)]|\d+[\.\)]\s)/i);
  if (slideMarkers.length > 1) return slideMarkers;

  const bySeparator = output.split(/---+|\*\*\*+/).filter((s) => s.trim());
  if (bySeparator.length > 1) return bySeparator;

  return parseThread(output);
}

export function OutputRenderer({ format, output, className }: OutputRendererProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const isThread = format === "twitter_thread" || format === "threads_post";
  const isCarousel =
    format === "instagram_carousel" || format === "carousel";

  const segments = useMemo(() => {
    if (isCarousel) return parseCarousel(output);
    if (isThread) return parseThread(output);
    return null;
  }, [output, isCarousel, isThread]);

  async function copyText(text: string, index?: number) {
    await navigator.clipboard.writeText(text);
    if (index !== undefined) setCopiedIndex(index);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  if (segments && segments.length > 1) {
    return (
      <div className={cn("space-y-3", className)}>
        {segments.map((segment, i) => (
          <div
            key={i}
            className={cn(
              "group relative rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30",
              isCarousel && "bg-gradient-to-br from-primary/5 to-transparent",
            )}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                {isCarousel ? `Slide ${i + 1}` : `Tweet ${i + 1}`}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => copyText(segment.trim(), i)}
              >
                {copiedIndex === i ? (
                  <Check className="h-3.5 w-3.5 text-chart-3" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {segment.trim()}
            </p>
            {isCarousel && (
              <div className="mt-3 flex gap-1">
                {Array.from({ length: segments.length }).map((_, dot) => (
                  <div
                    key={dot}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      dot === i
                        ? "w-4 bg-primary"
                        : "w-1.5 bg-muted-foreground/30",
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-muted/20 p-5",
        className,
      )}
    >
      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
        {output}
      </pre>
    </div>
  );
}
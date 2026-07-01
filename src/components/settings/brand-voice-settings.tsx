"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Crown,
  Loader2,
  Mic2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { BrandVoiceData, BrandVoiceExample } from "@/lib/brand-voice";
import { cn } from "@/lib/utils";

const EXAMPLE_TYPES = [
  "Twitter / X post",
  "LinkedIn post",
  "Instagram caption",
  "Blog excerpt",
  "Email newsletter",
  "Thread hook",
  "Article intro",
  "Video script",
];

function createEmptyExample(index: number): BrandVoiceExample {
  return {
    id: crypto.randomUUID(),
    label: EXAMPLE_TYPES[index % EXAMPLE_TYPES.length],
    content: "",
  };
}

export function BrandVoiceSettings() {
  const [loading, setLoading] = useState(true);
  const [training, setTraining] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);
  const [brandVoice, setBrandVoice] = useState<BrandVoiceData | null>(null);
  const [name, setName] = useState("My Brand Voice");
  const [isEnabled, setIsEnabled] = useState(true);
  const [examples, setExamples] = useState<BrandVoiceExample[]>(
    Array.from({ length: 5 }, (_, i) => createEmptyExample(i)),
  );
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    let cancelled = false;

    async function loadBrandVoice() {
      try {
        const res = await fetch("/api/brand-voice");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error ?? "Failed to load");
        }
        if (cancelled) return;

        setHasAccess(Boolean(data.hasAccess));
        if (data.brandVoice) {
          const bv = data.brandVoice as BrandVoiceData;
          setBrandVoice(bv);
          setName(bv.name);
          setIsEnabled(bv.isEnabled);
          if (bv.examples.length >= 5) {
            setExamples(bv.examples);
          }
        }
      } catch (error) {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "Failed to load brand voice";
        toast.error(message);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadBrandVoice();

    return () => {
      cancelled = true;
    };
  }, []);

  const filledCount = examples.filter((e) => e.content.trim().length >= 50).length;
  const canTrain = filledCount >= 5 && hasAccess;

  function updateExample(id: string, patch: Partial<BrandVoiceExample>) {
    setExamples((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    );
  }

  function addExample() {
    if (examples.length >= 10) {
      toast.error("Maximum 10 examples");
      return;
    }
    setExamples((prev) => [...prev, createEmptyExample(prev.length)]);
  }

  function removeExample(id: string) {
    if (examples.length <= 5) {
      toast.error("Minimum 5 examples required");
      return;
    }
    setExamples((prev) => prev.filter((e) => e.id !== id));
  }

  async function handleTrain(retrain = false) {
    if (!canTrain) {
      toast.error("Add at least 5 examples with 50+ characters each");
      return;
    }

    const validExamples = examples.filter((e) => e.content.trim().length >= 50);

    setTraining(true);
    try {
      const method = brandVoice ? "PATCH" : "POST";
      const body = brandVoice
        ? {
            name,
            examples: validExamples,
            isEnabled,
            retrain: true,
          }
        : { name, examples: validExamples, isEnabled };

      const res = await fetch("/api/brand-voice", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Training failed");
        return;
      }

      setBrandVoice(data.brandVoice);
      toast.success(
        retrain || brandVoice
          ? "Brand voice retrained!"
          : "Brand voice trained successfully!",
      );
    } catch {
      toast.error("Training failed");
    } finally {
      setTraining(false);
    }
  }

  async function handleToggleEnabled(enabled: boolean) {
    setIsEnabled(enabled);
    if (!brandVoice) return;

    try {
      const res = await fetch("/api/brand-voice", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: enabled }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBrandVoice(data.brandVoice);
      toast.success(enabled ? "Brand voice enabled" : "Brand voice disabled");
    } catch {
      setIsEnabled(!enabled);
      toast.error("Failed to update");
    }
  }

  async function handleDelete() {
    try {
      const res = await fetch("/api/brand-voice", { method: "DELETE" });
      if (!res.ok) throw new Error();
      setBrandVoice(null);
      setExamples(Array.from({ length: 5 }, (_, i) => createEmptyExample(i)));
      toast.success("Brand voice deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  if (loading) {
    return (
      <Card className="min-h-[320px] border-primary/20">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-2 h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!hasAccess) {
    return (
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Custom Brand Voice</CardTitle>
          <CardDescription>
            Train AI on your writing style — every output sounds like you
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            Upload 5–10 samples of your best content and RepurAI learns your
            tone, hooks, vocabulary, and formatting habits.
          </p>
          <Button asChild>
            <Link href="/billing">Upgrade to Pro</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-violet-500/5">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/25">
              <Mic2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                Brand Voice
                <Badge variant="secondary" className="text-[10px]">
                  Pro
                </Badge>
              </CardTitle>
              <CardDescription>
                Train AI on your personal writing style
              </CardDescription>
            </div>
          </div>
          {brandVoice?.trainedAt && (
            <div className="flex items-center gap-2">
              <Label htmlFor="voice-enabled" className="text-xs text-muted-foreground">
                Active
              </Label>
              <Switch
                id="voice-enabled"
                checked={isEnabled}
                onCheckedChange={handleToggleEnabled}
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="voice-name">Voice name</Label>
          <Input
            id="voice-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Brand Voice"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label>Writing samples</Label>
              <p className="text-xs text-muted-foreground">
                Paste 5–10 examples ({filledCount}/5 minimum, max 10)
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addExample}
              disabled={examples.length >= 10}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add sample
            </Button>
          </div>

          <div className="space-y-3">
            {examples.map((example, index) => (
              <div
                key={example.id}
                className={cn(
                  "rounded-xl border border-border/60 bg-background/50 p-4",
                  example.content.trim().length >= 50 &&
                    "border-primary/30 bg-primary/5",
                )}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <Input
                    value={example.label}
                    onChange={(e) =>
                      updateExample(example.id, { label: e.target.value })
                    }
                    className="h-8 max-w-[200px] text-xs"
                    placeholder="Sample type"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      {example.content.length} chars
                    </span>
                    {examples.length > 5 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => removeExample(example.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
                <Textarea
                  placeholder={`Paste sample ${index + 1} — a tweet, post, or paragraph that sounds like you (min 50 chars)...`}
                  value={example.content}
                  onChange={(e) =>
                    updateExample(example.id, { content: e.target.value })
                  }
                  rows={4}
                  className="resize-y font-mono text-sm"
                />
              </div>
            ))}
          </div>
        </div>

        {brandVoice?.voiceProfile && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Trained voice profile
            </Label>
            <ScrollArea className="h-40 rounded-xl border border-border/60 bg-muted/20 p-4">
              <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-muted-foreground">
                {brandVoice.voiceProfile}
              </pre>
            </ScrollArea>
            {brandVoice.trainedAt && (
              <p className="text-[10px] text-muted-foreground">
                Last trained:{" "}
                {new Date(brandVoice.trainedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => handleTrain(Boolean(brandVoice))}
            disabled={training || !canTrain}
            className="gap-2"
          >
            {training ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : brandVoice ? (
              <RefreshCw className="h-4 w-4" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            {brandVoice ? "Retrain Voice" : "Train Brand Voice"}
          </Button>
          {brandVoice && (
            <Button variant="outline" onClick={handleDelete} className="gap-2">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>

        {!canTrain && (
          <p className="text-xs text-amber-500">
            Add at least 5 samples with 50+ characters each to train.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
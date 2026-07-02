"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  CalendarPlus,
  Check,
  ChevronRight,
  Copy,
  Download,
  FileUp,
  Globe,
  Layers,
  Link2,
  Loader2,
  Mic,
  RefreshCw,
  Save,
  Upload,
  Wand2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { ScheduleDialog } from "@/components/calendar/schedule-dialog";
import { SharePostActions } from "@/components/social/share-post-actions";
import { AiChatEditor } from "@/components/studio/ai-chat-editor";
import { OutputRenderer } from "@/components/studio/output-renderer";
import { QualityPanel } from "@/components/studio/quality-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { QualityReport } from "@/lib/ai/quality-check";
import { canUseFormat, getMaxFormatsPerRepurpose } from "@/lib/plans";
import {
  BULK_PRESETS,
  FORMAT_META,
  STUDIO_TEMPLATES,
  formatLabel,
  getFormatCredits,
} from "@/lib/format-meta";
import { buildExportPack, copyToClipboard, downloadFile } from "@/lib/share-utils";
import { cn } from "@/lib/utils";
import {
  CONTENT_FORMATS,
  TONE_OPTIONS,
  LENGTH_OPTIONS,
  toOutputFormat,
  type ContentFormat,
  type GeneratedOutput,
  type GenerationOptions,
  type SourceType,
} from "@/types";
import type { PlanType } from "@/generated/prisma";

const STEPS = ["input", "configure", "templates"] as const;
type Step = (typeof STEPS)[number];

const CATEGORY_LABELS: Record<string, string> = {
  social: "Social Media",
  longform: "Long-form",
  video: "Video",
  email: "Email",
  ads: "Ads & Growth",
};

export function ContentStudio() {
  const { data: session, update: updateSession } = useSession();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);

  const plan = (session?.user?.plan ?? "FREE") as PlanType;
  const credits = session?.user?.credits ?? 0;

  const [step, setStep] = useState<Step>("input");
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [sourceType, setSourceType] = useState<SourceType>("text");
  const [sourceUrl, setSourceUrl] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [selectedFormats, setSelectedFormats] = useState<ContentFormat[]>([]);
  const [options, setOptions] = useState<GenerationOptions>({
    tone: "professional",
    length: "auto",
    variants: 1,
    hashtags: true,
    emojis: true,
  });

  const [extracting, setExtracting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [schedulingWeek, setSchedulingWeek] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [results, setResults] = useState<GeneratedOutput[]>([]);
  const [contentId, setContentId] = useState<string | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<string>("");
  const [editingOutput, setEditingOutput] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [qualityReports, setQualityReports] = useState<
    Record<string, QualityReport>
  >({});
  const [checkingQuality, setCheckingQuality] = useState(false);
  const [activeBulkPreset, setActiveBulkPreset] = useState<string | null>(null);

  const creditCost = useMemo(
    () => getFormatCredits(selectedFormats),
    [selectedFormats],
  );

  const canGenerate =
    content.length >= 50 &&
    selectedFormats.length > 0 &&
    creditCost <= credits &&
    !generating;

  const loadRerunContent = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/library/${id}`);
      if (!res.ok) throw new Error("Failed to load content");
      const data = await res.json();
      setContent(data.rawContent);
      setTitle(data.title);
      setSourceType(
        data.sourceType === "YOUTUBE"
          ? "youtube"
          : data.sourceType === "URL"
            ? "url"
            : data.sourceType === "PDF"
              ? "pdf"
              : data.sourceType === "AUDIO"
                ? "audio"
                : "text",
      );
      if (data.sourceUrl) setSourceUrl(data.sourceUrl);
      const formats = data.outputs
        .map((o: { formatKey: string }) => o.formatKey)
        .filter((f: string) =>
          CONTENT_FORMATS.includes(f as ContentFormat),
        ) as ContentFormat[];
      if (formats.length) setSelectedFormats(formats);
      setStep("configure");
      toast.success("Content loaded — ready to re-run");
    } catch {
      toast.error("Could not load content for re-run");
    }
  }, []);

  useEffect(() => {
    const rerunId = searchParams.get("rerun");
    if (rerunId) loadRerunContent(rerunId);
  }, [searchParams, loadRerunContent]);

  function toggleFormat(format: ContentFormat) {
    const outputFormat = toOutputFormat(format);
    if (!canUseFormat(plan, outputFormat)) {
      toast.error(`${formatLabel(format)} requires a paid plan`);
      return;
    }

    setSelectedFormats((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format],
    );
  }

  function applyTemplate(formats: ContentFormat[]) {
    const allowed = formats.filter((f) =>
      canUseFormat(plan, toOutputFormat(f)),
    );
    setSelectedFormats(allowed);
    setActiveBulkPreset(null);
    setStep("configure");
    toast.success(`Template applied — ${allowed.length} formats selected`);
  }

  function applyBulkPreset(presetId: string) {
    const preset = BULK_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const maxFormats = getMaxFormatsPerRepurpose(plan);
    const allowed = preset.formats.filter((f) =>
      canUseFormat(plan, toOutputFormat(f)),
    );

    if (allowed.length === 0) {
      toast.error("None of these formats are available on your plan");
      return;
    }

    const trimmed =
      allowed.length > maxFormats ? allowed.slice(0, maxFormats) : allowed;

    if (trimmed.length < allowed.length) {
      toast.info(
        `Your plan allows ${maxFormats} formats per run — using first ${trimmed.length}`,
      );
    }

    setSelectedFormats(trimmed);
    setActiveBulkPreset(presetId);
    toast.success(`${preset.name} ready — ${trimmed.length} formats selected`);
  }

  async function runQualityChecks(outputs: GeneratedOutput[]) {
    setCheckingQuality(true);
    setQualityReports({});

    const reports: Record<string, QualityReport> = {};

    await Promise.allSettled(
      outputs.map(async (output) => {
        try {
          const res = await fetch("/api/generate/quality", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              content: output.output,
              format: output.format,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            reports[output.format] = data.report;
          }
        } catch {
          // Quality check is best-effort
        }
      }),
    );

    setQualityReports(reports);
    setCheckingQuality(false);

    const autoFixed = outputs.map((o) => {
      const report = reports[o.format];
      if (report?.improvedOutput && report.score < 80) {
        return { ...o, output: report.improvedOutput, quality: report };
      }
      return { ...o, quality: report };
    });

    setResults(autoFixed);
    setEditingOutput((prev) => {
      const next = { ...prev };
      for (const o of autoFixed) {
        if (o.quality?.improvedOutput && o.quality.score < 80) {
          next[o.format] = o.output;
        }
      }
      return next;
    });
  }

  function updateOutput(format: ContentFormat, newContent: string) {
    setResults((prev) =>
      prev.map((r) => (r.format === format ? { ...r, output: newContent } : r)),
    );
    setEditingOutput((prev) => ({ ...prev, [format]: newContent }));
  }

  async function handleExtract() {
    if (!urlInput.trim()) return;
    setExtracting(true);
    try {
      const isYoutube =
        urlInput.includes("youtube.com") || urlInput.includes("youtu.be");
      const res = await fetch("/api/content/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType: isYoutube ? "youtube" : "url",
          input: urlInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Extraction failed");

      setContent(data.content);
      setSourceType(isYoutube ? "youtube" : "url");
      setSourceUrl(urlInput.trim());
      if (data.title) setTitle(data.title);
      toast.success(`Extracted ${data.wordCount?.toLocaleString() ?? ""} words`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Extraction failed");
    } finally {
      setExtracting(false);
    }
  }

  async function handleAudioUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/content/transcribe", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Transcription failed");

      setContent(data.content);
      setTitle(data.title ?? file.name);
      setSourceType("audio");
      await updateSession({ credits: data.creditsRemaining });
      toast.success(
        `Transcribed ${data.wordCount?.toLocaleString() ?? ""} words (3 credits)`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transcription failed");
    } finally {
      setTranscribing(false);
      if (audioInputRef.current) audioInputRef.current.value = "";
    }
  }

  async function handleScheduleWeek() {
    if (results.length === 0) return;
    setSchedulingWeek(true);
    try {
      const start = new Date();
      start.setDate(start.getDate() + 1);
      start.setHours(9, 0, 0, 0);

      const posts = results.map((r, i) => {
        const scheduled = new Date(start);
        scheduled.setDate(scheduled.getDate() + i);
        return {
          title: `${title || "Post"} — ${formatLabel(r.format)}`,
          content: getOutputText(r.format),
          platform: r.format,
          scheduledAt: scheduled.toISOString(),
          contentId: contentId ?? undefined,
        };
      });

      const res = await fetch("/api/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ posts }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to schedule");

      toast.success(`Scheduled ${posts.length} posts across ${posts.length} days`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to schedule week");
    } finally {
      setSchedulingWeek(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      if (data.extractedContent) {
        setContent(data.extractedContent);
        setSourceType(file.type === "application/pdf" ? "pdf" : "file");
        toast.success(`Extracted ${data.wordCount?.toLocaleString() ?? ""} words`);
      } else {
        toast.info("File uploaded — paste or extract content manually");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    setGenerating(true);
    setShowResults(true);
    setResults([]);
    setQualityReports({});
    setGenerationProgress(10);

    const progressInterval = setInterval(() => {
      setGenerationProgress((p) => Math.min(p + 8, 85));
    }, 800);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          sourceType,
          sourceUrl: sourceUrl || undefined,
          title: title || undefined,
          formats: selectedFormats,
          options,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");

      setResults(data.outputs);
      setContentId(data.contentId);
      setActiveResultTab(data.outputs[0]?.format ?? "");
      setGenerationProgress(95);
      await updateSession();

      toast.success(
        `Generated ${data.outputs.length} format${data.outputs.length !== 1 ? "s" : ""} — ${data.creditsUsed} credits used`,
      );

      await runQualityChecks(data.outputs);
      setGenerationProgress(100);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Generation failed");
      setShowResults(false);
    } finally {
      clearInterval(progressInterval);
      setGenerating(false);
    }
  }

  function getOutputText(format: string): string {
    return editingOutput[format] ?? results.find((r) => r.format === format)?.output ?? "";
  }

  async function copyAllOutputs() {
    const pack = results
      .map((r) => `## ${formatLabel(r.format)}\n\n${getOutputText(r.format).trim()}`)
      .join("\n\n---\n\n");
    await copyToClipboard(pack);
    toast.success("Copied all outputs");
  }

  function exportAllOutputs() {
    const outputs = results.map((r) => ({
      format: r.format,
      label: formatLabel(r.format),
      content: getOutputText(r.format),
    }));
    const markdown = buildExportPack(title || "RepurAI Export", outputs);
    const slug = (title || "export")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40);
    downloadFile(`repurai-${slug}.md`, markdown, "text/markdown;charset=utf-8");
    toast.success("Export pack downloaded");
  }

  function downloadOutput(format: string) {
    const text = getOutputText(format);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${format}-${contentId ?? "output"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded");
  }

  const formatsByCategory = useMemo(() => {
    const grouped: Record<string, ContentFormat[]> = {};
    for (const format of CONTENT_FORMATS) {
      const cat = FORMAT_META[format].category;
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(format);
    }
    return grouped;
  }, []);

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Step indicator */}
      <div className="border-b border-border bg-background/50 px-8 py-4">
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(s)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  step === s
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs",
                    step === s
                      ? "bg-primary text-primary-foreground"
                      : i < stepIndex
                        ? "bg-chart-3/20 text-chart-3"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {i < stepIndex ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
              {i < STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="space-y-6 p-8">
            {/* INPUT STEP */}
            {step === "input" && (
              <div className="mx-auto max-w-3xl space-y-6">
                <Tabs defaultValue="paste" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="paste">Paste Text</TabsTrigger>
                    <TabsTrigger value="upload">Upload File</TabsTrigger>
                    <TabsTrigger value="url">From URL</TabsTrigger>
                    <TabsTrigger value="audio">Audio</TabsTrigger>
                  </TabsList>

                  <TabsContent value="paste" className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title (optional)</Label>
                      <Input
                        id="title"
                        placeholder="My awesome blog post..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="content">Your Content</Label>
                        <span className="text-xs text-muted-foreground">
                          {content.length.toLocaleString()} chars
                          {content.length < 50 && " (min 50)"}
                        </span>
                      </div>
                      <Textarea
                        id="content"
                        placeholder="Paste your blog post, transcript, newsletter, or any long-form content here..."
                        className="min-h-[280px] resize-y font-mono text-sm"
                        value={content}
                        onChange={(e) => {
                          setContent(e.target.value);
                          setSourceType("text");
                        }}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="upload" className="mt-4">
                    <Card className="border-dashed border-border/80">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.txt,.md,.doc,.docx"
                          className="hidden"
                          onChange={handleFileUpload}
                        />
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                          {uploading ? (
                            <Loader2 className="h-7 w-7 animate-spin text-primary" />
                          ) : (
                            <FileUp className="h-7 w-7 text-primary" />
                          )}
                        </div>
                        <p className="mb-1 text-sm font-medium">
                          Upload a document
                        </p>
                        <p className="mb-4 text-xs text-muted-foreground">
                          PDF, TXT, Markdown, DOC, DOCX — up to 10MB
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          <Upload className="h-4 w-4" />
                          Choose File
                        </Button>
                      </CardContent>
                    </Card>
                    {content && (
                      <div className="mt-4 rounded-lg border border-border bg-muted/20 p-4">
                        <p className="mb-2 text-xs font-medium text-muted-foreground">
                          Extracted preview
                        </p>
                        <p className="line-clamp-4 text-sm">{content}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="audio" className="mt-4">
                    <Card className="border-dashed border-border/80">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <input
                          ref={audioInputRef}
                          type="file"
                          accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg"
                          className="hidden"
                          onChange={handleAudioUpload}
                        />
                        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
                          {transcribing ? (
                            <Loader2 className="h-7 w-7 animate-spin text-violet-500" />
                          ) : (
                            <Mic className="h-7 w-7 text-violet-500" />
                          )}
                        </div>
                        <p className="mb-1 text-sm font-medium">
                          Upload podcast or audio
                        </p>
                        <p className="mb-4 text-center text-xs text-muted-foreground">
                          MP3, WAV, M4A, WebM, OGG — up to 25MB · 3 credits
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => audioInputRef.current?.click()}
                          disabled={transcribing}
                        >
                          <Mic className="h-4 w-4" />
                          Transcribe Audio
                        </Button>
                      </CardContent>
                    </Card>
                    {content && sourceType === "audio" && (
                      <div className="mt-4 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4">
                        <p className="mb-2 text-xs font-medium text-violet-600">
                          ✓ Transcript ready ({content.split(/\s+/).length} words)
                        </p>
                        <p className="line-clamp-6 text-sm">{content}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="url" className="mt-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="url">URL or YouTube video link</Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Link2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            id="url"
                            placeholder="https://youtube.com/watch?v=... or article URL"
                            className="pl-9"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                          />
                        </div>
                        <Button
                          onClick={handleExtract}
                          disabled={extracting || !urlInput.trim()}
                        >
                          {extracting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Globe className="h-4 w-4" />
                          )}
                          Extract
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        YouTube: paste a single video link (not a channel). The
                        video must have captions/subtitles — check YouTube → ⋯ →
                        Show transcript.
                      </p>
                    </div>
                    {content && (
                      <div className="rounded-lg border border-border bg-muted/20 p-4">
                        <p className="mb-2 text-xs font-medium text-chart-3">
                          ✓ Content extracted ({content.split(/\s+/).length} words)
                        </p>
                        <p className="line-clamp-6 text-sm">{content}</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end">
                  <Button
                    onClick={() => setStep("configure")}
                    disabled={content.length < 50}
                  >
                    Continue to Configure
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* CONFIGURE STEP */}
            {step === "configure" && (
              <div className="space-y-8">
                {/* Bulk Generation Presets */}
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="text-lg font-semibold">Bulk Generation</h3>
                      <p className="text-sm text-muted-foreground">
                        Generate multiple formats in a single click
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {BULK_PRESETS.map((preset) => {
                      const allowedCount = preset.formats.filter((f) =>
                        canUseFormat(plan, toOutputFormat(f)),
                      ).length;
                      const isActive = activeBulkPreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyBulkPreset(preset.id)}
                          disabled={allowedCount === 0}
                          className={cn(
                            "relative flex flex-col rounded-xl border p-4 text-left transition-all",
                            isActive
                              ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                              : "border-border hover:border-primary/30 hover:shadow-md",
                            allowedCount === 0 && "cursor-not-allowed opacity-50",
                            `bg-gradient-to-br ${preset.gradient}`,
                          )}
                        >
                          {preset.badge && (
                            <Badge
                              variant="secondary"
                              className="absolute right-3 top-3 text-[10px]"
                            >
                              {preset.badge}
                            </Badge>
                          )}
                          <div className="flex items-center gap-2">
                            <preset.icon className="h-4 w-4 text-primary" />
                            <span className="font-medium">{preset.name}</span>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {preset.description}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {preset.formats.map((f) => (
                              <Badge
                                key={f}
                                variant="outline"
                                className="text-[10px]"
                              >
                                {formatLabel(f)}
                              </Badge>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="mb-1 text-lg font-semibold">Output Formats</h3>
                    <p className="text-sm text-muted-foreground">
                      Or pick individual formats ({selectedFormats.length}{" "}
                      selected)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const available = CONTENT_FORMATS.filter((f) =>
                          canUseFormat(plan, toOutputFormat(f)),
                        ).slice(0, getMaxFormatsPerRepurpose(plan));
                        setSelectedFormats(available);
                        setActiveBulkPreset(null);
                        toast.success(`Selected ${available.length} formats`);
                      }}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedFormats([]);
                        setActiveBulkPreset(null);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {Object.entries(formatsByCategory).map(([category, formats]) => (
                  <div key={category}>
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {CATEGORY_LABELS[category] ?? category}
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {formats.map((format) => {
                        const meta = FORMAT_META[format];
                        const locked = !canUseFormat(
                          plan,
                          toOutputFormat(format),
                        );
                        const selected = selectedFormats.includes(format);
                        return (
                          <div
                            key={format}
                            role="button"
                            tabIndex={locked ? -1 : 0}
                            aria-disabled={locked}
                            onClick={() => {
                              if (locked) return;
                              toggleFormat(format);
                              setActiveBulkPreset(null);
                            }}
                            onKeyDown={(e) => {
                              if (locked) return;
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleFormat(format);
                                setActiveBulkPreset(null);
                              }
                            }}
                            className={cn(
                              "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                              selected
                                ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                                : "border-border hover:border-primary/30",
                              locked
                                ? "cursor-not-allowed opacity-50"
                                : "cursor-pointer",
                            )}
                          >
                            <Checkbox
                              checked={selected}
                              className="mt-0.5 pointer-events-none"
                              tabIndex={-1}
                              aria-hidden
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <meta.icon className="h-4 w-4 shrink-0 text-primary" />
                                <span className="text-sm font-medium">
                                  {meta.label}
                                </span>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {meta.description}
                              </p>
                              <Badge variant="secondary" className="mt-2 text-[10px]">
                                {meta.credits} credit{meta.credits !== 1 ? "s" : ""}
                                {locked && " · Pro"}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Advanced Options */}
                <Card className="border-border/60">
                  <CardHeader>
                    <CardTitle className="text-base">Advanced Options</CardTitle>
                    <CardDescription>
                      Fine-tune the tone, style, and output characteristics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                      <Label>Tone</Label>
                      <Select
                        value={options.tone}
                        onValueChange={(v) =>
                          setOptions((o) => ({
                            ...o,
                            tone: v as GenerationOptions["tone"],
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TONE_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t.charAt(0).toUpperCase() + t.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Length</Label>
                      <Select
                        value={options.length}
                        onValueChange={(v) =>
                          setOptions((o) => ({
                            ...o,
                            length: v as GenerationOptions["length"],
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LENGTH_OPTIONS.map((l) => (
                            <SelectItem key={l} value={l}>
                              {l.charAt(0).toUpperCase() + l.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Variants</Label>
                      <Select
                        value={String(options.variants ?? 1)}
                        onValueChange={(v) =>
                          setOptions((o) => ({ ...o, variants: Number(v) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <SelectItem key={n} value={String(n)}>
                              {n} variant{n !== 1 ? "s" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="audience">Target Audience</Label>
                      <Input
                        id="audience"
                        placeholder="e.g. SaaS founders, fitness enthusiasts..."
                        value={options.audience ?? ""}
                        onChange={(e) =>
                          setOptions((o) => ({ ...o, audience: e.target.value }))
                        }
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                      <Input
                        id="keywords"
                        placeholder="AI, content marketing, growth..."
                        value={options.keywords?.join(", ") ?? ""}
                        onChange={(e) =>
                          setOptions((o) => ({
                            ...o,
                            keywords: e.target.value
                              .split(",")
                              .map((k) => k.trim())
                              .filter(Boolean),
                          }))
                        }
                      />
                    </div>

                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="cta">Call to Action</Label>
                      <Input
                        id="cta"
                        placeholder="e.g. Sign up for our free trial"
                        value={options.cta ?? ""}
                        onChange={(e) =>
                          setOptions((o) => ({ ...o, cta: e.target.value }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <Label htmlFor="hashtags" className="cursor-pointer">
                        Include hashtags
                      </Label>
                      <Switch
                        id="hashtags"
                        checked={options.hashtags ?? true}
                        onCheckedChange={(v) =>
                          setOptions((o) => ({ ...o, hashtags: v }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <Label htmlFor="emojis" className="cursor-pointer">
                        Include emojis
                      </Label>
                      <Switch
                        id="emojis"
                        checked={options.emojis ?? true}
                        onCheckedChange={(v) =>
                          setOptions((o) => ({ ...o, emojis: v }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep("input")}>
                    Back
                  </Button>
                  <Button onClick={() => setStep("templates")}>
                    Browse Templates
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* TEMPLATES STEP */}
            {step === "templates" && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-1 text-lg font-semibold">Template Gallery</h3>
                  <p className="text-sm text-muted-foreground">
                    One-click presets that pre-select the best format combinations
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {STUDIO_TEMPLATES.map((template) => (
                    <Card
                      key={template.id}
                      className={cn(
                        "cursor-pointer border-border/60 transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5",
                        `bg-gradient-to-br ${template.gradient}`,
                      )}
                      onClick={() => applyTemplate(template.formats)}
                    >
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background/80">
                            <template.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <CardTitle className="text-base">
                              {template.name}
                            </CardTitle>
                            <CardDescription className="mt-0.5">
                              {template.formats.length} formats
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {template.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {template.formats.slice(0, 3).map((f) => (
                            <Badge
                              key={f}
                              variant="secondary"
                              className="text-[10px]"
                            >
                              {formatLabel(f)}
                            </Badge>
                          ))}
                          {template.formats.length > 3 && (
                            <Badge variant="secondary" className="text-[10px]">
                              +{template.formats.length - 3}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep("configure")}>
                    Back
                  </Button>
                </div>
              </div>
            )}

            {/* RESULTS */}
            {showResults && (
              <div className="space-y-4 border-t border-border pt-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Generated Results</h3>
                    <p className="text-sm text-muted-foreground">
                      {generating
                        ? `Bulk generating ${selectedFormats.length} format${selectedFormats.length !== 1 ? "s" : ""}…`
                        : checkingQuality
                          ? "Running quality checks…"
                          : `${results.length} format${results.length !== 1 ? "s" : ""} ready`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {!generating && results.length > 0 && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={copyAllOutputs}
                          className="gap-1.5"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy all
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={exportAllOutputs}
                          className="gap-1.5"
                        >
                          <Download className="h-3.5 w-3.5" />
                          Export pack
                        </Button>
                      </>
                    )}
                    {!generating && results.length > 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleScheduleWeek}
                        disabled={schedulingWeek}
                        className="gap-1.5"
                      >
                        {schedulingWeek ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CalendarPlus className="h-3.5 w-3.5" />
                        )}
                        Schedule Week
                      </Button>
                    )}
                    {contentId && !generating && (
                      <Badge variant="outline" className="font-mono text-xs">
                        Saved to library
                      </Badge>
                    )}
                  </div>
                </div>

                {generating && (
                  <div className="space-y-4">
                    <Progress value={generationProgress} className="h-2" />
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {selectedFormats.map((format) => (
                        <Card key={format} className="border-border/60">
                          <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-32" />
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <Skeleton className="h-3 w-full" />
                            <Skeleton className="h-3 w-4/5" />
                            <Skeleton className="h-3 w-3/5" />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {(checkingQuality || (!generating && results.length > 0)) && (
                  <Tabs
                    value={activeResultTab}
                    onValueChange={setActiveResultTab}
                  >
                    <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
                      {results.map((r) => (
                        <TabsTrigger
                          key={r.format}
                          value={r.format}
                          className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                        >
                          {formatLabel(r.format)}
                          {qualityReports[r.format] && (
                            <span
                              className={cn(
                                "ml-1.5 text-[10px] font-semibold",
                                qualityReports[r.format].score >= 90
                                  ? "text-chart-3"
                                  : qualityReports[r.format].score >= 75
                                    ? "text-primary"
                                    : "text-amber-500",
                              )}
                            >
                              {qualityReports[r.format].score}
                            </span>
                          )}
                        </TabsTrigger>
                      ))}
                    </TabsList>

                    {results.map((r) => (
                      <TabsContent key={r.format} value={r.format} className="mt-4">
                        <div className="mb-4 flex flex-wrap gap-2">
                          <SharePostActions
                            content={getOutputText(r.format)}
                            format={r.format}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const current = getOutputText(r.format);
                              const isEditing = r.format in editingOutput;
                              if (isEditing) {
                                setEditingOutput((prev) => {
                                  const next = { ...prev };
                                  delete next[r.format];
                                  return next;
                                });
                              } else {
                                setEditingOutput((prev) => ({
                                  ...prev,
                                  [r.format]: current,
                                }));
                              }
                            }}
                          >
                            {r.format in editingOutput ? "Done Editing" : "Edit"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleGenerate}
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Regenerate
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadOutput(r.format)}
                          >
                            <Download className="h-3.5 w-3.5" />
                            Download
                          </Button>
                          <ScheduleDialog
                            title={`${title || "Post"} — ${formatLabel(r.format)}`}
                            content={getOutputText(r.format)}
                            platform={r.format}
                            contentId={contentId ?? undefined}
                          />
                          {contentId && (
                            <Button size="sm" variant="secondary" asChild>
                              <a href={`/library?open=${contentId}`}>
                                <Save className="h-3.5 w-3.5" />
                                View in Library
                              </a>
                            </Button>
                          )}
                        </div>

                        <div className="mb-4 grid gap-4 lg:grid-cols-2">
                          <QualityPanel
                            report={qualityReports[r.format]}
                            loading={checkingQuality && !qualityReports[r.format]}
                            onApplyFix={(fixed) => updateOutput(r.format, fixed)}
                          />
                          <AiChatEditor
                            variant="content"
                            assetType={r.format}
                            content={getOutputText(r.format)}
                            outputId={r.id}
                            contentId={contentId ?? undefined}
                            onContentUpdate={(newContent) =>
                              updateOutput(r.format, newContent)
                            }
                          />
                        </div>

                        {r.format in editingOutput ? (
                          <Textarea
                            className="min-h-[300px] font-mono text-sm"
                            value={editingOutput[r.format]}
                            onChange={(e) =>
                              setEditingOutput((prev) => ({
                                ...prev,
                                [r.format]: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          <OutputRenderer
                            format={r.format}
                            output={getOutputText(r.format)}
                          />
                        )}
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Sticky generate bar */}
      <div className="border-t border-border bg-card/80 px-8 py-4 backdrop-blur-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Cost:</span>
              <span className="font-semibold">{creditCost} credits</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Balance:</span>
              <span
                className={cn(
                  "font-semibold",
                  creditCost > credits && "text-destructive",
                )}
              >
                {credits} credits
              </span>
            </div>
            {selectedFormats.length > 0 && (
              <Badge variant="secondary">
                {selectedFormats.length} format
                {selectedFormats.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>

          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="min-w-[180px]"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                {selectedFormats.length > 1
                  ? `Bulk Generate (${selectedFormats.length})`
                  : "Generate Content"}
              </>
            )}
          </Button>
        </div>
        {creditCost > credits && selectedFormats.length > 0 && (
          <p className="mt-2 text-xs text-destructive">
            Insufficient credits.{" "}
            <a href="/billing" className="underline">
              Upgrade your plan
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
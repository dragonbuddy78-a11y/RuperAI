"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import {
  BookOpen,
  Calendar,
  Copy,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  Search,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { ScheduleDialog } from "@/components/calendar/schedule-dialog";
import { PublishDialog } from "@/components/social/publish-dialog";
import { OutputRenderer } from "@/components/studio/output-renderer";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatLabel, outputFormatLabel } from "@/lib/format-meta";
import type { ContentFormat } from "@/types";

interface LibraryItem {
  id: string;
  title: string;
  sourceType: string;
  sourceUrl: string | null;
  wordCount: number;
  formatCount: number;
  creditsUsed: number;
  status: string;
  createdAt: string;
}

interface LibraryOutput {
  id: string;
  format: string;
  formatKey: string;
  output: string;
  status: string;
  creditsUsed: number;
  createdAt: string;
}

interface LibraryDetail {
  id: string;
  title: string;
  sourceType: string;
  sourceUrl: string | null;
  rawContent: string;
  wordCount: number;
  creditsUsed: number;
  createdAt: string;
  outputs: LibraryOutput[];
}

const SOURCE_LABELS: Record<string, string> = {
  TEXT: "Text",
  URL: "URL",
  YOUTUBE: "YouTube",
  PDF: "PDF",
  AUDIO: "Audio",
  FILE: "File",
};

export function LibraryView() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState<LibraryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<LibraryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchDebounced) params.set("search", searchDebounced);
      const res = await fetch(`/api/library?${params}`);
      if (!res.ok) throw new Error("Failed to fetch library");
      const data = await res.json();
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } catch {
      toast.error("Could not load library");
    } finally {
      setLoading(false);
    }
  }, [searchDebounced]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  const openDetail = useCallback(async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await fetch(`/api/library/${id}`);
      if (!res.ok) throw new Error("Failed to load content");
      const data: LibraryDetail = await res.json();
      setDetail(data);
      setActiveTab(data.outputs[0]?.formatKey ?? data.outputs[0]?.format ?? "");
    } catch {
      toast.error("Could not load content details");
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    const openId = searchParams.get("open");
    if (openId) openDetail(openId);
  }, [searchParams, openDetail]);

  function closeSheet() {
    setSelectedId(null);
    setDetail(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("open");
    router.replace(`/library${params.toString() ? `?${params}` : ""}`);
  }

  async function copyOutput(text: string) {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  function handleRerun(id: string) {
    router.push(`/studio?rerun=${id}`);
  }

  return (
    <>
      {/* Search bar */}
      <div className="border-b border-border px-8 py-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search your library..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {!loading && (
          <p className="mt-2 text-xs text-muted-foreground">
            {total} item{total !== 1 ? "s" : ""} in your library
          </p>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-8">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border-border/60">
                  <CardHeader>
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-16 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">
                {searchDebounced ? "No results found" : "Your library is empty"}
              </h3>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                {searchDebounced
                  ? `No content matches "${searchDebounced}". Try a different search.`
                  : "Generated content is automatically saved here. Create your first repurpose to get started."}
              </p>
              {!searchDebounced && (
                <Button className="mt-6" asChild>
                  <Link href="/studio">
                    <Wand2 className="h-4 w-4" />
                    Go to Content Studio
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <Card
                  key={item.id}
                  className="group cursor-pointer border-border/60 transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
                  onClick={() => openDetail(item.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-2 text-base leading-snug">
                        {item.title}
                      </CardTitle>
                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        {item.formatCount} formats
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {item.wordCount.toLocaleString()} words
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">
                        {SOURCE_LABELS[item.sourceType] ?? item.sourceType}
                      </Badge>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRerun(item.id);
                          }}
                        >
                          <RefreshCw className="h-3 w-3" />
                          Re-run
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Detail Sheet */}
      <Sheet open={!!selectedId} onOpenChange={(open) => !open && closeSheet()}>
        <SheetContent className="flex w-full flex-col overflow-hidden sm:max-w-2xl">
          {detailLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : detail ? (
            <>
              <SheetHeader className="shrink-0">
                <SheetTitle className="pr-8 text-left">{detail.title}</SheetTitle>
                <SheetDescription className="text-left">
                  {format(new Date(detail.createdAt), "MMMM d, yyyy 'at' h:mm a")}
                  {" · "}
                  {detail.wordCount.toLocaleString()} words
                  {" · "}
                  {detail.creditsUsed} credits used
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 flex shrink-0 gap-2">
                <Button size="sm" onClick={() => handleRerun(detail.id)}>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Re-run
                </Button>
                {detail.sourceUrl && (
                  <Button size="sm" variant="outline" asChild>
                    <a
                      href={detail.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Source
                    </a>
                  </Button>
                )}
              </div>

              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="mt-4 flex min-h-0 flex-1 flex-col"
              >
                <TabsList className="shrink-0 flex-wrap justify-start">
                  {detail.outputs.map((o) => (
                    <TabsTrigger key={o.id} value={o.formatKey || o.format}>
                      {o.formatKey
                        ? formatLabel(o.formatKey as ContentFormat)
                        : outputFormatLabel(o.format)}
                    </TabsTrigger>
                  ))}
                </TabsList>

                <ScrollArea className="mt-4 flex-1">
                  {detail.outputs.map((o) => (
                    <TabsContent
                      key={o.id}
                      value={o.formatKey || o.format}
                      className="mt-0 pb-6"
                    >
                      <div className="mb-3 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyOutput(o.output)}
                        >
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </Button>
                        <ScheduleDialog
                          title={`${detail.title} — ${o.formatKey || o.format}`}
                          content={o.output}
                          platform={o.formatKey || o.format}
                          outputId={o.id}
                          contentId={detail.id}
                        />
                        <PublishDialog
                          title={`${detail.title} — ${o.formatKey || o.format}`}
                          content={o.output}
                          format={o.formatKey || o.format}
                          outputId={o.id}
                          contentId={detail.id}
                        />
                      </div>
                      <OutputRenderer
                        format={o.formatKey || o.format}
                        output={o.output}
                      />
                    </TabsContent>
                  ))}
                </ScrollArea>
              </Tabs>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </>
  );
}
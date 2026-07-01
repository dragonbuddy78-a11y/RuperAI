"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  Crown,
  DollarSign,
  FileText,
  FolderOpen,
  Layers,
  Loader2,
  Mail,
  Megaphone,
  Plus,
  Save,
  Sparkles,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import { AiChatEditor } from "@/components/studio/ai-chat-editor";

import { Header } from "@/components/layout/header";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { hasFeature } from "@/lib/plans";
import { cn } from "@/lib/utils";
import {
  MONETIZATION_CREDIT_COSTS,
  MONETIZATION_TYPES,
  type MonetizationProjectData,
  type MonetizationType,
  type MonetizeBulkResponse,
  type MonetizeResponse,
} from "@/types";

interface LibraryContent {
  id: string;
  title: string;
  rawContent: string;
  wordCount: number;
  _count: { outputs: number };
}

interface GeneratedAsset {
  id: string;
  type: MonetizationType;
  output: string;
  creditsUsed: number;
  createdAt: Date;
}

const MONETIZATION_OPTIONS: {
  type: MonetizationType;
  label: string;
  description: string;
  icon: React.ElementType;
  gradient: string;
}[] = [
  {
    type: "analyze",
    label: "Strategies Overview",
    description: "Revenue score, quick wins & monetization angles",
    icon: TrendingUp,
    gradient: "from-violet-500/20 to-purple-600/10",
  },
  {
    type: "sales_page",
    label: "Sales Page",
    description: "Long-form direct-response sales copy",
    icon: FileText,
    gradient: "from-emerald-500/20 to-teal-600/10",
  },
  {
    type: "email_sequence",
    label: "Email Sequence",
    description: "5-email launch & nurture funnel",
    icon: Mail,
    gradient: "from-blue-500/20 to-cyan-600/10",
  },
  {
    type: "course_outline",
    label: "Course Outline",
    description: "Premium curriculum & launch plan",
    icon: BookOpen,
    gradient: "from-amber-500/20 to-orange-600/10",
  },
  {
    type: "affiliate_scripts",
    label: "Affiliate Scripts",
    description: "Swipe files for partners & promoters",
    icon: Megaphone,
    gradient: "from-pink-500/20 to-rose-600/10",
  },
  {
    type: "lead_magnet",
    label: "Lead Magnet",
    description: "High-converting opt-in offer",
    icon: Target,
    gradient: "from-indigo-500/20 to-blue-600/10",
  },
  {
    type: "pricing_strategy",
    label: "Pricing Strategy",
    description: "Tiers, anchors & packaging psychology",
    icon: DollarSign,
    gradient: "from-green-500/20 to-lime-600/10",
  },
];

const STRATEGY_CARDS = [
  {
    title: "Digital Product",
    revenue: "$497–$2,997",
    description: "Transform expertise into a course, template pack, or toolkit",
    icon: BookOpen,
  },
  {
    title: "Email Funnel",
    revenue: "$2k–$10k/mo",
    description: "Nurture subscribers into buyers with automated sequences",
    icon: Mail,
  },
  {
    title: "Affiliate Revenue",
    revenue: "15–40% rev share",
    description: "Recruit promoters with ready-made swipe copy",
    icon: Megaphone,
  },
  {
    title: "Lead Generation",
    revenue: "$5–$50/lead",
    description: "Capture emails with a high-value free resource",
    icon: Target,
  },
];

function getTypeLabel(type: MonetizationType): string {
  return MONETIZATION_OPTIONS.find((o) => o.type === type)?.label ?? type;
}

function parseAnalyzeSections(output: string): { title: string; content: string }[] {
  const sections = output.split(/(?=\n#{1,3}\s|\n\d+\.\s+[A-Z])/);
  if (sections.length <= 1) {
    return [{ title: "Full Analysis", content: output }];
  }
  return sections
    .filter((s) => s.trim())
    .map((section) => {
      const lines = section.trim().split("\n");
      const title = lines[0].replace(/^#+\s*/, "").replace(/^\d+\.\s*/, "").trim();
      return { title, content: section.trim() };
    })
    .slice(0, 8);
}

export default function MonetizationPage() {
  const { data: session, update } = useSession();
  const [library, setLibrary] = useState<LibraryContent[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [selectedContentId, setSelectedContentId] = useState<string>("paste");
  const [content, setContent] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<MonetizationType[]>([
    "sales_page",
  ]);
  const [productName, setProductName] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [batchAssets, setBatchAssets] = useState<GeneratedAsset[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [projects, setProjects] = useState<MonetizationProjectData[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("none");
  const [savingProject, setSavingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  const plan = session?.user?.plan ?? "FREE";
  const credits = session?.user?.credits ?? 0;
  const hasAccess = hasFeature(plan, "monetization");

  const creditCost = useMemo(
    () =>
      selectedTypes.reduce(
        (sum, type) => sum + MONETIZATION_CREDIT_COSTS[type],
        0,
      ),
    [selectedTypes],
  );

  const canGenerate =
    content.length >= 100 &&
    selectedTypes.length > 0 &&
    creditCost <= credits &&
    !generating;

  const loadLibrary = useCallback(async () => {
    try {
      setLibraryLoading(true);
      const res = await fetch("/api/content?limit=50&status=COMPLETED");
      if (!res.ok) throw new Error("Failed to load library");
      const data = await res.json();
      setLibrary(data.contents ?? []);
    } catch {
      toast.error("Could not load content library");
    } finally {
      setLibraryLoading(false);
    }
  }, []);

  const loadProjects = useCallback(async () => {
    try {
      setProjectsLoading(true);
      const res = await fetch("/api/monetization/projects");
      if (!res.ok) throw new Error("Failed to load projects");
      const data = await res.json();
      setProjects(data.projects ?? []);
    } catch {
      toast.error("Could not load monetization projects");
    } finally {
      setProjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLibrary();
    if (hasAccess) loadProjects();
  }, [loadLibrary, loadProjects, hasAccess]);

  async function handleCreateProject() {
    const name = newProjectName.trim() || `Project ${projects.length + 1}`;
    try {
      const res = await fetch("/api/monetization/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create project");
      setProjects((prev) => [data.project, ...prev]);
      setSelectedProjectId(data.project.id);
      setNewProjectName("");
      toast.success(`Project "${name}" created`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create project");
    }
  }

  async function handleLoadProject(projectId: string) {
    if (projectId === "none") {
      setBatchAssets([]);
      setActiveTab("");
      return;
    }
    try {
      const res = await fetch(`/api/monetization/projects/${projectId}`);
      if (!res.ok) throw new Error("Failed to load project");
      const data = await res.json();
      const assets = data.project.assets ?? [];
      if (assets.length === 0) {
        toast.info("This project has no saved assets yet");
        return;
      }
      setBatchAssets(
        assets.map(
          (a: {
            id: string;
            type: MonetizationType;
            output: string;
            creditsUsed: number;
            createdAt: string;
          }) => ({
            id: a.id,
            type: a.type,
            output: a.output,
            creditsUsed: a.creditsUsed,
            createdAt: new Date(a.createdAt),
          }),
        ),
      );
      setActiveTab(assets[0].type);
      toast.success(`Loaded ${assets.length} saved asset(s)`);
    } catch {
      toast.error("Could not load project assets");
    }
  }

  async function handleSaveToProject() {
    if (selectedProjectId === "none" || batchAssets.length === 0) {
      toast.error("Select a project and generate assets first");
      return;
    }
    setSavingProject(true);
    try {
      const res = await fetch(`/api/monetization/projects/${selectedProjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assets: batchAssets.map((a) => ({
            type: a.type,
            title: getTypeLabel(a.type),
            output: a.output,
            creditsUsed: a.creditsUsed,
            context: {
              productName: productName || undefined,
              targetAudience: targetAudience || undefined,
            },
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save");
      await loadProjects();
      toast.success(`Saved ${batchAssets.length} asset(s) to project`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save project");
    } finally {
      setSavingProject(false);
    }
  }

  useEffect(() => {
    if (selectedContentId === "paste") return;
    const item = library.find((c) => c.id === selectedContentId);
    if (item) {
      setContent(item.rawContent);
    }
  }, [selectedContentId, library]);

  const activeAsset = useMemo(
    () => batchAssets.find((a) => a.type === activeTab),
    [batchAssets, activeTab],
  );

  function toggleType(type: MonetizationType) {
    setSelectedTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type],
    );
  }

  function selectAllTypes() {
    setSelectedTypes([...MONETIZATION_TYPES]);
    toast.success(`Selected all ${MONETIZATION_TYPES.length} asset types`);
  }

  function clearTypes() {
    setSelectedTypes([]);
  }

  function updateAssetOutput(type: MonetizationType, newOutput: string) {
    setBatchAssets((prev) =>
      prev.map((a) =>
        a.type === type ? { ...a, output: newOutput } : a,
      ),
    );
  }

  async function handleGenerate() {
    if (!canGenerate) {
      if (content.length < 100) {
        toast.error("Content must be at least 100 characters");
      } else if (selectedTypes.length === 0) {
        toast.error("Select at least one asset type");
      } else if (creditCost > credits) {
        toast.error("Insufficient credits", {
          description: `You need ${creditCost} credits but have ${credits}.`,
        });
      }
      return;
    }

    setGenerating(true);
    setBatchAssets([]);
    setGenerationProgress(10);

    const progressInterval = setInterval(() => {
      setGenerationProgress((p) => Math.min(p + 6, 90));
    }, 600);

    try {
      const payload =
        selectedTypes.length === 1
          ? {
              content,
              type: selectedTypes[0],
              context: {
                productName: productName || undefined,
                targetAudience: targetAudience || undefined,
              },
            }
          : {
              content,
              types: selectedTypes,
              context: {
                productName: productName || undefined,
                targetAudience: targetAudience || undefined,
              },
            };

      const res = await fetch("/api/monetize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "PLAN_LIMIT") {
          toast.error("Upgrade required", {
            description: "Monetization Studio requires a paid plan.",
          });
        } else {
          toast.error(data.error ?? "Generation failed");
        }
        return;
      }

      let newAssets: GeneratedAsset[] = [];
      let creditsRemaining = credits;
      let totalCreditsUsed = 0;

      if ("outputs" in data) {
        const bulk = data as MonetizeBulkResponse;
        newAssets = bulk.outputs.map((o) => ({
          id: crypto.randomUUID(),
          type: o.type,
          output: o.output,
          creditsUsed: o.creditsUsed,
          createdAt: new Date(),
        }));
        creditsRemaining = bulk.creditsRemaining;
        totalCreditsUsed = bulk.creditsUsed;

        if (bulk.failedTypes?.length) {
          toast.warning(
            `${bulk.failedTypes.length} asset(s) failed to generate`,
          );
        }
      } else {
        const result = data as MonetizeResponse;
        newAssets = [
          {
            id: crypto.randomUUID(),
            type: result.type,
            output: result.output,
            creditsUsed: result.creditsUsed,
            createdAt: new Date(),
          },
        ];
        creditsRemaining = result.creditsRemaining;
        totalCreditsUsed = result.creditsUsed;
      }

      setBatchAssets(newAssets);
      setActiveTab(newAssets[0]?.type ?? "");
      setGenerationProgress(100);
      await update({ credits: creditsRemaining });

      toast.success(
        `Generated ${newAssets.length} asset${newAssets.length !== 1 ? "s" : ""}!`,
        { description: `Used ${totalCreditsUsed} credits.` },
      );
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      clearInterval(progressInterval);
      setGenerating(false);
    }
  }

  function copyOutput(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  if (!hasAccess) {
    return (
      <>
        <Header
          title="Monetization Studio"
          description="Turn your content into revenue-generating assets"
        />
        <div className="flex flex-1 items-center justify-center p-8">
          <Card className="max-w-lg border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Crown className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Unlock Monetization Studio</CardTitle>
              <CardDescription className="text-base">
                Generate sales pages, email sequences, course outlines, and
                revenue strategies from your existing content.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid gap-2 text-sm text-muted-foreground">
                {MONETIZATION_OPTIONS.slice(0, 4).map((opt) => (
                  <div key={opt.type} className="flex items-center gap-2">
                    <opt.icon className="h-4 w-4 text-primary" />
                    {opt.label}
                  </div>
                ))}
              </div>
              <Button asChild size="lg" className="w-full">
                <a href="/billing">
                  Upgrade to Starter
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        title="Monetization Studio"
        description="Transform your content into revenue-generating business assets"
        actions={
          <Badge variant="secondary" className="gap-1.5 px-3 py-1">
            <Zap className="h-3.5 w-3.5 text-primary" />
            {credits} credits
          </Badge>
        }
      />

      <ScrollArea className="flex-1">
        <div className="space-y-8 p-8">
          {/* Projects */}
          <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FolderOpen className="h-4 w-4 text-primary" />
                Monetization Projects
              </CardTitle>
              <CardDescription>
                Save and revisit your sales pages, email sequences, and other assets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1 space-y-2">
                  <Label>Active project</Label>
                  {projectsLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={selectedProjectId}
                      onValueChange={(id) => {
                        setSelectedProjectId(id);
                        void handleLoadProject(id);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a project" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No project selected</SelectItem>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.assetCount} assets)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="New project name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-40"
                  />
                  <Button variant="outline" onClick={handleCreateProject}>
                    <Plus className="h-4 w-4" />
                    New
                  </Button>
                  <Button
                    onClick={handleSaveToProject}
                    disabled={
                      savingProject ||
                      selectedProjectId === "none" ||
                      batchAssets.length === 0
                    }
                  >
                    {savingProject ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Assets
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Strategy opportunity cards */}
          <section>
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Revenue Opportunities</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STRATEGY_CARDS.map((card) => (
                <Card
                  key={card.title}
                  className="group border-border/60 transition-all hover:border-primary/40 hover:shadow-md hover:shadow-primary/5"
                >
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <card.icon className="h-4 w-4 text-primary" />
                      </div>
                      <Badge
                        variant="outline"
                        className="border-primary/30 text-primary"
                      >
                        {card.revenue}
                      </Badge>
                    </div>
                    <h3 className="font-semibold">{card.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <div className="grid gap-8 lg:grid-cols-5">
            {/* Input panel */}
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Source Content</CardTitle>
                  <CardDescription>
                    Select from your library or paste content directly
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {libraryLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : (
                    <Select
                      value={selectedContentId}
                      onValueChange={setSelectedContentId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select content" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="paste">Paste content manually</SelectItem>
                        {library.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.title} ({item.wordCount} words)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Textarea
                    placeholder="Paste your article, transcript, or long-form content here (min. 100 characters)..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={10}
                    className="resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {content.length.toLocaleString()} characters
                    {content.length < 100 && " — minimum 100 required"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Context (optional)</CardTitle>
                  <CardDescription>
                    Improve output quality with product details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Product / Offer Name</Label>
                    <Input
                      id="productName"
                      placeholder="e.g. Content Repurposing Masterclass"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetAudience">Target Audience</Label>
                    <Input
                      id="targetAudience"
                      placeholder="e.g. Solo creators with 5k+ followers"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <Layers className="h-4 w-4 text-primary" />
                        Asset Types
                      </CardTitle>
                      <CardDescription>
                        Select one or more — bulk generate in one click
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={selectAllTypes}
                      >
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={clearTypes}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {MONETIZATION_OPTIONS.map((opt) => {
                    const selected = selectedTypes.includes(opt.type);
                    return (
                      <div
                        key={opt.type}
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleType(opt.type)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            toggleType(opt.type);
                          }
                        }}
                        className={cn(
                          "flex w-full cursor-pointer items-start gap-3 rounded-lg border p-3 text-left transition-all",
                          selected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/30 hover:bg-muted/50",
                        )}
                      >
                        <Checkbox
                          checked={selected}
                          className="mt-1 pointer-events-none"
                          tabIndex={-1}
                          aria-hidden
                        />
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br",
                            opt.gradient,
                          )}
                        >
                          <opt.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium">
                              {opt.label}
                            </span>
                            <Badge
                              variant="secondary"
                              className="shrink-0 text-xs"
                            >
                              {MONETIZATION_CREDIT_COSTS[opt.type]} cr
                            </Badge>
                          </div>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {opt.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <div className="rounded-xl border border-border/60 bg-card/50 p-4">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {selectedTypes.length} asset
                    {selectedTypes.length !== 1 ? "s" : ""} selected
                  </span>
                  <span className="font-semibold">
                    <Zap className="mr-1 inline h-3.5 w-3.5 text-primary" />
                    {creditCost} credits total
                  </span>
                </div>
                {creditCost > credits && selectedTypes.length > 0 && (
                  <p className="mb-3 text-xs text-destructive">
                    Insufficient credits — need {creditCost}, have {credits}
                  </p>
                )}
                <Button
                  size="lg"
                  className="w-full gap-2"
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Bulk generating {selectedTypes.length} asset
                      {selectedTypes.length !== 1 ? "s" : ""}…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      {selectedTypes.length > 1
                        ? `Bulk Generate (${selectedTypes.length})`
                        : `Generate ${getTypeLabel(selectedTypes[0] ?? "analyze")}`}
                      <Badge variant="secondary" className="ml-1">
                        {creditCost} credits
                      </Badge>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Results panel */}
            <div className="lg:col-span-3">
              <Card className="min-h-[600px] border-primary/10">
                <CardHeader className="border-b border-border/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Generated Assets</CardTitle>
                      <CardDescription>
                        Your monetization outputs appear here
                      </CardDescription>
                    </div>
                    {activeAsset && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyOutput(activeAsset.output)}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {generating && (
                    <div className="space-y-4 border-b border-border/60 px-6 py-6">
                      <Progress value={generationProgress} className="h-2" />
                      <p className="text-sm text-muted-foreground">
                        Generating {selectedTypes.length} monetization asset
                        {selectedTypes.length !== 1 ? "s" : ""} in parallel…
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTypes.map((type) => (
                          <Badge
                            key={type}
                            variant="secondary"
                            className="gap-1"
                          >
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {getTypeLabel(type)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {!generating && batchAssets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                        <DollarSign className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold">Ready to monetize</h3>
                      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                        Select multiple asset types, hit Bulk Generate, and get
                        sales pages, email sequences, and more — all in one go.
                      </p>
                    </div>
                  ) : (
                    batchAssets.length > 0 && (
                      <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <div className="border-b border-border/60 px-6 pt-4">
                          <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
                            {batchAssets.map((asset) => (
                              <TabsTrigger
                                key={asset.type}
                                value={asset.type}
                                className="gap-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                              >
                                <Check className="h-3 w-3 text-chart-3" />
                                {getTypeLabel(asset.type)}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                        </div>

                        {batchAssets.map((asset) => (
                          <TabsContent
                            key={asset.type}
                            value={asset.type}
                            className="mt-0"
                          >
                            <div className="border-b border-border/60 p-4">
                              <AiChatEditor
                                variant="monetization"
                                assetType={asset.type}
                                content={asset.output}
                                onContentUpdate={(newContent) =>
                                  updateAssetOutput(asset.type, newContent)
                                }
                              />
                            </div>

                            {asset.type === "analyze" &&
                            activeTab === "analyze" ? (
                              <div className="p-6">
                                <Tabs
                                  defaultValue={
                                    parseAnalyzeSections(asset.output)[0]
                                      ?.title
                                  }
                                >
                                  <TabsList className="mb-4 h-auto flex-wrap">
                                    {parseAnalyzeSections(asset.output).map(
                                      (section) => (
                                        <TabsTrigger
                                          key={section.title}
                                          value={section.title}
                                          className="text-xs"
                                        >
                                          {section.title.slice(0, 30)}
                                          {section.title.length > 30 ? "…" : ""}
                                        </TabsTrigger>
                                      ),
                                    )}
                                  </TabsList>
                                  {parseAnalyzeSections(asset.output).map(
                                    (section) => (
                                      <TabsContent
                                        key={section.title}
                                        value={section.title}
                                      >
                                        <div className="rounded-lg border border-border/60 bg-muted/30 p-6">
                                          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                                            {section.content}
                                          </pre>
                                        </div>
                                      </TabsContent>
                                    ),
                                  )}
                                </Tabs>
                              </div>
                            ) : (
                              <ScrollArea className="h-[420px]">
                                <div className="p-6">
                                  <div className="rounded-lg border border-border/60 bg-muted/30 p-6">
                                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
                                      {asset.output}
                                    </pre>
                                  </div>
                                </div>
                              </ScrollArea>
                            )}
                            <div className="flex items-center justify-between border-t border-border/60 px-6 py-3 text-xs text-muted-foreground">
                              <span>
                                Generated{" "}
                                {asset.createdAt.toLocaleTimeString()}
                              </span>
                              <span>{asset.creditsUsed} credits used</span>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    )
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ScrollArea>
    </>
  );
}
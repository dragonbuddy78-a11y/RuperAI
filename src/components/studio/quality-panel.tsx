"use client";

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
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
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { QualityReport } from "@/lib/ai/quality-check";

interface QualityPanelProps {
  report?: QualityReport;
  loading?: boolean;
  onApplyFix?: (fixedContent: string) => void;
  className?: string;
}

function scoreColor(score: number): string {
  if (score >= 90) return "text-chart-3";
  if (score >= 75) return "text-primary";
  if (score >= 60) return "text-amber-500";
  return "text-destructive";
}

function scoreLabel(score: number): string {
  if (score >= 90) return "Publish ready";
  if (score >= 75) return "Good";
  if (score >= 60) return "Needs polish";
  return "Needs work";
}

const ISSUE_ICONS: Record<string, string> = {
  grammar: "Grammar",
  spelling: "Spelling",
  readability: "Readability",
  style: "Style",
};

export function QualityPanel({
  report,
  loading,
  onApplyFix,
  className,
}: QualityPanelProps) {
  if (loading) {
    return (
      <Card className={cn("border-border/60", className)}>
        <CardContent className="flex items-center gap-3 py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div>
            <p className="text-sm font-medium">Running quality check…</p>
            <p className="text-xs text-muted-foreground">
              Checking grammar, spelling, and readability
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!report) return null;

  const hasIssues = report.issues.length > 0;

  return (
    <Card className={cn("border-border/60", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">
              Quality Check
            </CardTitle>
          </div>
          <Badge
            variant="secondary"
            className={cn("font-semibold", scoreColor(report.score))}
          >
            {report.score}/100 · {scoreLabel(report.score)}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {report.wordCount} words · Readability: {report.readabilityGrade}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <Progress value={report.score} className="h-1.5" />

        {!hasIssues ? (
          <div className="flex items-center gap-2 rounded-lg border border-chart-3/30 bg-chart-3/5 px-3 py-2 text-sm text-chart-3">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            No issues found — content looks great!
          </div>
        ) : (
          <ul className="space-y-2">
            {report.issues.map((issue, i) => (
              <li
                key={i}
                className="flex gap-2 rounded-lg border border-border/60 bg-muted/20 px-3 py-2 text-sm"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div>
                  <p className="font-medium">
                    {ISSUE_ICONS[issue.type] ?? issue.type}: {issue.message}
                  </p>
                  {issue.suggestion && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {issue.suggestion}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {report.improvedOutput && onApplyFix && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onApplyFix(report.improvedOutput!)}
          >
            <Wand2 className="mr-2 h-3.5 w-3.5" />
            Apply suggested fixes
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
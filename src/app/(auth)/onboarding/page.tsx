"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const contentTypes = [
  "Blog posts",
  "Newsletters",
  "Podcasts",
  "YouTube videos",
  "Social posts",
  "Courses & webinars",
  "Ebooks & guides",
  "Case studies",
];

const platforms = [
  "Twitter / X",
  "LinkedIn",
  "Instagram",
  "TikTok",
  "YouTube",
  "Facebook",
  "Threads",
  "Email",
  "Blog / SEO",
  "Pinterest",
];

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-all",
        selected
          ? "border-primary bg-primary/15 text-foreground ring-1 ring-primary/30"
          : "border-border/60 bg-card/50 text-muted-foreground hover:border-border hover:text-foreground",
      )}
    >
      {selected && <Check className="h-3.5 w-3.5 text-primary" />}
      {label}
    </button>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();
  const [step, setStep] = useState(1);
  const [selectedContent, setSelectedContent] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/sign-in?callbackUrl=/onboarding");
    } else if (
      status === "authenticated" &&
      session?.user?.onboardingCompleted
    ) {
      router.replace("/dashboard");
    }
  }, [status, session, router]);

  function toggleItem(
    item: string,
    list: string[],
    setter: (v: string[]) => void,
  ) {
    setter(
      list.includes(item)
        ? list.filter((i) => i !== item)
        : [...list, item],
    );
  }

  async function saveProgress(
    data: Record<string, unknown>,
    completed = false,
  ) {
    const res = await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Failed to save preferences");
    }

    if (completed) {
      await update({ onboardingCompleted: true });
    }
  }

  async function handleNext() {
    if (step === 1 && selectedContent.length === 0) {
      toast.error("Select at least one content type");
      return;
    }

    setSaving(true);
    try {
      await saveProgress({
        contentTypes: selectedContent,
        onboardingStep: step,
      });
      setStep(2);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleFinish() {
    if (selectedPlatforms.length === 0) {
      toast.error("Select at least one platform");
      return;
    }

    setSaving(true);
    try {
      await saveProgress(
        {
          contentTypes: selectedContent,
          platforms: selectedPlatforms,
          onboardingStep: 2,
          onboardingCompleted: true,
        },
        true,
      );
      toast.success("You're all set!");
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
      setSaving(false);
    }
  }

  if (status === "loading") {
    return (
      <Card className="w-full max-w-lg border-border/60 bg-card/80">
        <CardContent className="py-12 text-center text-muted-foreground">
          Loading...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg border-border/60 bg-card/80 backdrop-blur">
      <CardHeader>
        <div className="mb-2 flex gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                s <= step ? "bg-primary" : "bg-border",
              )}
            />
          ))}
        </div>
        <CardTitle className="text-xl">
          {step === 1
            ? "What type of content do you create?"
            : "What are your main platforms?"}
        </CardTitle>
        <CardDescription>
          {step === 1
            ? "Select all that apply — we'll tailor your experience."
            : "We'll prioritize formats for the channels you use most."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {step === 1 ? (
          <div className="flex flex-wrap gap-2">
            {contentTypes.map((type) => (
              <Chip
                key={type}
                label={type}
                selected={selectedContent.includes(type)}
                onClick={() =>
                  toggleItem(type, selectedContent, setSelectedContent)
                }
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {platforms.map((platform) => (
              <Chip
                key={platform}
                label={platform}
                selected={selectedPlatforms.includes(platform)}
                onClick={() =>
                  toggleItem(platform, selectedPlatforms, setSelectedPlatforms)
                }
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          {step === 2 ? (
            <Button
              variant="ghost"
              onClick={() => setStep(1)}
              disabled={saving}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step === 1 ? (
            <Button onClick={handleNext} disabled={saving}>
              {saving ? "Saving..." : "Continue"}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving}>
              {saving ? "Finishing..." : "Go to dashboard"}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
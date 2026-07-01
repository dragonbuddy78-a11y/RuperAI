"use client";

import { useRef, useState } from "react";
import { Loader2, MessageSquare, Send, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

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
import { cn } from "@/lib/utils";
import type { ContentFormat, MonetizationType } from "@/types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

type EditorVariant = "content" | "monetization";

interface AiChatEditorProps {
  variant: EditorVariant;
  assetType: ContentFormat | MonetizationType;
  content: string;
  outputId?: string;
  contentId?: string;
  onContentUpdate: (newContent: string) => void;
  quickPrompts?: string[];
  className?: string;
}

const CONTENT_QUICK_PROMPTS = [
  "Make it shorter",
  "Add more hooks",
  "Make it more casual",
  "Improve the first tweet",
  "Make it punchier",
  "Add a stronger CTA",
];

const MONETIZATION_QUICK_PROMPTS = [
  "Make it shorter",
  "Make it more persuasive",
  "Add more benefits",
  "Improve the hook",
  "Rewrite in a more casual tone",
  "Strengthen the CTA",
];

export function AiChatEditor({
  variant,
  assetType,
  content,
  outputId,
  contentId,
  onContentUpdate,
  quickPrompts,
  className,
}: AiChatEditorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const prompts =
    quickPrompts ??
    (variant === "monetization"
      ? MONETIZATION_QUICK_PROMPTS
      : CONTENT_QUICK_PROMPTS);

  const apiUrl =
    variant === "monetization"
      ? "/api/monetize/edit"
      : "/api/generate/edit";

  async function sendInstruction(instruction: string) {
    if (!instruction.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: instruction.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setExpanded(true);

    try {
      const body =
        variant === "monetization"
          ? {
              content,
              type: assetType,
              instruction: instruction.trim(),
              history: [...messages, userMessage],
            }
          : {
              content,
              format: assetType,
              instruction: instruction.trim(),
              history: [...messages, userMessage],
              outputId,
              contentId,
            };

      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Edit failed");

      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.output,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      onContentUpdate(data.output);
      toast.success("Content updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Edit failed");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }

  return (
    <Card
      className={cn(
        "border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent",
        className,
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold">
                AI Chat Editor
              </CardTitle>
              <CardDescription className="text-xs">
                Refine with natural language instructions
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setExpanded((e) => !e)}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            {expanded ? "Collapse" : "Expand"}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {prompts.map((prompt) => (
            <Button
              key={prompt}
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              disabled={loading}
              onClick={() => sendInstruction(prompt)}
            >
              <Wand2 className="mr-1 h-3 w-3" />
              {prompt}
            </Button>
          ))}
        </div>

        {expanded && messages.length > 0 && (
          <ScrollArea className="h-48 rounded-lg border border-border/60 bg-background/50 p-3">
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm",
                    msg.role === "user"
                      ? "ml-6 bg-muted/60 text-foreground"
                      : "mr-6 border border-primary/20 bg-primary/5",
                  )}
                >
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {msg.role === "user" ? "You" : "AI"}
                  </p>
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {msg.role === "assistant"
                      ? `${msg.content.slice(0, 200)}${msg.content.length > 200 ? "…" : ""}`
                      : msg.content}
                  </p>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Applying your edit…
                </div>
              )}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
        )}

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void sendInstruction(input);
          }}
        >
          <Input
            placeholder={
              variant === "monetization"
                ? 'e.g. "Make the headline more compelling"'
                : 'e.g. "Make the hook more controversial"'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            className="text-sm"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ExternalLink, Link2, Loader2, RefreshCw, Share2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SocialAccount {
  platform: string;
  label: string;
  displayName?: string;
  username?: string;
  profileUrl?: string;
}

export function SocialAccountsSettings() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);

  const loadAccounts = useCallback(async () => {
    try {
      const res = await fetch("/api/social/accounts");
      const data = await res.json();
      setConfigured(Boolean(data.configured));
      setAccounts(data.accounts ?? []);
    } catch {
      toast.error("Failed to load social accounts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    if (searchParams.get("social") === "connected") {
      toast.success("Social accounts updated");
      loadAccounts();
    }
  }, [searchParams, loadAccounts]);

  async function handleConnect() {
    setConnecting(true);
    try {
      const res = await fetch("/api/social/connect", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start connection");

      window.open(data.url, "_blank", "noopener,noreferrer");
      toast.success("Connect your accounts in the new tab, then return here.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to connect social accounts",
      );
    } finally {
      setConnecting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Share2 className="h-4 w-4" />
          Social Media Publishing
        </CardTitle>
        <CardDescription>
          Connect accounts to publish generated content directly to Twitter/X,
          LinkedIn, Instagram, and more.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <Skeleton className="h-24 w-full" />
        ) : !configured ? (
          <p className="text-sm text-muted-foreground">
            Social publishing is being set up. Check back soon — your admin needs
            to add Ayrshare API keys.
          </p>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              {accounts.length === 0 ? (
                <Badge variant="outline">No accounts connected yet</Badge>
              ) : (
                accounts.map((account) => (
                  <Badge key={account.platform} className="gap-1.5">
                    <Link2 className="h-3 w-3" />
                    {account.label}
                    {account.username ? ` · @${account.username.replace(/^@/, "")}` : ""}
                  </Badge>
                ))
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleConnect} disabled={connecting}>
                {connecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                {accounts.length > 0 ? "Manage connections" : "Connect accounts"}
              </Button>
              <Button variant="outline" onClick={loadAccounts}>
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              A secure window opens to link your social accounts. RepurAI never
              sees your passwords.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
"use client";

import { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { AlertTriangle, Check, Link2, Loader2, Save, Trash2 } from "lucide-react";

import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { BrandVoiceSettings } from "@/components/settings/brand-voice-settings";
import { Badge } from "@/components/ui/badge";

import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { FORMAT_LABELS } from "@/lib/format-utils";
import {
  CONTENT_FORMATS,
  TONE_OPTIONS,
  type ContentFormat,
  type Tone,
} from "@/types";

interface ConnectedAccount {
  provider: string;
  providerAccountId: string;
}

interface SettingsUser {
  id: string;
  name: string | null;
  email: string | null;
  defaultTone: string | null;
  defaultPlatforms: string[];
  hasPassword?: boolean;
  connectedAccounts?: ConnectedAccount[];
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [defaultTone, setDefaultTone] = useState<Tone | "">("");
  const [defaultPlatforms, setDefaultPlatforms] = useState<ContentFormat[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [hasPassword, setHasPassword] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      const data = await res.json();
      const user = data.user as SettingsUser;
      setName(user.name ?? "");
      setEmail(user.email ?? "");
      setDefaultTone((user.defaultTone as Tone) ?? "");
      setDefaultPlatforms((user.defaultPlatforms as ContentFormat[]) ?? []);
      setConnectedAccounts(user.connectedAccounts ?? []);
      setHasPassword(Boolean(user.hasPassword));
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  function togglePlatform(format: ContentFormat) {
    setDefaultPlatforms((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format],
    );
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || undefined,
          defaultTone: defaultTone || null,
          defaultPlatforms,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Failed to save settings");
        return;
      }

      toast.success("Settings saved successfully");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== "DELETE") {
      toast.error('Please type "DELETE" to confirm');
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/settings", { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Failed to delete account");
        return;
      }

      toast.success("Account deleted");
      await signOut({ callbackUrl: "/" });
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  return (
    <>
      <Header
        title="Settings"
        description="Manage your profile and preferences"
        actions={
          <Button onClick={handleSave} disabled={saving || loading} className="gap-2">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-8">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Profile</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={email}
                      readOnly
                      disabled
                      className="bg-muted/50"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Connected accounts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Link2 className="h-4 w-4" />
                Connected Accounts
              </CardTitle>
              <CardDescription>
                Sign in with OAuth providers linked to your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <Skeleton className="h-20 w-full" />
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    {["google", "github"].map((provider) => {
                      const connected = connectedAccounts.some(
                        (a) => a.provider === provider,
                      );
                      return (
                        <Badge
                          key={provider}
                          variant={connected ? "default" : "outline"}
                          className="gap-1.5 capitalize"
                        >
                          {connected && <Check className="h-3 w-3" />}
                          {provider}
                          {connected ? " connected" : " not connected"}
                        </Badge>
                      );
                    })}
                  </div>
                  {hasPassword && (
                    <p className="text-xs text-muted-foreground">
                      Email/password sign-in is also enabled for this account.
                    </p>
                  )}
                  <OAuthButtons callbackUrl="/settings" mode="connect" />
                </>
              )}
            </CardContent>
          </Card>

          {/* Brand Voice */}
          <BrandVoiceSettings />

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preferences</CardTitle>
              <CardDescription>
                Default options for content generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {loading ? (
                <>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-32 w-full" />
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Default Tone</Label>
                    <Select
                      value={defaultTone}
                      onValueChange={(v) => setDefaultTone(v as Tone)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a default tone" />
                      </SelectTrigger>
                      <SelectContent>
                        {TONE_OPTIONS.map((tone) => (
                          <SelectItem key={tone} value={tone}>
                            {tone.charAt(0).toUpperCase() + tone.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Default Platforms</Label>
                    <p className="text-xs text-muted-foreground">
                      Pre-selected formats when creating new content
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {CONTENT_FORMATS.map((format) => (
                        <label
                          key={format}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={defaultPlatforms.includes(format)}
                            onCheckedChange={() => togglePlatform(format)}
                          />
                          <span className="text-sm">{FORMAT_LABELS[format]}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Danger Zone
              </CardTitle>
              <CardDescription>
                Irreversible actions for your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium">Delete Account</p>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-2">
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete your account?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. All your content, outputs,
                        and billing data will be permanently removed.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-4">
                      <Label htmlFor="confirmDelete">
                        Type <span className="font-mono font-semibold">DELETE</span> to confirm
                      </Label>
                      <Input
                        id="confirmDelete"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="DELETE"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setDeleteDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={deleting || deleteConfirmText !== "DELETE"}
                      >
                        {deleting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete Forever
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <Separator />
          <p className="text-center text-xs text-muted-foreground">
            RepurAI · Settings are saved to your account
          </p>
        </div>
      </div>
    </>
  );
}
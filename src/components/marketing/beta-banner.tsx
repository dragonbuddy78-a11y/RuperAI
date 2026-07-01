import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { BETA_MESSAGE, isBetaFreePro } from "@/lib/beta";

export function BetaBanner({ className = "" }: { className?: string }) {
  if (!isBetaFreePro()) return null;

  return (
    <div
      className={`rounded-xl border border-primary/30 bg-gradient-to-r from-primary/10 via-violet-500/5 to-transparent px-4 py-3 text-sm ${className}`}
    >
      <div className="flex flex-wrap items-center justify-center gap-2 text-center">
        <Badge variant="secondary" className="gap-1 border-primary/20 bg-primary/10 text-primary">
          <Sparkles className="h-3 w-3" />
          Open Beta
        </Badge>
        <span className="text-muted-foreground">{BETA_MESSAGE}</span>
      </div>
    </div>
  );
}
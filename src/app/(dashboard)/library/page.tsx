import { Suspense } from "react";
import Link from "next/link";
import { Loader2, Wand2 } from "lucide-react";

import { LibraryView } from "@/components/library/library-view";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";

function LibraryFallback() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function LibraryPage() {
  return (
    <>
      <Header
        title="My Library"
        description="All your repurposed content, saved and ready to reuse"
        actions={
          <Button asChild>
            <Link href="/studio">
              <Wand2 className="h-4 w-4" />
              New Repurpose
            </Link>
          </Button>
        }
      />
      <Suspense fallback={<LibraryFallback />}>
        <LibraryView />
      </Suspense>
    </>
  );
}
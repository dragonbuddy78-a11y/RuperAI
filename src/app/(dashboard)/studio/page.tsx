import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { ContentStudio } from "@/components/studio/content-studio";
import { Header } from "@/components/layout/header";

function StudioFallback() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function StudioPage() {
  return (
    <>
      <Header
        title="Content Studio"
        description="Transform one piece of content into platform-ready posts, threads, and campaigns"
      />
      <Suspense fallback={<StudioFallback />}>
        <ContentStudio />
      </Suspense>
    </>
  );
}
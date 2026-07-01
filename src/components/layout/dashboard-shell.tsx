import { Sidebar } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: React.ReactNode;
  credits?: number;
  className?: string;
}

export function DashboardShell({
  children,
  credits,
  className,
}: DashboardShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar credits={credits} />
      <main className={cn("flex flex-1 flex-col overflow-hidden", className)}>
        {children}
      </main>
    </div>
  );
}
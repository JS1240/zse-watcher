import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Keyboard } from "lucide-react";

interface DividendsSkeletonProps {
  className?: string;
  rows?: number;
}

export function DividendsSkeleton({ className, rows = 3 }: DividendsSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-md border border-border bg-card p-2.5">
          <Skeleton className="mb-1 h-2.5 w-20" />
          <Skeleton className="h-5 w-12" />
        </div>
        <div className="rounded-md border border-border bg-card p-2.5">
          <Skeleton className="mb-1 h-2.5 w-16" />
          <Skeleton className="h-5 w-10" />
        </div>
        <div className="rounded-md border border-border bg-card p-2.5">
          <Skeleton className="mb-1 h-2.5 w-16" />
          <Skeleton className="h-5 w-14" />
        </div>
      </div>

      {/* Search + filter controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-8 flex-1 min-w-[180px]" />
        <div className="flex gap-1">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-8 w-14" />
        <Skeleton className="h-8 w-14" />
      </div>

      {/* Year headers skeleton */}
      {Array.from({ length: 2 }).map((_, yearIndex) => (
        <div key={yearIndex}>
          <div className="mb-2 flex items-center justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>

          {/* Dividend rows skeleton */}
          <div className="space-y-1 rounded-md border border-border bg-card">
            {Array.from({ length: rows }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2.5"
              >
                {/* Ticker + name */}
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3.5 w-12" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-2.5 w-36" />
                  </div>
                </div>

                {/* Amount + yield */}
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-end gap-0.5">
                    <Skeleton className="h-3.5 w-14" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Always-visible keyboard shortcuts hint — matches main dividends calendar pattern */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm border border-border/50 bg-muted/30 px-3 py-1.5 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <Keyboard className="h-2.5 w-2.5" />
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Enter</kbd>
          <span>detalji</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">↑↓</kbd>
          <span>navigiraj</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">/</kbd>
          <span>pretraži</span>
        </span>
      </div>
    </div>
  );
}

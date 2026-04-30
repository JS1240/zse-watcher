import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ReceivedDividendsSkeletonProps {
  className?: string;
  rows?: number;
}

export function ReceivedDividendsSkeleton({ className, rows = 3 }: ReceivedDividendsSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4 animate-shimmer" />
          <Skeleton className="h-3 w-28 animate-shimmer" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-12 animate-shimmer" />
          <Skeleton className="h-6 w-24 animate-shimmer" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border border-border bg-card overflow-hidden">
        {/* Table header */}
        <div className="bg-muted/50 px-3 py-2 border-b border-border">
          <div className="flex items-center justify-between text-[9px] uppercase tracking-wider text-muted-foreground">
            <Skeleton className="h-2.5 w-16 animate-shimmer" />
            <Skeleton className="h-2.5 w-20 animate-shimmer" />
            <Skeleton className="h-2.5 w-16 animate-shimmer" />
          </div>
        </div>

        {/* Table rows skeleton */}
        <div className="divide-y divide-border/50">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2.5">
              {/* Ticker + details */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-14 animate-shimmer" />
                <div className="space-y-1">
                  <Skeleton className="h-2.5 w-20 animate-shimmer" />
                  <Skeleton className="h-2 w-28 animate-shimmer" />
                </div>
              </div>

              {/* Amount */}
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end gap-0.5">
                  <Skeleton className="h-3 w-16 animate-shimmer" />
                  <Skeleton className="h-2.5 w-12 animate-shimmer" />
                </div>
                <Skeleton className="h-6 w-6 rounded animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Always-visible keyboard shortcuts hint — matching received-dividends pattern */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/50 bg-muted/20 px-3 py-2 text-[9px] text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-0.5">
            <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Del</kbd>
            <span className="hidden sm:inline">briši</span>
          </span>
          <span className="flex items-center gap-0.5">
            <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Enter</kbd>
            <span className="hidden sm:inline">dionicu</span>
          </span>
          <span className="flex items-center gap-0.5">
            <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">↑↓</kbd>
            <span className="hidden sm:inline">navigiraj</span>
          </span>
          <span className="flex items-center gap-0.5">
            <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">/</kbd>
            <span className="hidden sm:inline">traži</span>
          </span>
        </div>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">N</kbd>
          <span className="hidden sm:inline">novi unos</span>
        </span>
      </div>
    </div>
  );
}

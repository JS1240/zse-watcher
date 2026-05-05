import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Keyboard } from "lucide-react";

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

      {/* Always-visible keyboard shortcuts hint — matches standard skeleton pattern */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm border border-border/50 bg-muted/30 px-3 py-1.5 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <Keyboard className="h-2.5 w-2.5" />
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Del</kbd>
          <span>obri\u0161i</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Enter</kbd>
          <span>detalji</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">\u2191\u2193</kbd>
          <span>navigiraj</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">/</kbd>
          <span>pretra\u017ei</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">N</kbd>
          <span>novi unos</span>
        </span>
      </div>
    </div>
  );
}
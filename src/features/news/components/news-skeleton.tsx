import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Keyboard } from "lucide-react";

interface NewsSkeletonProps {
  className?: string;
  rows?: number;
}

export function NewsSkeleton({ className, rows = 4 }: NewsSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex gap-3 rounded-md border border-border bg-card p-3"
        >
          {/* Date column */}
          <div className="flex flex-col items-center gap-1">
            <Skeleton className="h-3 w-8 animate-shimmer" />
            <Skeleton className="h-2 w-6 animate-shimmer" />
          </div>

          {/* Content column */}
          <div className="flex flex-1 flex-col gap-2">
            {/* Ticker + Category badges */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-10 rounded animate-shimmer" />
              <Skeleton className="h-3 w-14 rounded-full animate-shimmer" />
            </div>

            {/* Title */}
            <Skeleton className="h-4 w-full animate-shimmer" />

            {/* Summary line (alternating widths for realism) */}
            <Skeleton className="h-3 w-3/4 animate-shimmer" />
          </div>

          {/* External link icon placeholder */}
          <div className="flex items-start">
            <Skeleton className="h-4 w-4 rounded animate-shimmer" />
          </div>
        </div>
      ))}

      {/* Always-visible keyboard shortcuts hint — matches main news feed pattern */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm border border-border/50 bg-muted/30 px-3 py-1.5 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <Keyboard className="h-2.5 w-2.5" />
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">↑↓</kbd>
          <span>navigiraj</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Enter</kbd>
          <span>detalji</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">/</kbd>
          <span>pretraži</span>
        </span>
      </div>
    </div>
  );
}

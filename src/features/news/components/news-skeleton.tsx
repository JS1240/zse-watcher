import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
              <Skeleton className="h-4 w-10 animate-shimmer rounded" />
              <Skeleton className="h-3 w-14 animate-shimmer rounded-full" />
            </div>

            {/* Title */}
            <Skeleton className="h-4 w-full animate-shimmer" />

            {/* Summary line (alternating widths for realism) */}
            <Skeleton className="h-3 w-3/4 animate-shimmer" />
          </div>

          {/* External link icon placeholder */}
          <div className="flex items-start">
            <Skeleton className="h-4 w-4 animate-shimmer rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
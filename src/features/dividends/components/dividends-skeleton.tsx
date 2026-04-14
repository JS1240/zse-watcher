import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface DividendsSkeletonProps {
  className?: string;
  rows?: number;
}

export function DividendsSkeleton({ className, rows = 4 }: DividendsSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Year headers skeleton */}
      {Array.from({ length: 2 }).map((_, yearIndex) => (
        <div key={yearIndex}>
          <div className="mb-2 flex items-center justify-between">
            <Skeleton className="h-4 w-12 animate-shimmer" />
            <Skeleton className="h-4 w-20 animate-shimmer" />
          </div>

          {/* Dividend rows skeleton */}
          <div className="space-y-1 rounded-md border border-border bg-card">
            {Array.from({ length: rows }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-3 py-2"
              >
                {/* Ticker + Shares */}
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3.5 w-10 animate-shimmer" />
                  <Skeleton className="h-3 w-14 animate-shimmer" />
                </div>

                {/* Amount */}
                <div className="flex items-center gap-3">
                  <Skeleton className="h-3 w-16 animate-shimmer" />
                  <Skeleton className="h-3 w-12 animate-shimmer" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PortfolioAnalyticsSkeletonProps {
  className?: string;
}

/**
 * Skeleton loader for PortfolioAnalytics page.
 * Matches the exact layout: performance chart, 4 metric cards, sector allocation (donut + legend), holdings breakdown.
 * Provides polished loading UI for Croatian retail investors.
 */
export function PortfolioAnalyticsSkeleton({ className }: PortfolioAnalyticsSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Loading label */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-32 animate-shimmer" />
        <Skeleton className="h-2 w-16 animate-shimmer" />
      </div>

      {/* Performance chart skeleton */}
      <div className="rounded-md border border-border bg-card p-4">
        <Skeleton className="h-[10px] w-24 animate-shimmer" />
        <Skeleton className="mt-3 h-[200px] w-full animate-shimmer" />
      </div>

      {/* Summary metrics skeleton */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {/* Total Value */}
        <div className="rounded-md border border-border bg-card p-3">
          <Skeleton className="h-2 w-16 animate-shimmer" />
          <Skeleton className="mt-2 h-6 w-24 animate-shimmer" />
        </div>
        {/* Total Return */}
        <div className="rounded-md border border-border bg-card p-3">
          <Skeleton className="h-2 w-20 animate-shimmer" />
          <Skeleton className="mt-2 h-6 w-20 animate-shimmer" />
        </div>
        {/* Best Performer */}
        <div className="rounded-md border border-border bg-card p-3">
          <Skeleton className="h-2 w-20 animate-shimmer" />
          <Skeleton className="mt-2 h-6 w-16 animate-shimmer" />
        </div>
        {/* Worst Performer */}
        <div className="rounded-md border border-border bg-card p-3">
          <Skeleton className="h-2 w-20 animate-shimmer" />
          <Skeleton className="mt-2 h-6 w-16 animate-shimmer" />
        </div>
      </div>

      {/* Sector allocation skeleton */}
      <div className="rounded-md border border-border bg-card p-4">
        <Skeleton className="h-[10px] w-24 animate-shimmer" />
        <div className="mt-3 flex gap-6">
          {/* Donut chart skeleton */}
          <Skeleton className="h-[140px] w-[140px] shrink-0 rounded-full animate-shimmer" />
          {/* Legend skeleton */}
          <div className="flex flex-col justify-center gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-2.5 w-2.5 rounded-sm animate-shimmer" />
                <Skeleton className="h-3 w-16 animate-shimmer" />
                <Skeleton className="ml-auto h-3 w-10 animate-shimmer" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings breakdown skeleton */}
      <div className="rounded-md border border-border bg-card p-4">
        <Skeleton className="h-[10px] w-28 animate-shimmer" />
        <div className="mt-3 space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-3 w-12 animate-shimmer" />
              <div className="flex-1">
                <Skeleton className="h-2 w-full animate-shimmer" />
              </div>
              <Skeleton className="h-3 w-14 animate-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
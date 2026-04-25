/**
 * Skeleton loading state for StockFundamentals.
 * Provides consistent loading UX while news/data is being fetched.
 * For Croatian retail investors.
 */

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StockFundamentalsSkeletonProps {
  className?: string;
}

export function StockFundamentalsSkeleton({ className }: StockFundamentalsSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Description skeleton */}
      <div className="space-y-1.5">
        <Skeleton className="h-2 w-20 animate-shimmer" />
        <Skeleton className="h-3 w-full animate-shimmer" />
        <Skeleton className="h-3 w-4/5 animate-shimmer" />
      </div>

      {/* Key metrics grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {/* Row 1 */}
        <MetricSkeleton />
        <MetricSkeleton />
        {/* Row 2 */}
        <MetricSkeleton />
        <MetricSkeleton />
        {/* Row 3 */}
        <MetricSkeleton />
        <MetricSkeleton />
      </div>

      {/* 52-week range bar skeleton */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-2 w-12 animate-shimmer" />
          <Skeleton className="h-2 w-16 animate-shimmer" />
          <Skeleton className="h-2 w-12 animate-shimmer" />
        </div>
        <Skeleton className="h-3 w-full animate-shimmer" />
        <div className="flex justify-between">
          <Skeleton className="h-3 w-20 animate-shimmer" />
          <Skeleton className="h-3 w-12 animate-shimmer" />
        </div>
      </div>

      {/* Related news skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-2 w-24 animate-shimmer" />
        <div className="space-y-1.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="flex w-full items-start justify-between gap-2 rounded-sm border border-border/50 bg-card px-2 py-1.5"
            >
              <div className="min-w-0 flex-1 space-y-1">
                <Skeleton className="h-3 w-4/5 animate-shimmer" />
                <Skeleton className="h-2 w-1/3 animate-shimmer" />
              </div>
              <Skeleton className="h-3 w-3 shrink-0 animate-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricSkeleton() {
  return (
    <div className="space-y-1">
      <Skeleton className="h-2 w-16 animate-shimmer" />
      <Skeleton className="h-3 w-20 animate-shimmer" />
    </div>
  );
}
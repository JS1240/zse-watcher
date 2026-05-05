/**
 * Skeleton loading state for StockFundamentals.
 * Provides consistent loading UX while stock fundamentals/data is being fetched.
 * Mirrors the actual StockFundamentals layout for Croatian retail investors.
 */

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StockFundamentalsSkeletonProps {
  className?: string;
}

export function StockFundamentalsSkeleton({ className }: StockFundamentalsSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Investment Summary skeleton — matches actual layout with 3-column grid + combined signal */}
      <div>
        <Skeleton className="mb-2 h-2 w-20 animate-shimmer" />
        <div className="rounded-md border border-border bg-card p-3 space-y-2.5">
          {/* 3-column metrics grid */}
          <div className="grid grid-cols-3 gap-3">
            <MetricSkeleton labelWidth="w-16" valueWidth="w-12" />
            <MetricSkeleton labelWidth="w-10" valueWidth="w-10" />
            <MetricSkeleton labelWidth="w-20" valueWidth="w-8" />
          </div>
          {/* Combined signal badge row */}
          <div className="flex items-center justify-between pt-1.5 border-t border-border/50">
            <Skeleton className="h-2 w-12 animate-shimmer" />
            <Skeleton className="h-4 w-12 rounded-full animate-shimmer" />
          </div>
        </div>
      </div>

      {/* Description skeleton */}
      <div className="space-y-1">
        <Skeleton className="h-2 w-20 animate-shimmer" />
        <Skeleton className="h-3 w-full animate-shimmer" />
        <Skeleton className="h-3 w-4/5 animate-shimmer" />
      </div>

      {/* Key metrics grid skeleton — 6 items in 2 columns */}
      <div className="grid grid-cols-2 gap-3">
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
        <MetricSkeleton />
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
        <div className="flex items-center justify-between">
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

function MetricSkeleton({ labelWidth = "w-16", valueWidth = "w-20" }: { labelWidth?: string; valueWidth?: string }) {
  return (
    <div className="space-y-1">
      <Skeleton className={cn("h-2 animate-shimmer", labelWidth)} />
      <Skeleton className={cn("h-3 animate-shimmer", valueWidth)} />
    </div>
  );
}
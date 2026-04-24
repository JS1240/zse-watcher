import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MoversSkeletonProps {
  /** Number of gainers/losers to show (default: 5) */
  count?: number;
  className?: string;
}

export function MoversSkeleton({ count = 5, className }: MoversSkeletonProps) {
  return (
    <div className={className}>
      {/* Header timestamp skeleton */}
      <Skeleton className="h-4 w-32 mb-3 animate-shimmer" />

      {/* Gainers section */}
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-3.5 w-3.5 text-price-up" />
        <Skeleton className="h-4 w-16 animate-shimmer" />
      </div>
      <div className="space-y-0.5">
        {Array.from({ length: count }).map((_, i) => (
          <MoverRowSkeleton key={i} />
        ))}
      </div>

      {/* Losers section */}
      <div className="flex items-center gap-2 mt-4 mb-2">
        <TrendingDown className="h-3.5 w-3.5 text-price-down" />
        <Skeleton className="h-4 w-16 animate-shimmer" />
      </div>
      <div className="space-y-0.5">
        {Array.from({ length: count }).map((_, i) => (
          <MoverRowSkeleton key={`loser-${i}`} />
        ))}
      </div>
    </div>
  );
}

function MoverRowSkeleton() {
  return (
    <div className="flex w-full items-center justify-between rounded-sm px-2 py-1.5">
      <div className="flex flex-col gap-1">
        {/* Ticker skeleton */}
        <Skeleton className="h-3.5 w-12 animate-shimmer" />
        {/* Name skeleton - narrower */}
        <Skeleton className="h-3 w-20 animate-shimmer" />
      </div>
      <div className="flex flex-col items-end gap-1">
        {/* Price skeleton */}
        <Skeleton className="h-3.5 w-10 animate-shimmer" />
        {/* Change badge skeleton */}
        <Skeleton className="h-3 w-12 animate-shimmer" />
      </div>
    </div>
  );
}
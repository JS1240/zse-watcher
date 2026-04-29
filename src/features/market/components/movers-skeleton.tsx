import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Keyboard } from "lucide-react";

interface MoversSkeletonProps {
  /** Number of gainers/losers to show (default: 5) */
  count?: number;
  className?: string;
}

export function MoversSkeleton({ count = 5, className }: MoversSkeletonProps) {
  return (
    <div className={className}>
      {/* Header timestamp skeleton */}
      <Skeleton className="h-4 w-32 mb-3" />

      {/* Gainers section */}
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp className="h-3.5 w-3.5 text-price-up" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-0.5">
        {Array.from({ length: count }).map((_, i) => (
          <MoverRowSkeleton key={i} />
        ))}
      </div>

      {/* Losers section */}
      <div className="flex items-center gap-2 mt-4 mb-2">
        <TrendingDown className="h-3.5 w-3.5 text-price-down" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-0.5">
        {Array.from({ length: count }).map((_, i) => (
          <MoverRowSkeleton key={`loser-${i}`} />
        ))}
      </div>

      {/* Always-visible keyboard shortcuts hint — matches main market movers pattern */}
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
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">S</kbd>
          <span>prati</span>
        </span>
      </div>
    </div>
  );
}

function MoverRowSkeleton() {
  return (
    <div className="flex w-full items-center justify-between rounded-sm px-2 py-1.5">
      <div className="flex flex-col gap-1">
        {/* Ticker skeleton */}
        <Skeleton className="h-3.5 w-12" />
        {/* Name skeleton - narrower */}
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="flex flex-col items-end gap-1">
        {/* Price skeleton */}
        <Skeleton className="h-3.5 w-10" />
        {/* Change badge skeleton */}
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  );
}

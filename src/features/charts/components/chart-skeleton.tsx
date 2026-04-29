import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Keyboard } from "lucide-react";

interface ChartSkeletonProps {
  height?: number;
  className?: string;
}

/**
 * Skeleton loader for chart components.
 * Provides polished loading state matching the exact chart dimensions.
 * Croatian retail investors see visual feedback while market data loads.
 */
export function ChartSkeleton({ height = 300, className }: ChartSkeletonProps) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-xl bg-background/50", className)}
      style={{ height }}
    >
      {/* Title area */}
      <div className="absolute left-4 top-4 flex items-center gap-3">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-16" />
      </div>

      {/* Y-axis labels */}
      <div className="absolute left-2 top-1/2 flex flex-col justify-between h-[60%]">
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-10" />
      </div>

      {/* X-axis labels */}
      <div className="absolute bottom-4 left-1/3 flex justify-between w-2/3">
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
        <Skeleton className="h-3 w-12" />
      </div>

      {/* Chart area skeleton - fake line/candles */}
      <div className="absolute left-16 right-4 top-12 bottom-10">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between">
          <Skeleton className="h-px w-full opacity-30" />
          <Skeleton className="h-px w-full opacity-30" />
          <Skeleton className="h-px w-full opacity-30" />
          <Skeleton className="h-px w-full opacity-30" />
        </div>

        {/* Fake candlestick shapes */}
        <div className="absolute inset-0 flex items-end justify-between gap-2 px-1">
          {Array.from({ length: 12 }).map((_, i) => {
            // Vary heights for realistic skeleton
            const heights = [45, 65, 35, 80, 55, 70, 40, 85, 60, 50, 75, 45];
            const candleHeight = heights[i % heights.length];
            const isGreen = i % 2 === 0;

            return (
              <div
                key={i}
                className={cn(
                  "w-full rounded-sm",
                  isGreen ? "bg-emerald-500/30" : "bg-red-500/30"
                )}
                style={{ height: `${candleHeight}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* Subtle pulse animation */}
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-background/20 to-transparent opacity-30" />

      {/* Always-visible keyboard shortcuts hint — matches main chart pattern */}
      <div className="absolute bottom-2 right-2 flex items-center gap-2 text-[9px] text-muted-foreground">
        <Keyboard className="h-2.5 w-2.5" />
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Cmd+K</kbd>
          <span>izbornik</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">T</kbd>
          <span>tema</span>
        </span>
      </div>
    </div>
  );
}

import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface HeatmapSkeletonProps {
  className?: string;
}

export function HeatmapSkeleton({ className }: HeatmapSkeletonProps) {
  const { t } = useTranslation("heatmap");
  const SECTOR_COUNT = 8;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Legend skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-2.5 w-24 animate-shimmer rounded-full" />
          <div className="flex items-center gap-1">
            {["-3%", "0%", "+3%"].map((_, i) => (
              <Skeleton
                key={i}
                className="h-3 w-8 animate-shimmer rounded-full"
              />
            ))}
          </div>
        </div>
        <Skeleton className="h-5 w-16 animate-shimmer rounded" />
      </div>

      {/* Sector grid skeleton - realistic layout */}
      <div className="relative h-80 overflow-hidden rounded-md border border-border">
        {/* Placeholder sector blocks */}
        <div className="absolute inset-2 grid grid-cols-4 gap-2">
          {Array.from({ length: SECTOR_COUNT }).map((_, i) => {
            // Simulate varying sector sizes
            const sizes = [
              "col-span-2 row-span-2",
              "col-span-1 row-span-1",
              "col-span-1 row-span-2",
              "col-span-2 row-span-1",
              "col-span-1 row-span-1",
              "col-span-1 row-span-1",
              "col-span-1 row-span-1",
              "col-span-1 row-span-1",
            ];
            return (
              <div
                key={i}
                className={cn(
                  "relative overflow-hidden rounded-sm border border-border/30",
                  sizes[i % sizes.length]
                )}
              >
                <Skeleton className="h-full w-full animate-shimmer" />
                {/* Subtle overlay text lines */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                  <Skeleton className="h-3 w-12 animate-shimmer rounded" />
                  <Skeleton className="mt-1 h-2 w-8 animate-shimmer rounded" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom legend skeleton */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
          {t("legend.worst")}
        </span>
        <div className="flex h-2 w-32 overflow-hidden rounded-full">
          <Skeleton className="h-full w-1/3 animate-shimmer" />
          <Skeleton className="h-full w-1/3 animate-shimmer" />
          <Skeleton className="h-full w-1/3 animate-shimmer" />
        </div>
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
          {t("legend.best")}
        </span>
      </div>

      {/* Hover details skeleton - shown on hover in real component */}
      <div className="rounded-md border border-border bg-card p-3">
        <Skeleton className="h-4 w-24 animate-shimmer" />
        <Skeleton className="mt-2 h-3 w-32 animate-shimmer" />
      </div>
    </div>
  );
}
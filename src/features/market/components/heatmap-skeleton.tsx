import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Keyboard } from "lucide-react";

interface HeatmapSkeletonProps {
  className?: string;
}

export function HeatmapSkeleton({ className }: HeatmapSkeletonProps) {
  const { t } = useTranslation("heatmap");

  return (
    <div className={cn("space-y-3", className)}>
      {/* Legend skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-2.5 w-24 rounded-full" />
          <div className="flex items-center gap-1">
            {["-3%", "0%", "+3%"].map((_, i) => (
              <Skeleton
                key={i}
                className="h-3 w-8 rounded-full"
              />
            ))}
          </div>
        </div>
        <Skeleton className="h-5 w-16 rounded" />
      </div>

      {/* Sector grid skeleton - shimmer-animated blocks with varying sizes */}
      <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
        {/* Simulate varying sector sizes with a realistic distribution */}
        {[
          { h: "h-[140px]", span: 1 },
          { h: "h-[100px]", span: 1 },
          { h: "h-[120px]", span: 1 },
          { h: "h-[90px]", span: 1 },
          { h: "h-[160px]", span: 1 },
          { h: "h-[110px]", span: 1 },
          { h: "h-[130px]", span: 1 },
          { h: "h-[95px]", span: 1 },
          { h: "h-[145px]", span: 1 },
          { h: "h-[105px]", span: 1 },
          { h: "h-[125px]", span: 1 },
          { h: "h-[88px]", span: 1 },
        ].map((sector, i) => (
          <div
            key={i}
            className={cn(
              "rounded-md border border-border/30 p-2",
              sector.h
            )}
          >
            <div className="flex items-center justify-between">
              {/* Sector name skeleton */}
              <Skeleton className="h-2.5 w-16 rounded" />
              {/* Change % skeleton */}
              <Skeleton className="h-2.5 w-10 rounded" />
            </div>
            {/* Ticker chips skeleton */}
            <div className="mt-2 flex flex-wrap gap-0.5">
              {Array.from({ length: Math.floor(Math.random() * 5) + 3 }).map((_, j) => (
                <Skeleton
                  key={j}
                  className={cn(
                    "h-4 rounded-sm",
                    j % 3 === 0 ? "w-8" : j % 3 === 1 ? "w-10" : "w-7"
                  )}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom legend skeleton */}
      <div className="flex items-center justify-center gap-2">
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
          {t("legend.worst")}
        </span>
        <div className="flex h-2 w-32 overflow-hidden rounded-full">
          <Skeleton className="h-full w-1/3" />
          <Skeleton className="h-full w-1/3" />
          <Skeleton className="h-full w-1/3" />
        </div>
        <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
          {t("legend.best")}
        </span>
      </div>

      {/* Hover details skeleton */}
      <div className="rounded-md border border-border bg-card p-3">
        <Skeleton className="h-4 w-24" />
        <div className="mt-2 space-y-1">
          <div className="flex justify-between">
            <Skeleton className="h-2.5 w-12 rounded" />
            <Skeleton className="h-2.5 w-8 rounded" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-2.5 w-16 rounded" />
            <Skeleton className="h-2.5 w-6 rounded" />
          </div>
        </div>
      </div>

      {/* Always-visible keyboard shortcuts hint — matches main heatmap page pattern */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm border border-border/50 bg-muted/30 px-3 py-1.5 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <Keyboard className="h-2.5 w-2.5" />
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Cmd+K</kbd>
          <span>izbornik</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">?</kbd>
          <span>prečaci</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">T</kbd>
          <span>tema</span>
        </span>
      </div>
    </div>
  );
}

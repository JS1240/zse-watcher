import { useCallback, useEffect, useState, memo } from "react";
import { useTranslation } from "react-i18next";
import { Radio, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveDataIndicatorProps {
  /** TanStack Query dataUpdatedAt timestamp (ms) */
  updatedAt: number;
  /** Whether data is actively being refetched */
  isFetching?: boolean;
  className?: string;
}

/**
 * Returns a human-readable time difference for Croatian retail investors
 * Uses natural Croatian phrasing like Croatian finance apps
 */
function useRelativeTime(updatedAt: number): string {
  const { t } = useTranslation("common");

  const compute = useCallback(() => {
    const diff = Date.now() - updatedAt;
    
    // Less than 5 seconds - "upravo sada"
    if (diff < 5_000) return t("time.justNow");
    
    // Less than 1 minute
    if (diff < 60_000) {
      const s = Math.floor(diff / 1_000);
      return t("time.secondsAgo", { count: s });
    }
    
    // 1-59 minutes
    if (diff < 3_600_000) {
      const m = Math.floor(diff / 60_000);
      return t("time.minutesAgo", { count: m });
    }
    
    // 1+ hours - show "1 sat", "2 sata", etc.
    const h = Math.floor(diff / 3_600_000);
    if (h === 1) return t("time.hoursAgo", { count: h }) || `prije 1 sat`;
    if (h >= 2 && h <= 4) return t("time.hoursAgo", { count: h }) || `prije ${h} sata`;
    return t("time.hoursAgo", { count: h }) || `prije ${h} sati`;
  }, [updatedAt, t]);

  const [label, setLabel] = useState(compute);

  // Refresh label every 30s so "prije 45 sekundi" eventually becomes "prije 1 min"
  useEffect(() => {
    setLabel(compute());
    const id = setTimeout(() => setLabel(compute()), 30_000);
    return () => clearTimeout(id);
  }, [updatedAt, compute]);

  return label;
}

/**
 * Determines if data is considered "fresh" (recently updated)
 */
function isDataFresh(updatedAt: number): boolean {
  const diff = Date.now() - updatedAt;
  return diff < 60_000; // Less than 1 minute = fresh
}

/**
 * Determines if data is "stale" (needs attention)
 */
function isDataStale(updatedAt: number): boolean {
  const diff = Date.now() - updatedAt;
  return diff > 300_000; // More than 5 minutes = stale
}

export const LiveDataIndicator = memo(function LiveDataIndicator({
  updatedAt,
  isFetching,
  className,
}: LiveDataIndicatorProps) {
  const label = useRelativeTime(updatedAt);
  const isFresh = isDataFresh(updatedAt);
  const isStale = isDataStale(updatedAt);

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 font-data text-[10px] tabular-nums",
        isFetching && "text-primary",
        isStale && !isFetching && "text-amber",
        !isFetching && !isStale && "text-muted-foreground",
        className,
      )}
      aria-live="polite"
      aria-label={isFetching ? "Osvježavanje podataka" : `Zadnje ažurirano ${label}`}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {isFetching ? (
          <>
            <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-75" />
            <RefreshCw className="relative h-1.5 w-1.5 animate-spin text-primary" />
          </>
        ) : isStale ? (
          <>
            <span className="absolute inset-0 animate-pulse rounded-full bg-amber" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-amber" />
          </>
        ) : isFresh ? (
          <>
            <span className="absolute inset-0 animate-pulse rounded-full bg-emerald-500" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </>
        ) : (
          <>
            <span className="absolute inset-0 animate-pulse rounded-full bg-price-up" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-price-up" />
          </>
        )}
      </span>
      <Radio className={cn("h-3 w-3", isFetching && "animate-spin")} />
      <span>{isFetching ? "Osvježavam..." : label}</span>
    </div>
  );
});

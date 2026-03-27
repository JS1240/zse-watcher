import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";

interface LiveDataIndicatorProps {
  /** TanStack Query dataUpdatedAt timestamp (ms) */
  updatedAt: number;
  /** Whether data is actively being refetched */
  isFetching?: boolean;
  className?: string;
}

function useRelativeTime(updatedAt: number): string {
  const { t } = useTranslation("common");

  const compute = useCallback(() => {
    const diff = Date.now() - updatedAt;
    if (diff < 5_000) return t("time.justNow");
    if (diff < 60_000) {
      const s = Math.floor(diff / 1_000);
      return t("time.secondsAgo", { count: s });
    }
    const m = Math.floor(diff / 60_000);
    return t("time.minutesAgo", { count: m });
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

export function LiveDataIndicator({
  updatedAt,
  isFetching,
  className,
}: LiveDataIndicatorProps) {
  const label = useRelativeTime(updatedAt);

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 font-data text-[10px] tabular-nums text-muted-foreground",
        className,
      )}
      aria-live="polite"
      aria-label={"Last updated " + label}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0">
        {isFetching ? (
          <span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-75" />
        ) : (
          <span className="absolute inset-0 animate-pulse rounded-full bg-price-up" />
        )}
        <span className="relative h-1.5 w-1.5 rounded-full bg-price-up" />
      </span>
      <Radio className="h-3 w-3" />
      <span>{label}</span>
    </div>
  );
}

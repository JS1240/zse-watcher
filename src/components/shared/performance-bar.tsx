import { useState, useCallback, memo } from "react";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/formatters";
import { toast } from "sonner";
import i18n from "i18next";

interface PerformanceBarProps {
  /** Current value */
  value: number;
  /** Baseline/reference value (e.g., 52w low, zero, average) */
  baseline: number;
  /** Ceiling value (e.g., 52w high) — bar fills proportionally between baseline and ceiling */
  ceiling?: number;
  /** Floor value (e.g., 52w low) — implied when ceiling is set */
  floor?: number;
  /** Manual bar fill percentage (0-100) — overrides computed fill */
  fillPercent?: number;
  /** Show value label */
  showValue?: boolean;
  /** Compact mode — smaller padding and text */
  compact?: boolean;
  /** Custom className */
  className?: string;
  /** Enable click-to-copy on the value */
  copyValue?: string;
  /** Color mode: auto (green/red), positive (always green), negative (always red), neutral */
  colorMode?: "auto" | "positive" | "negative" | "neutral";
  /** Aria-label for accessibility */
  ariaLabel?: string;
  /** Label shown when hovering (tooltip hint) */
  hoverHint?: string;
}

const PerformanceBarBase = ({
  value,
  baseline,
  ceiling,
  floor: floorProp,
  fillPercent: fillPercentProp,
  showValue = true,
  compact = false,
  className,
  copyValue,
  colorMode = "auto",
  ariaLabel,
  hoverHint,
}: PerformanceBarProps) => {
  const [copied, setCopied] = useState(false);

  // Compute fill percent
  let computedFillPercent: number;

  if (fillPercentProp !== undefined) {
    computedFillPercent = Math.min(Math.max(fillPercentProp, 0), 100);
  } else if (ceiling !== undefined) {
    const floor = floorProp ?? 0;
    const range = ceiling - floor;
    if (range <= 0) {
      computedFillPercent = 50;
    } else {
      computedFillPercent = Math.min(Math.max(((value - floor) / range) * 100, 0), 100);
    }
  } else {
    // No ceiling: compare to baseline, fill shows distance from baseline
    const diff = value - baseline;
    const sign = diff >= 0 ? 1 : -1;
    const normalized = Math.min(Math.abs(diff) / Math.max(Math.abs(baseline), 0.01), 1) * 100;
    computedFillPercent = 50 + sign * Math.min(normalized, 50);
  }

  // Determine fill color class
  const getColorClass = () => {
    const diff = value - baseline;
    const isPositive = colorMode === "positive" || (colorMode === "auto" && diff > 0);
    const isNegative = colorMode === "negative" || (colorMode === "auto" && diff < 0);

    if (colorMode === "neutral" || diff === 0) return "bg-muted-foreground/40";
    if (isPositive && !isNegative) return "bg-price-up/70";
    if (isNegative && !isPositive) return "bg-price-down/70";
    return "bg-muted-foreground/40";
  };

  const handleCopy = useCallback(async () => {
    if (!copyValue) return;
    await navigator.clipboard.writeText(copyValue);
    setCopied(true);
    const label = i18n.language === "hr" ? "Kopirano" : "Copied";
    toast.success(`${label}: ${copyValue}`);
    setTimeout(() => setCopied(false), 1500);
  }, [copyValue]);

  const barHeight = compact ? "h-1" : "h-1.5";
  const textSize = compact ? "text-[9px]" : "text-[10px]";

  // Baseline marker position
  const getBaselinePos = () => {
    if (ceiling === undefined || baseline === undefined) return null;
    const floor = floorProp ?? 0;
    const range = ceiling - floor;
    if (range <= 0) return null;
    return Math.min(Math.max(((baseline - floor) / range) * 100, 0), 100);
  };
  const baselinePos = getBaselinePos();

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      aria-label={ariaLabel}
      title={hoverHint}
    >
      {/* Bar track */}
      <div
        className={cn(
          "relative flex-1 overflow-hidden rounded-full bg-muted/50",
          barHeight,
        )}
        role="progressbar"
        aria-valuenow={Math.round(computedFillPercent)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {/* Baseline marker — visible when comparing to a reference (e.g., 52w range) */}
        {baselinePos !== null && (
          <div
            className="absolute top-0 h-full w-px bg-foreground/30"
            style={{ left: `${baselinePos}%` }}
          />
        )}

        {/* Fill bar */}
        <div
          className={cn("h-full rounded-full transition-all duration-300", getColorClass())}
          style={{
            width: ceiling !== undefined
              ? `${computedFillPercent}%`
              : `${Math.abs(computedFillPercent - 50)}%`,
            marginLeft: ceiling === undefined
              ? `${Math.min(computedFillPercent, 50)}%`
              : undefined,
          }}
        />
      </div>

      {/* Value label */}
      {showValue && (
        <span
          className={cn(
            "shrink-0 font-data tabular-nums font-medium",
            textSize,
            copied ? "text-primary" : "text-muted-foreground",
            copyValue && "cursor-pointer transition-colors hover:text-foreground",
          )}
          onClick={copyValue ? handleCopy : undefined}
          title={copyValue ? (i18n.language === "hr" ? "Klikni za kopiranje" : "Click to copy") : undefined}
        >
          {copied ? "✓" : formatPercent(value)}
        </span>
      )}
    </div>
  );
};

export const PerformanceBar = memo(PerformanceBarBase, (prev, next) => {
  return (
    prev.value === next.value &&
    prev.baseline === next.baseline &&
    prev.ceiling === next.ceiling &&
    prev.floor === next.floor &&
    prev.fillPercent === next.fillPercent &&
    prev.showValue === next.showValue &&
    prev.compact === next.compact &&
    prev.colorMode === next.colorMode &&
    prev.copyValue === next.copyValue
  );
});
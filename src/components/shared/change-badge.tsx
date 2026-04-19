import { memo } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/formatters";

interface ChangeBadgeProps {
  value: number;
  className?: string;
  showIcon?: boolean;
}

function ChangeBadgeBase({ value, className, showIcon = true }: ChangeBadgeProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;

  // Accessible label for screen readers - Croatian investors
  const ariaLabel = isPositive
    ? `Porast ${Math.abs(value).toFixed(2)}%`
    : isNegative
      ? `Pad ${Math.abs(value).toFixed(2)}%`
      : `Nema promjene`;

  return (
    <span
      role="status"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-data text-[11px] font-medium tabular-nums",
        isPositive && "bg-price-up/15 text-price-up",
        isNegative && "bg-price-down/15 text-price-down",
        !isPositive && !isNegative && "bg-muted text-muted-foreground",
        className,
      )}
    >
      {showIcon && (
        <>
          {isPositive && <TrendingUp className="h-3 w-3" />}
          {isNegative && <TrendingDown className="h-3 w-3" />}
          {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
        </>
      )}
      {formatPercent(value)}
    </span>
  );
}

export const ChangeBadge = memo(ChangeBadgeBase, (prev, next) => {
  return prev.value === next.value && prev.showIcon === next.showIcon;
});

import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/formatters";

interface PriceDisplayProps {
  value: number;
  previousValue?: number;
  className?: string;
  currency?: string;
}

export function PriceDisplay({
  value,
  className,
  currency = "EUR",
}: PriceDisplayProps) {
  return (
    <span
      className={cn(
        "font-data tabular-nums font-semibold",
        className,
      )}
    >
      {formatPrice(value)} {currency}
    </span>
  );
}

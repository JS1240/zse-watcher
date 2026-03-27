import { cn } from "@/lib/utils";
import { formatPrice, formatVolume } from "@/lib/formatters";
import { ChangeBadge } from "@/components/shared/change-badge";
import { WatchlistToggle } from "@/features/watchlist/components/watchlist-toggle";
import { useSelectedStock } from "@/hooks/use-selected-stock";
import type { Stock } from "@/types/stock";

type FlashDirection = "up" | "down" | null;

interface StockRowProps {
  stock: Stock;
  flash?: FlashDirection;
}

export function StockRow({ stock, flash }: StockRowProps) {
  const { selectedTicker, select } = useSelectedStock();
  const isSelected = selectedTicker === stock.ticker;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(stock.ticker);
    }
  };

  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={() => select(stock.ticker)}
      onKeyDown={handleKeyDown}
      aria-label={`${stock.ticker} — ${stock.name}: ${stock.price} EUR, ${stock.changePct > 0 ? "+" : ""}${stock.changePct}%`}
      className={cn(
        "group cursor-pointer border-b border-border/50 transition-colors hover:bg-accent/50",
        "last:border-b-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "border-l-2 border-l-primary bg-accent/30",
        flash === "up" && "price-flash-up",
        flash === "down" && "price-flash-down",
      )}
    >
      {/* Star + Ticker */}
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <WatchlistToggle ticker={stock.ticker} />
          <span className="font-data text-xs font-semibold text-foreground">
            {stock.ticker}
          </span>
        </div>
      </td>

      {/* Name */}
      <td className="hidden px-3 py-2 md:table-cell">
        <span className="truncate text-xs text-muted-foreground">{stock.name}</span>
      </td>

      {/* Price */}
      <td className="px-3 py-2 text-right">
        <span className="font-data text-xs tabular-nums font-medium text-foreground">
          {formatPrice(stock.price)}
        </span>
      </td>

      {/* Change */}
      <td className="px-3 py-2 text-right">
        <ChangeBadge value={stock.changePct} showIcon={false} />
      </td>

      {/* Volume */}
      <td className="hidden px-3 py-2 text-right lg:table-cell">
        <span className="font-data text-xs tabular-nums text-muted-foreground">
          {formatVolume(stock.volume)}
        </span>
      </td>

      {/* Turnover */}
      <td className="hidden px-3 py-2 text-right lg:table-cell">
        <span className="font-data text-xs tabular-nums text-muted-foreground">
          {formatVolume(stock.turnover)} EUR
        </span>
      </td>
    </tr>
  );
}

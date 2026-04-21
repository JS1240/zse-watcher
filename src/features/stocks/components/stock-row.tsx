import { memo, useState, useCallback, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { formatPrice, formatVolume } from "@/lib/formatters";
import { ChangeBadge } from "@/components/shared/change-badge";
import { WatchlistToggle } from "@/features/watchlist/components/watchlist-toggle";
import { Highlight } from "@/components/shared/highlight";
import { useSelectedStock } from "@/hooks/use-selected-stock";
import { useAuth } from "@/hooks/use-auth";
import { useAddToWatchlist, useRemoveFromWatchlist, useWatchlistTickers } from "@/features/watchlist/api/watchlist-queries";
import { useLocalWatchlist } from "@/features/watchlist/hooks/use-local-watchlist";
import { toast } from "sonner";
import type { Stock } from "@/types/stock";

type FlashDirection = "up" | "down" | null;

/**
 * Keyboard navigation helpers — exposed for parent StockTable coordination.
 * These attributes let StockTable query sibling rows for arrow-key navigation.
 */
export const ROW_FOCUS_ATTR = "data-row-index" as const;
export const ROW_TICKER_ATTR = "data-row-ticker" as const;

interface StockRowProps {
  stock: Stock;
  flash?: FlashDirection;
  /** Search query to highlight matching text */
  searchQuery?: string;
  /** Row index for keyboard arrow navigation (0-based) */
  rowIndex?: number;
  /** Callback when this row receives keyboard focus */
  onFocus?: (ticker: string) => void;
}

// Click-to-copy state for tickers and prices
const StockRowBase = ({ stock, flash, searchQuery, rowIndex, onFocus }: StockRowProps) => {
  const { t } = useTranslation("stocks");
  const { selectedTicker, select } = useSelectedStock();
  const { isAuthenticated } = useAuth();
  const watchlistTickers = useWatchlistTickers();
  const { items: localItems, addItem, removeItem } = useLocalWatchlist();
  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();
  const isSelected = selectedTicker === stock.ticker;
  const isWatched = isAuthenticated
    ? watchlistTickers.has(stock.ticker)
    : localItems.some((item) => item.ticker === stock.ticker);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Keyboard navigation — ref for programmatic focus
  const rowRef = useRef<HTMLTableRowElement>(null);

  // When this stock becomes the selected stock and a table is active,
  // move keyboard focus to this row so arrow keys work from current position
  useEffect(() => {
    if (isSelected && rowRef.current && document.activeElement?.closest("table")) {
      rowRef.current.focus();
    }
  }, [isSelected]);

  const handleCopyTicker = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(stock.ticker);
    toast.success(t("toast.copied", { ticker: stock.ticker }));
    setCopiedField("ticker");
    setTimeout(() => setCopiedField(null), 1200);
  }, [stock.ticker, t]);

  const handleCopyPrice = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(stock.price.toFixed(2));
    toast.success(t("toast.priceCopied", { price: formatPrice(stock.price) }));
    setCopiedField("price");
    setTimeout(() => setCopiedField(null), 1200);
  }, [stock.price, t]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(stock.ticker);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const table = rowRef.current?.closest("table");
      const rows = Array.from(table?.querySelectorAll<HTMLTableRowElement>(`[${ROW_FOCUS_ATTR}]`) ?? []);
      const nextIdx = (rowIndex ?? 0) + 1;
      if (rows[nextIdx]) {
        rows[nextIdx].focus();
        onFocus?.(rows[nextIdx].getAttribute(ROW_TICKER_ATTR) ?? "");
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const table = rowRef.current?.closest("table");
      const rows = Array.from(table?.querySelectorAll<HTMLTableRowElement>(`[${ROW_FOCUS_ATTR}]`) ?? []);
      const prevIdx = (rowIndex ?? 0) - 1;
      if (rows[prevIdx]) {
        rows[prevIdx].focus();
        onFocus?.(rows[prevIdx].getAttribute(ROW_TICKER_ATTR) ?? "");
      }
    } else if (e.key === "s" || e.key === "S") {
      e.preventDefault();
      if (isAuthenticated) {
        if (isWatched) {
          removeMutation.mutate(stock.ticker);
          toast.success(t("toast.removedFromWatchlist"));
        } else {
          addMutation.mutate(stock.ticker);
          toast.success(t("toast.addedToWatchlist"));
        }
      } else {
        if (isWatched) {
          removeItem(stock.ticker);
          toast.success(t("toast.removedFromWatchlist"));
        } else {
          addItem(stock.ticker);
          toast.success(t("toast.addedToWatchlist"));
        }
      }
    } else if (e.key === "c" || e.key === "C") {
      e.preventDefault();
      navigator.clipboard.writeText(stock.ticker);
      toast.success(t("toast.copied", { ticker: stock.ticker }));
    }
  };

  const handleRowFocus = () => onFocus?.(stock.ticker);

  return (
    <tr
      ref={rowRef}
      role="button"
      tabIndex={0}
      onClick={() => select(stock.ticker)}
      onKeyDown={handleKeyDown}
      onFocus={handleRowFocus}
      aria-label={`${stock.ticker} — ${stock.name}: ${stock.price} EUR, ${stock.changePct > 0 ? "+" : ""}${stock.changePct}%. Enter selects, S toggles watchlist, C copies ticker, Arrow keys navigate`}
      className={cn(
        "group cursor-pointer border-b border-border/50 transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/70 hover:shadow-md hover:relative",
        "last:border-b-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        "focus-visible:border-primary focus-visible:border-l-2 focus-visible:bg-primary/5",
        isSelected && "border-l-2 border-l-primary bg-primary/10",
        flash === "up" && "price-flash-up",
        flash === "down" && "price-flash-down",
      )}
      {...(rowIndex !== undefined ? { [ROW_FOCUS_ATTR]: rowIndex } : {})}
      {...{ [ROW_TICKER_ATTR]: stock.ticker }}
    >
      {/* Star + Ticker */}
      <td className="sticky left-0 z-[1] bg-card shadow-[2px_0_4px_hsl(var(--border))] px-3 py-2">
        <div className="flex items-center gap-1">
          <WatchlistToggle ticker={stock.ticker} />
          <button
            type="button"
            onClick={handleCopyTicker}
            onKeyDown={(e) => e.key === "Enter" && handleCopyTicker(e as unknown as React.MouseEvent)}
            className={cn(
              "font-data text-xs font-semibold text-foreground",
              "cursor-pointer transition-colors hover:text-primary",
              copiedField === "ticker" && "text-primary",
            )}
            title="Click to copy ticker"
          >
            <Highlight text={stock.ticker} highlight={searchQuery ?? ""} />
          </button>
        </div>
      </td>

      {/* Name */}
      <td className="hidden px-3 py-2 md:table-cell">
        <span className="truncate text-xs text-muted-foreground">
          <Highlight text={stock.name} highlight={searchQuery ?? ""} />
        </span>
      </td>

      {/* Price */}
      <td className="px-3 py-2 text-right">
        <button
          type="button"
          onClick={handleCopyPrice}
          className={cn(
            "font-data cursor-pointer text-xs tabular-nums font-medium",
            "transition-colors hover:text-primary",
            copiedField === "price" && "text-primary",
          )}
          title="Click to copy price"
        >
          {formatPrice(stock.price)}
        </button>
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
};

export const StockRow = memo(StockRowBase, (prev, next) => {
  // Re-render only if stock data, flash state, selection, or navigation index changed
  return (
    prev.stock.ticker === next.stock.ticker &&
    prev.stock.price === next.stock.price &&
    prev.stock.changePct === next.stock.changePct &&
    prev.stock.name === next.stock.name &&
    prev.flash === next.flash &&
    prev.rowIndex === next.rowIndex
  );
});
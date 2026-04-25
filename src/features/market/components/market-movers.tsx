import { useTranslation } from "react-i18next";
import { memo, useCallback, useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Clock, Star, Keyboard, Download, CheckCircle2 } from "lucide-react";
import { useMovers } from "@/features/market/api/market-queries";
import { useSelectedStock } from "@/hooks/use-selected-stock";
import { useAuth } from "@/hooks/use-auth";
import { useWatchlistTickers, useAddToWatchlist, useRemoveFromWatchlist } from "@/features/watchlist/api/watchlist-queries";
import { useLocalWatchlist } from "@/features/watchlist/hooks/use-local-watchlist";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { ChangeBadge } from "@/components/shared/change-badge";
import { ErrorState } from "@/components/shared/error-state";
import { formatPrice } from "@/lib/formatters";
import { exportToCsv } from "@/lib/export";
import type { Mover } from "@/types/market";
import { MoversSkeleton } from "./movers-skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function formatLastUpdated(timestamp: number | undefined): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" });
}

export function MarketMovers() {
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useMovers();
  const { t } = useTranslation("stocks");
  const { t: tc } = useTranslation("common");

  const handleExportCsv = useCallback(() => {
    if (!data) return;
    const headers = ["Ticker", "Name", "Price", "Change (%)"];
    const gainerRows = data.gainers.map((m) => [m.ticker, m.name, m.price.toFixed(2), m.changePct.toFixed(2)]);
    const loserRows = data.losers.map((m) => [m.ticker, m.name, m.price.toFixed(2), m.changePct.toFixed(2)]);
    const rows = [
      ...gainerRows.map((r) => ["Gainers", ...r]),
      ...loserRows.map((r) => ["Losers", ...r]),
    ];
    exportToCsv(`zse-movers-${new Date().toISOString().split("T")[0]}`, headers, rows);
    toast.success(tc("toast.exported") || "Podaci izvezeni u CSV", { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
  }, [data, tc]);

  if (isError) {
    return (
      <ErrorState
        title={tc("errors.generic")}
        description={tc("errors.network")}
        retry={{ onRetry: refetch, label: tc("errors.tryAgain") }}
      />
    );
  }

  if (isLoading || !data) {
    return <MoversSkeleton />;
  }

  return (
    <div className="space-y-2">
      {/* Last updated timestamp */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>Zadnje ažurirano {formatLastUpdated(dataUpdatedAt)}</span>
      </div>

      <h3 className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <TrendingUp className="h-3.5 w-3.5 text-price-up" />
        {t("movers.gainers")}
      </h3>
      <div className="space-y-0.5">
        {data.gainers.map((m) => (
          <MoverRow key={m.ticker} mover={m} />
        ))}
      </div>

      <h3 className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <TrendingDown className="h-3.5 w-3.5 text-price-down" />
        {t("movers.losers")}
      </h3>
      <div className="space-y-0.5">
        {data.losers.map((m) => (
          <MoverRow key={m.ticker} mover={m} />
        ))}
      </div>

      {/* CSV Export button — consistent with news feed and screener */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleExportCsv}
          className="flex items-center gap-1 rounded-sm px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          title={tc("toast.exportCsv") || "Izvoz u CSV"}
        >
          <Download className="h-3 w-3" />
          CSV
        </button>
      </div>

      {/* Always-visible keyboard shortcuts hint for discoverability */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm border border-border/50 bg-muted/30 px-3 py-1.5 text-[9px] text-muted-foreground">
        <Keyboard className="h-2.5 w-2.5" />
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">↑↓</kbd>
          <span>{t("shortcut.navigate") || "navigiraj"}</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Enter</kbd>
          <span>{t("shortcut.details") || "detalji"}</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">S</kbd>
          <span>{t("shortcut.watch") || "prati"}</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">C</kbd>
          <span>{t("shortcut.copy") || "kopiraj"}</span>
        </span>
      </div>
    </div>
  );
}

const MoverRow = memo(function MoverRow({ mover }: { mover: Mover }) {
  const select = useSelectedStock((state) => state.select);
  const { isAuthenticated } = useAuth();
  const watchlistTickers = useWatchlistTickers();
  const { items: localItems, addItem, removeItem } = useLocalWatchlist();
  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();
  const { t } = useTranslation("watchlist");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Get live price for flash detection
  const { data: stocksResult } = useStocksLive();
  const stocks = useMemo(() => stocksResult?.stocks ?? [], [stocksResult]);
  const livePrice = useMemo(() => {
    const stock = stocks.find((s) => s.ticker === mover.ticker);
    return stock?.price ?? null;
  }, [stocks, mover.ticker]);

  // Determine flash direction based on live price vs mover price
  const flashDirection = useMemo(() => {
    if (!livePrice || livePrice === mover.price) return null;
    return livePrice > mover.price ? "up" : "down";
  }, [livePrice, mover.price]);

  const isWatched = isAuthenticated
    ? watchlistTickers.has(mover.ticker)
    : localItems.some((item) => item.ticker === mover.ticker);

  const handleClick = () => {
    select(mover.ticker);
  };

  const handleCopyTicker = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(mover.ticker);
    toast.success(t("toast.copied", { ticker: mover.ticker }));
    setCopiedField("ticker");
    setTimeout(() => setCopiedField(null), 1200);
  }, [mover.ticker, t]);

  const handleCopyPrice = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(mover.price.toFixed(2));
    toast.success(t("toast.priceCopied", { price: formatPrice(mover.price) }));
    setCopiedField("price");
    setTimeout(() => setCopiedField(null), 1200);
  }, [mover.price, t]);

  const handleWatchlistToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAuthenticated) {
      if (isWatched) {
        removeMutation.mutate(mover.ticker);
        toast.success(t("toast.removed"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
      } else {
        addMutation.mutate(mover.ticker);
        toast.success(t("toast.added"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
      }
    } else {
      if (isWatched) {
        removeItem(mover.ticker);
        toast.success(t("toast.removed"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
      } else {
        addItem(mover.ticker);
        toast.success(t("toast.added"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
      }
    }
  }, [isAuthenticated, isWatched, mover.ticker, addMutation, removeMutation, addItem, removeItem, t]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary",
        flashDirection === "up" && "price-flash-up",
        flashDirection === "down" && "price-flash-down",
      )}
    >
      <div className="flex flex-1 items-center gap-2">
        <button
          type="button"
          onClick={handleWatchlistToggle}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title={isWatched ? t("remove") : t("add")}
          aria-label={isWatched ? `${mover.ticker} remove from watchlist` : `${mover.ticker} add to watchlist`}
        >
          <Star className={`h-3.5 w-3.5 ${isWatched ? "fill-amber text-amber" : ""}`} />
        </button>
        <div className="flex flex-col">
          <button
            type="button"
            onClick={handleCopyTicker}
            className={cn(
              "font-data text-[11px] font-semibold text-foreground",
              "cursor-pointer transition-colors hover:text-primary",
              copiedField === "ticker" && "text-primary",
            )}
            title="Click to copy ticker"
          >
            {mover.ticker}
          </button>
          <span className="max-w-[100px] truncate text-[10px] text-muted-foreground">
            {mover.name}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <button
          type="button"
          onClick={handleCopyPrice}
          className={cn(
            "font-data text-[11px] tabular-nums text-foreground",
            "cursor-pointer transition-colors hover:text-primary",
            copiedField === "price" && "text-primary",
          )}
          title="Click to copy price"
        >
          {formatPrice(mover.price)}
        </button>
        <ChangeBadge value={mover.changePct} showIcon={false} className="text-[10px]" />
      </div>
    </button>
  );
});

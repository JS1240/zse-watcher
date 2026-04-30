import { useTranslation } from "react-i18next";
import { memo, useCallback, useState, useMemo } from "react";
import { TrendingUp, TrendingDown, Star, Download, CheckCircle2, ArrowUp, ArrowDown, ArrowUpDown, ListPlus, Keyboard } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { StockListEmptyIllustration } from "@/components/shared/empty-illustrations";
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
import { LiveDataIndicator } from "@/components/shared/live-data-indicator";
import type { Mover } from "@/types/market";
import { MoversSkeleton } from "./movers-skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SortColumn = "changePct" | "price" | "ticker";
type SortDirection = "asc" | "desc";

function SortHeader({
  column,
  label,
  activeColumn,
  direction,
  onSort,
}: {
  column: SortColumn;
  label: string;
  activeColumn: SortColumn;
  direction: SortDirection;
  onSort: (col: SortColumn) => void;
}) {
  const isActive = activeColumn === column;
  const sortIcon = isActive
    ? direction === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;
  const Icon = sortIcon;

  return (
    <button
      onClick={() => onSort(column)}
      className={cn(
        "flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        isActive ? "text-foreground" : "text-muted-foreground"
      )}
      title={`Sortiraj po ${label.toLowerCase()}`}
    >
      <Icon className="h-2.5 w-2.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function MarketMovers() {
  const { data, isLoading, isError, refetch, dataUpdatedAt, isFetching } = useMovers();
  const { t } = useTranslation("stocks");
  const { t: tc } = useTranslation("common");
  const { isAuthenticated } = useAuth();
  const addMutation = useAddToWatchlist();
  const { items: localItems, addItem } = useLocalWatchlist();

  // Sort state for gainers and losers
  const [gainersSort, setGainersSort] = useState<{ column: SortColumn; direction: SortDirection }>({
    column: "changePct",
    direction: "desc",
  });
  const [losersSort, setLosersSort] = useState<{ column: SortColumn; direction: SortDirection }>({
    column: "changePct",
    direction: "asc",
  });

  // Check if ticker is already watched
  const isWatched = useCallback((ticker: string) => {
    return isAuthenticated ? false : localItems.some((item) => item.ticker === ticker);
  }, [isAuthenticated, localItems]);

  // Bulk add all gainers to watchlist
  const handleBulkAddGainers = useCallback(() => {
    if (!data) return;
    const newTickers = data.gainers.filter(m => !isWatched(m.ticker)).map(m => m.ticker);
    if (isAuthenticated) {
      newTickers.forEach(ticker => addMutation.mutate(ticker));
    } else {
      newTickers.forEach(ticker => addItem(ticker));
    }
    toast.success(tc("toast.bulkAdded", { count: newTickers.length, type: t("movers.gainers") }), { 
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 
    });
  }, [data, isAuthenticated, isWatched, addMutation, addItem, tc, t]);

  // Bulk add all losers to watchlist
  const handleBulkAddLosers = useCallback(() => {
    if (!data) return;
    const newTickers = data.losers.filter(m => !isWatched(m.ticker)).map(m => m.ticker);
    if (isAuthenticated) {
      newTickers.forEach(ticker => addMutation.mutate(ticker));
    } else {
      newTickers.forEach(ticker => addItem(ticker));
    }
    toast.success(tc("toast.bulkAdded", { count: newTickers.length, type: t("movers.losers") }), { 
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 
    });
  }, [data, isAuthenticated, isWatched, addMutation, addItem, tc, t]);

  // Sort movers by selected column
  const sortedGainers = useMemo(() => {
    if (!data) return [];
    return [...data.gainers].sort((a, b) => {
      const aVal = a[gainersSort.column];
      const bVal = b[gainersSort.column];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return gainersSort.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return gainersSort.direction === "asc"
        ? ((aVal as number) || 0) - ((bVal as number) || 0)
        : ((bVal as number) || 0) - ((aVal as number) || 0);
    });
  }, [data, gainersSort]);

  const sortedLosers = useMemo(() => {
    if (!data) return [];
    return [...data.losers].sort((a, b) => {
      const aVal = a[losersSort.column];
      const bVal = b[losersSort.column];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return losersSort.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return losersSort.direction === "asc"
        ? ((aVal as number) || 0) - ((bVal as number) || 0)
        : ((bVal as number) || 0) - ((aVal as number) || 0);
    });
  }, [data, losersSort]);

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
      <div className="flex items-center justify-between gap-1">
        <LiveDataIndicator
          updatedAt={dataUpdatedAt ?? 0}
          isFetching={isFetching}
        />
        <button
          type="button"
          onClick={handleExportCsv}
          className="flex items-center gap-1 rounded-sm px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
          title={tc("toast.exportCsv") || "Izvoz u CSV"}
        >
          <Download className="h-3 w-3" />
          CSV
        </button>
      </div>

      {/* Gainers section */}
      <h3 className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <TrendingUp className="h-3.5 w-3.5 text-price-up" />
        {t("movers.gainers")}
        {/* Sort controls + bulk add for gainers */}
        <div className="ml-auto flex items-center gap-1">
          <SortHeader
            column="ticker"
            label="Ticker"
            activeColumn={gainersSort.column}
            direction={gainersSort.direction}
            onSort={(col) => setGainersSort((prev) => ({
              column: col,
              direction: prev.column === col && prev.direction === "desc" ? "asc" : "desc",
            }))}
          />
          <SortHeader
            column="price"
            label="Cijena"
            activeColumn={gainersSort.column}
            direction={gainersSort.direction}
            onSort={(col) => setGainersSort((prev) => ({
              column: col,
              direction: prev.column === col && prev.direction === "desc" ? "asc" : "desc",
            }))}
          />
          <SortHeader
            column="changePct"
            label="Promjena"
            activeColumn={gainersSort.column}
            direction={gainersSort.direction}
            onSort={(col) => setGainersSort((prev) => ({
              column: col,
              direction: prev.column === col && prev.direction === "desc" ? "asc" : "desc",
            }))}
          />
          {sortedGainers.length > 0 && (
            <button
              type="button"
              onClick={handleBulkAddGainers}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] text-amber transition-colors hover:bg-amber/10"
              title={tc("toast.bulkAddAll") || "Add all gainers to watchlist"}
            >
              <ListPlus className="h-2.5 w-2.5" />
              <span className="hidden sm:inline">{tc("toast.addAll") || "Svi"}</span>
            </button>
          )}
        </div>
      </h3>
      {sortedGainers.length === 0 ? (
        <EmptyState
          icon={<StockListEmptyIllustration className="h-8 w-8" />}
          title={t("movers.noGainers") || "Nema dobitnika"}
          description={t("movers.noGainersDesc") || "Danas nema dionica s pozitivnom promjenom"}
          className="py-4"
          shortcut="/"
          variant="info"
        />
      ) : (
        <div className="space-y-0.5">
          {sortedGainers.map((m) => (
            <MoverRow key={m.ticker} mover={m} />
          ))}
        </div>
      )}

      {/* Losers section */}
      <h3 className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <TrendingDown className="h-3.5 w-3.5 text-price-down" />
        {t("movers.losers")}
        {/* Sort controls + bulk add for losers */}
        <div className="ml-auto flex items-center gap-1">
          <SortHeader
            column="ticker"
            label="Ticker"
            activeColumn={losersSort.column}
            direction={losersSort.direction}
            onSort={(col) => setLosersSort((prev) => ({
              column: col,
              direction: prev.column === col && prev.direction === "desc" ? "asc" : "desc",
            }))}
          />
          <SortHeader
            column="price"
            label="Cijena"
            activeColumn={losersSort.column}
            direction={losersSort.direction}
            onSort={(col) => setLosersSort((prev) => ({
              column: col,
              direction: prev.column === col && prev.direction === "desc" ? "asc" : "desc",
            }))}
          />
          <SortHeader
            column="changePct"
            label="Promjena"
            activeColumn={losersSort.column}
            direction={losersSort.direction}
            onSort={(col) => setLosersSort((prev) => ({
              column: col,
              direction: prev.column === col && prev.direction === "desc" ? "asc" : "desc",
            }))}
          />
          {sortedLosers.length > 0 && (
            <button
              type="button"
              onClick={handleBulkAddLosers}
              className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] text-amber transition-colors hover:bg-amber/10"
              title={tc("toast.bulkAddAll") || "Add all losers to watchlist"}
            >
              <ListPlus className="h-2.5 w-2.5" />
              <span className="hidden sm:inline">{tc("toast.addAll") || "Svi"}</span>
            </button>
          )}
        </div>
      </h3>
      {sortedLosers.length === 0 ? (
        <EmptyState
          icon={<StockListEmptyIllustration className="h-8 w-8" />}
          title={t("movers.noLosers") || "Nema gubitnika"}
          description={t("movers.noLosersDesc") || "Danas nema dionica s negativnom promjenom"}
          className="py-4"
          shortcut="/"
          variant="info"
        />
      ) : (
        <div className="space-y-0.5">
          {sortedLosers.map((m) => (
            <MoverRow key={m.ticker} mover={m} />
          ))}
        </div>
      )}

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

  // Handle keyboard navigation - Enter/Space to open stock detail
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(mover.ticker);
    }
  }, [mover.ticker, select]);

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
      onKeyDown={handleKeyDown}
      className={cn(
        "group flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        flashDirection === "up" && "price-flash-up",
        flashDirection === "down" && "price-flash-down",
      )}
      aria-label={`${mover.ticker} ${mover.name} - ${mover.price.toFixed(2)} EUR, ${mover.changePct > 0 ? '+' : ''}${mover.changePct.toFixed(2)}%`}
    >
      <div className="flex flex-1 items-center gap-2">
        <button
          type="button"
          onClick={handleWatchlistToggle}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
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

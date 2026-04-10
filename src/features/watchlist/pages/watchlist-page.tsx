import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Star, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useLocalWatchlist } from "@/features/watchlist/hooks/use-local-watchlist";
import { useWatchlistItems } from "@/features/watchlist/api/watchlist-queries";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { useSelectedStock } from "@/hooks/use-selected-stock";
import { WatchlistToggle } from "@/features/watchlist/components/watchlist-toggle";
import { ChangeBadge } from "@/components/shared/change-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Input } from "@/components/ui/input";
import { formatPrice, formatVolume } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import type { Stock } from "@/types/stock";

export function WatchlistPage() {
  const { t } = useTranslation("watchlist");

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-4">
      <h1 className="font-data text-lg font-bold">{t("title")}</h1>
      <AuthAwareContent />
    </div>
  );
}

function AuthAwareContent() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <AuthenticatedWatchlist />;
  }

  return <LocalWatchlist />;
}

function AuthenticatedWatchlist() {
  const { t } = useTranslation("watchlist");
  const { t: tc } = useTranslation("common");
  const watchlistItems = useWatchlistItems();
  const { data: stocksResult } = useStocksLive();
  const stocks = stocksResult?.stocks ?? [];
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 200);

  const watchedStocks = useMemo(() => {
    const tickers = new Set(watchlistItems.data?.map((i) => i.ticker) ?? []);
    return stocks.filter((s) => tickers.has(s.ticker));
  }, [stocks, watchlistItems.data]);

  const filtered = useMemo(() => {
    if (!debouncedSearch) return watchedStocks;
    const q = debouncedSearch.toLowerCase();
    return watchedStocks.filter(
      (s) =>
        s.ticker.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q),
    );
  }, [watchedStocks, debouncedSearch]);

  if (watchlistItems.isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder={tc("actions.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {filtered.length > 0 ? (
        <WatchlistTable stocks={filtered} />
      ) : debouncedSearch ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title={tc("empty.noResults")}
          description={tc("empty.noResultsDescription")}
          action={{ label: tc("empty.clearFilters"), onClick: () => setSearch("") }}
        />
      ) : (
        <EmptyState
          icon={<Star className="h-8 w-8" />}
          title={t("empty")}
          description={t("emptyDescription")}
        />
      )}
    </div>
  );
}

function LocalWatchlist() {
  const { t } = useTranslation("watchlist");
  const { t: tc } = useTranslation("common");
  const { items, removeItem } = useLocalWatchlist();
  const { data: stocksResult } = useStocksLive();
  const stocks = stocksResult?.stocks ?? [];
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 200);

  const watchedStocks = useMemo(() => {
    const tickerSet = new Set(items.map((i) => i.ticker));
    return stocks.filter((s) => tickerSet.has(s.ticker));
  }, [stocks, items]);

  const filtered = useMemo(() => {
    if (!debouncedSearch) return watchedStocks;
    const q = debouncedSearch.toLowerCase();
    return watchedStocks.filter(
      (s) =>
        s.ticker.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q),
    );
  }, [watchedStocks, debouncedSearch]);

  if (stocksResult === undefined) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder={tc("actions.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {filtered.length > 0 ? (
        <WatchlistTable stocks={filtered} showRemove onRemove={removeItem} />
      ) : debouncedSearch ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title={tc("empty.noResults")}
          description={tc("empty.noResultsDescription")}
          action={{ label: tc("empty.clearFilters"), onClick: () => setSearch("") }}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Star className="h-8 w-8" />}
          title={t("empty")}
          description={t("emptyDescription")}
          action={{
            label: t("browseAction"),
            onClick: () => { window.location.href = "/"; },
          }}
        />
      ) : (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title={tc("empty.noResults")}
          description={tc("empty.noResultsDescription")}
          action={{ label: tc("empty.clearFilters"), onClick: () => setSearch("") }}
        />
      )}
    </div>
  );
}

interface WatchlistTableProps {
  stocks: Stock[];
  showRemove?: boolean;
  onRemove?: (ticker: string) => void;
}

function WatchlistTable({ stocks, showRemove, onRemove }: WatchlistTableProps) {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="px-3 py-2 text-left font-medium">Dionica</th>
            <th className="hidden px-3 py-2 text-left font-medium md:table-cell">Naziv</th>
            <th className="px-3 py-2 text-right font-medium">Cijena</th>
            <th className="px-3 py-2 text-right font-medium">Promjena</th>
            <th className="hidden px-3 py-2 text-right font-medium lg:table-cell">Volumen</th>
            <th className="hidden px-3 py-2 text-right font-medium lg:table-cell">Promet</th>
            {showRemove && <th className="w-10" />}
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => (
            <WatchlistRow
              key={stock.ticker}
              stock={stock}
              stocks={stocks}
              showRemove={showRemove}
              onRemove={onRemove}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface WatchlistRowProps extends WatchlistTableProps {
  stock: Stock;
}

function WatchlistRow({ stock, showRemove, onRemove }: WatchlistRowProps) {
  const { select, selectedTicker } = useSelectedStock();
  const isSelected = selectedTicker === stock.ticker;

  return (
    <tr
      role="button"
      tabIndex={0}
      onClick={() => select(stock.ticker)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          select(stock.ticker);
        }
      }}
      className={cn(
        "group cursor-pointer border-b border-border/50 transition-colors hover:bg-accent/50",
        "last:border-b-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "border-l-2 border-l-primary bg-accent/30",
      )}
    >
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          {showRemove ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.(stock.ticker);
              }}
              className="rounded-sm p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              title="Remove"
            >
              <Star className="h-3.5 w-3.5 fill-amber text-amber" />
            </button>
          ) : (
            <WatchlistToggle ticker={stock.ticker} />
          )}
          <span className="font-data text-xs font-semibold text-foreground">
            {stock.ticker}
          </span>
        </div>
      </td>
      <td className="hidden px-3 py-2 md:table-cell">
        <span className="truncate text-xs text-muted-foreground">{stock.name}</span>
      </td>
      <td className="px-3 py-2 text-right">
        <span className="font-data text-xs tabular-nums font-medium text-foreground">
          {formatPrice(stock.price)}
        </span>
      </td>
      <td className="px-3 py-2 text-right">
        <ChangeBadge value={stock.changePct} showIcon={false} />
      </td>
      <td className="hidden px-3 py-2 text-right lg:table-cell">
        <span className="font-data text-xs tabular-nums text-muted-foreground">
          {formatVolume(stock.volume)}
        </span>
      </td>
      <td className="hidden px-3 py-2 text-right lg:table-cell">
        <span className="font-data text-xs tabular-nums text-muted-foreground">
          {formatVolume(stock.turnover)} EUR
        </span>
      </td>
      {showRemove && <td />}
    </tr>
  );
}

import { useMemo, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Download, Wallet, ChevronUp, ChevronDown, Search, X, Keyboard, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import { usePriceFlash } from "@/hooks/use-price-flash";
import { toast } from "sonner";
import { usePortfolio } from "@/features/portfolio/api/portfolio-queries";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { useLocalTransactions } from "@/features/portfolio/hooks/use-local-transactions";
import { AddPositionForm } from "@/features/portfolio/components/add-position-form";
import { PortfolioSkeleton } from "@/features/portfolio/components/portfolio-skeleton";
import { Button } from "@/components/ui/button";
import { ChangeBadge } from "@/components/shared/change-badge";
import { formatPrice, formatCurrency } from "@/lib/formatters";
import { exportToCsv } from "@/lib/export";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { useSelectedStock } from "@/hooks/use-selected-stock";
import type { Holding } from "@/features/portfolio/api/portfolio-queries";

interface EnrichedHolding extends Holding {
  currentPrice: number;
  totalValue: number;
  totalGain: number;
  gainPct: number;
  name: string;
}

interface PortfolioDashboardProps {
  isLocal?: boolean;
}

export function PortfolioDashboard({ isLocal = false }: PortfolioDashboardProps) {
  const { t } = useTranslation("portfolio");
  const { isLoading, data: portfolioData } = usePortfolio();
  const { data: stocksResult } = useStocksLive();
  const stocks = stocksResult?.stocks ?? null;
  const { transactions: localTxs, hasLocalTransactions } = useLocalTransactions();
  const { select } = useSelectedStock();

  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");

  // Keyboard shortcut to focus search
  const searchInputRef = useRef<HTMLInputElement>(null);
  const focusSearch = useCallback(() => searchInputRef.current?.focus(), []);
  useKeyboardShortcut({ key: "/", handler: focusSearch, enabled: true });

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [gainFilter, setGainFilter] = useState<"all" | "gainers" | "losers" | "unchanged">("all");
  const debouncedSearch = useDebounce(search, 200);

  const holdings = useMemo(() => {
    return computeHoldings(portfolioData?.transactions ?? [], localTxs);
  }, [portfolioData?.transactions, localTxs]);

  // Memoize enriched holdings — only recalculates when holdings or stocks change
  const enrichedHoldings = useMemo(
    () => computeEnrichedHoldings(holdings, stocks),
    [holdings, stocks],
  );

  // Filter by search term
  const filteredHoldings = useMemo(() => {
    if (!debouncedSearch) return enrichedHoldings;
    const q = debouncedSearch.toLowerCase();
    return enrichedHoldings.filter(
      (h) =>
        h.ticker.toLowerCase().includes(q) ||
        h.name.toLowerCase().includes(q)
    );
  }, [enrichedHoldings, debouncedSearch]);

  // Filter by gain/loss
  const filteredByGain = useMemo(() => {
    if (gainFilter === "all") return filteredHoldings;
    return filteredHoldings.filter((h) => {
      if (gainFilter === "gainers") return h.gainPct > 0;
      if (gainFilter === "losers") return h.gainPct < 0;
      if (gainFilter === "unchanged") return h.gainPct === 0;
      return true;
    });
  }, [filteredHoldings, gainFilter]);

  const sortedHoldings = useMemo(() => {
    if (!sortField) return filteredByGain;
    return [...filteredByGain].sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      switch (sortField) {
        case "ticker":
          aVal = a.ticker.toLowerCase();
          bVal = b.ticker.toLowerCase();
          break;
        case "shares":
          aVal = a.totalShares;
          bVal = b.totalShares;
          break;
        case "avgPrice":
          aVal = a.avgPrice;
          bVal = b.avgPrice;
          break;
        case "currentPrice":
          aVal = a.currentPrice;
          bVal = b.currentPrice;
          break;
        case "value":
          aVal = a.totalValue;
          bVal = b.totalValue;
          break;
        case "gainPct":
          aVal = a.gainPct;
          bVal = b.gainPct;
          break;
        default:
          return 0;
      }
      if (typeof aVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal as string) : (bVal as string).localeCompare(aVal);
      }
      return sortDir === "asc" ? aVal - (bVal as number) : (bVal as number) - aVal;
    });
  }, [filteredHoldings, sortField, sortDir]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  // Memoize portfolio totals — recalculates only when holdings change
  const totals = useMemo(() => {
    const totalValue = sortedHoldings.reduce((sum, h) => sum + h.totalValue, 0);
    const totalGain = sortedHoldings.reduce((sum, h) => sum + h.totalGain, 0);
    const gainPct = totalValue > 0 ? (totalGain / (totalValue - totalGain)) * 100 : 0;
    return { totalValue, totalGain, gainPct };
  }, [sortedHoldings]);

  const { totalValue: totalPortfolioValue, totalGain: totalPortfolioGain, gainPct: totalGainPct } = totals;

  // Flash map for price change animations
  const flashMap = usePriceFlash(stocks);

  const handleExportCsv = () => {
    const headers = [
      "Ticker",
      "Name",
      "Shares",
      "Avg Price (EUR)",
      "Current Price (EUR)",
      "Value (EUR)",
      "Gain (EUR)",
      "Gain (%)",
    ];
    const rows = enrichedHoldings.map((h) => [
      h.ticker,
      h.name,
      h.totalShares.toString(),
      h.avgPrice.toFixed(2),
      h.currentPrice.toFixed(2),
      h.totalValue.toFixed(2),
      h.totalGain.toFixed(2),
      h.gainPct.toFixed(2),
    ]);
    exportToCsv(`zse-portfolio-${new Date().toISOString().split("T")[0]}`, headers, rows);
    toast.success(t("toast.exported"));
  };

  if (isLoading) {
    return <PortfolioSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Local indicator */}
      {(isLocal || hasLocalTransactions) && (
        <div className="flex items-center gap-2 rounded-sm bg-muted/50 px-2 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-muted-foreground">
            {isLocal
              ? "Portfolio saved locally — sign in to sync across devices"
              : "Portfolio synced with your account"}
          </span>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="rounded-md border border-border bg-card p-3">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("totalValue")}
          </span>
          <div className="mt-1 font-data text-lg font-bold tabular-nums text-foreground">
            {formatCurrency(totalPortfolioValue)}
          </div>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("totalGain")}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={cn(
                "font-data text-lg font-bold tabular-nums",
                totalPortfolioGain >= 0 ? "text-price-up" : "text-price-down",
              )}
            >
              {formatCurrency(totalPortfolioGain)}
            </span>
            <ChangeBadge value={totalGainPct} showIcon={false} />
          </div>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("holdings")}
          </span>
          <div className="mt-1 font-data text-lg font-bold tabular-nums text-foreground">
            {enrichedHoldings.length}
          </div>
        </div>
      </div>

      {/* Search + Action buttons */}
      <div className="flex gap-2">
        {/* Search input - only show when there are holdings */}
        {enrichedHoldings.length > 0 && (
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder={t("searchPlaceholder") || "Search ticker or name..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-14"
            />
            {!search && enrichedHoldings.length > 0 && (
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                <Keyboard className="h-2.5 w-2.5" />
                /
              </span>
            )}
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCsv}
            disabled={sortedHoldings.length === 0}
          >
            <Download className="h-3.5 w-3.5" />
            {t("exportCsv")}
          </Button>
          <Button size="sm" id="add-position-btn" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-3.5 w-3.5" />
            {t("addPosition")}
          </Button>
        </div>
      </div>

      {/* Filter chips */}
      {enrichedHoldings.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <FilterChip
            active={gainFilter === "all"}
            onClick={() => setGainFilter("all")}
            label={t("filters.all") || "Sve"}
            count={enrichedHoldings.length}
          />
          <FilterChip
            active={gainFilter === "gainers"}
            onClick={() => setGainFilter("gainers")}
            label={t("filters.gainers") || "Dobitnici"}
            icon={<TrendingUp className="h-3 w-3" />}
            count={enrichedHoldings.filter((h) => h.gainPct > 0).length}
          />
          <FilterChip
            active={gainFilter === "losers"}
            onClick={() => setGainFilter("losers")}
            label={t("filters.losers") || "Gubitnici"}
            icon={<TrendingDown className="h-3 w-3" />}
            count={enrichedHoldings.filter((h) => h.gainPct < 0).length}
          />
          <FilterChip
            active={gainFilter === "unchanged"}
            onClick={() => setGainFilter("unchanged")}
            label={t("filters.unchanged") || "Nepromijenjeno"}
            icon={<Minus className="h-3 w-3" />}
            count={enrichedHoldings.filter((h) => h.gainPct === 0).length}
          />
        </div>
      )}

      {/* Results count */}
      {enrichedHoldings.length > 0 && (
        <div className="text-[10px] text-muted-foreground">
          {sortedHoldings.length} / {enrichedHoldings.length} {sortedHoldings.length === 1 ? "position" : "positions"}
        </div>
      )}

      {/* Add position form */}
      {showAddForm && (
        <AddPositionForm
          onClose={() => setShowAddForm(false)}
          onSuccess={() => toast.success(t("toast.transactionAdded"))}
        />
      )}

      {/* Holdings table - horizontal scroll on mobile */}
      {sortedHoldings.length > 0 ? (
        <div className="overflow-x-auto rounded-md border border-border [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable]">
          <table className="min-w-[400px] w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                <SortableTh field="ticker" label={t("fields.ticker")} sortField={sortField} sortDir={sortDir} onSort={handleSort} align="left" />
                <SortableTh field="shares" label={t("fields.shares")} sortField={sortField} sortDir={sortDir} onSort={handleSort} align="right" />
                <SortableTh field="avgPrice" label={t("fields.avgPrice")} sortField={sortField} sortDir={sortDir} onSort={handleSort} align="right" />
                <SortableTh field="currentPrice" label={t("fields.currentPrice")} sortField={sortField} sortDir={sortDir} onSort={handleSort} align="right" />
                <SortableTh field="value" label={t("fields.value")} sortField={sortField} sortDir={sortDir} onSort={handleSort} align="right" className="hidden md:table-cell" />
                <SortableTh field="gainPct" label={t("fields.gain")} sortField={sortField} sortDir={sortDir} onSort={handleSort} align="right" />
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((h) => {
                const flash = flashMap.get(h.ticker) ?? null;
                return (
                  <tr
                    key={h.ticker}
                    className={cn(
                      "border-b border-border/50 cursor-pointer transition-all duration-150 hover:bg-accent/70",
                      flash === "up" && "price-flash-up",
                      flash === "down" && "price-flash-down",
                    )}
                    onClick={() => select(h.ticker)}
                  >
                    <td className="px-3 py-3 md:py-2">
                      <div>
                        <span className="font-data font-semibold text-foreground">{h.ticker}</span>
                        <span className="ml-1 text-[10px] text-muted-foreground">{h.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 md:py-2 text-right font-data tabular-nums text-foreground">
                      {h.totalShares.toFixed(0)}
                    </td>
                    <td className="px-3 py-3 md:py-2 text-right font-data tabular-nums text-muted-foreground">
                      {formatPrice(h.avgPrice)}
                    </td>
                    <td className="px-3 py-3 md:py-2 text-right font-data tabular-nums text-foreground">
                      {formatPrice(h.currentPrice)}
                    </td>
                    <td className="hidden px-3 py-3 md:py-2 text-right font-data tabular-nums text-foreground md:table-cell">
                      {formatCurrency(h.totalValue)}
                    </td>
                    <td className="px-3 py-3 md:py-2 text-right">
                      <ChangeBadge value={h.gainPct} showIcon={false} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : filteredHoldings.length === 0 && search ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title={t("searchNoResults") || "No results found"}
          description={t("searchNoResultsDescription") || "No positions match your search."}
          action={{ label: t("clearSearch") || "Clear search", onClick: () => setSearch("") }}
        />
      ) : (
        <div className="rounded-md border border-border bg-card">
          <EmptyState
            icon={<Wallet className="h-8 w-8" />}
            title={t("empty")}
            description={t("emptyDescription")}
            action={{ label: t("addPosition"), onClick: () => setShowAddForm(true) }}
          />
        </div>
      )}
    </div>
  );
}

interface SortableThProps {
  field: string;
  label: string;
  sortField: string | null;
  sortDir: "asc" | "desc";
  onSort: (field: string) => void;
  align?: "left" | "right";
  className?: string;
}

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

function FilterChip({ active, onClick, label, icon, count }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      )}
    >
      {icon}
      {label}
      {typeof count === "number" && (
        <span
          className={cn(
            "ml-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
            active
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-muted-foreground/20 text-muted-foreground"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function SortableTh({ field, label, sortField, sortDir, onSort, align = "left", className }: SortableThProps) {
  const isActive = sortField === field;
  return (
    <th
      className={cn(
        "px-3 py-2 font-medium cursor-pointer select-none hover:text-foreground transition-colors",
        align === "right" ? "text-right" : "text-left",
        isActive ? "text-foreground" : "text-muted-foreground",
        className,
      )}
      onClick={() => onSort(field)}
    >
      <span className={cn("inline-flex items-center gap-0.5", align === "right" ? "flex-row-reverse" : "flex-row")}>
        {label}
        {isActive && (sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
        {!isActive && <span className="h-3 w-3 opacity-30">⇅</span>}
      </span>
    </th>
  );
}

function computeEnrichedHoldings(
  holdings: Holding[],
  stocks: Array<{ ticker: string; price: number; name: string }> | null,
): EnrichedHolding[] {
  return holdings.map((h) => {
    const stock = stocks?.find((s) => s.ticker === h.ticker);
    const currentPrice = stock?.price ?? h.avgPrice;
    const totalValue = h.totalShares * currentPrice;
    const totalGain = totalValue - h.totalCost;
    const gainPct = h.totalCost > 0 ? (totalGain / h.totalCost) * 100 : 0;

    return { ...h, currentPrice, totalValue, totalGain, gainPct, name: stock?.name ?? h.ticker };
  });
}

function computeHoldings(
  remoteTxs: Array<{
    ticker: string;
    transaction_type: string;
    shares: number;
    total_amount: number;
  }>,
  localTxs: Array<{
    ticker: string;
    transactionType: string;
    shares: number;
    totalAmount: number;
  }>,
): Holding[] {
  const allTransactions = [
    ...remoteTxs.map((tx) => ({
      ticker: tx.ticker,
      transactionType: tx.transaction_type as "buy" | "sell" | "dividend",
      shares: tx.shares,
      totalAmount: tx.total_amount,
    })),
    ...localTxs.map((tx) => ({
      ticker: tx.ticker,
      transactionType: tx.transactionType as "buy" | "sell" | "dividend",
      shares: tx.shares,
      totalAmount: tx.totalAmount,
    })),
  ];

  if (!allTransactions.length) return [];

  const holdingsMap = new Map<string, { totalShares: number; totalCost: number }>();

  for (const txn of allTransactions) {
    const current = holdingsMap.get(txn.ticker) ?? { totalShares: 0, totalCost: 0 };

    if (txn.transactionType === "buy") {
      current.totalShares += txn.shares;
      current.totalCost += txn.totalAmount;
    } else if (txn.transactionType === "sell") {
      current.totalShares -= txn.shares;
      current.totalCost -= txn.shares * (current.totalCost / (current.totalShares + txn.shares));
    }

    holdingsMap.set(txn.ticker, current);
  }

  return Array.from(holdingsMap.entries())
    .filter(([_, h]) => h.totalShares > 0)
    .map(([ticker, h]) => ({
      ticker,
      totalShares: h.totalShares,
      avgPrice: h.totalCost / h.totalShares,
      totalCost: h.totalCost,
    }));
}

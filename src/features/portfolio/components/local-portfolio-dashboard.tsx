import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, ChevronDown, ChevronUp, Wallet, Download, Search, X, ArrowUp, ArrowDown, ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import { useLocalTransactions } from "@/features/portfolio/hooks/use-local-transactions";
import { useDebounce } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { AddPositionForm } from "@/features/portfolio/components/add-position-form";
import { Button } from "@/components/ui/button";
import { ChangeBadge } from "@/components/shared/change-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatPrice, formatCurrency } from "@/lib/formatters";
import { exportToCsv } from "@/lib/export";
import { cn } from "@/lib/utils";
import { useSelectedStock } from "@/hooks/use-selected-stock";

export function LocalPortfolioDashboard() {
  const { t } = useTranslation("portfolio");
  const { transactions, hasLocalTransactions, removeTransaction, clearTransactions } =
    useLocalTransactions();
  const { data: stocksResult } = useStocksLive();
  const stocks = stocksResult?.stocks ?? null;
  const { select } = useSelectedStock();
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");
  const [changeFilter, setChangeFilter] = useState<"all" | "gainers" | "losers" | "unchanged">("all");
  const debouncedSearch = useDebounce(search, 200);
  const [showHistory, setShowHistory] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  // Memoize holdings calculation — only recalculates when transactions change (infrequent)
  // Must be before any conditional return (React hooks rule)
  const holdingsMap = useMemo(() => {
    const map = new Map<string, { totalShares: number; totalCost: number; name: string }>();

    for (const tx of transactions) {
      const stock = stocks?.find((s) => s.ticker === tx.ticker);
      const current = map.get(tx.ticker) ?? {
        totalShares: 0,
        totalCost: 0,
        name: stock?.name ?? tx.ticker,
      };

      if (tx.transactionType === "buy") {
        current.totalShares += tx.shares;
        current.totalCost += tx.totalAmount;
      } else if (tx.transactionType === "sell") {
        current.totalShares -= tx.shares;
        current.totalCost -= tx.shares * (current.totalCost / (current.totalShares + tx.shares));
      }

      map.set(tx.ticker, current);
    }

    return map;
  }, [transactions, stocks]);

  // Memoize enriched holdings — recalculates when holdingsMap changes
  const enrichedHoldings = useMemo(() => {
    return Array.from(holdingsMap.entries())
      .filter(([_, h]) => h.totalShares > 0)
      .map(([ticker, h]) => {
        const stock = stocks?.find((s) => s.ticker === ticker);
        const currentPrice = stock?.price ?? h.totalCost / h.totalShares;
        const totalValue = h.totalShares * currentPrice;
        const totalGain = totalValue - h.totalCost;
        const gainPct = h.totalCost > 0 ? (totalGain / h.totalCost) * 100 : 0;

        return {
          ticker,
          totalShares: h.totalShares,
          avgPrice: h.totalCost / h.totalShares,
          currentPrice,
          totalValue,
          totalGain,
          gainPct,
          name: h.name,
        };
      });
  }, [holdingsMap, stocks]);

  // Filter by search term and change direction
  const filteredHoldings = useMemo(() => {
    let result = enrichedHoldings;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (h) =>
          h.ticker.toLowerCase().includes(q) ||
          h.name.toLowerCase().includes(q)
      );
    }
    // Apply change direction filter
    if (changeFilter !== "all") {
      result = result.filter((h) => {
        if (changeFilter === "gainers") return h.gainPct > 0;
        if (changeFilter === "losers") return h.gainPct < 0;
        return h.gainPct === 0;
      });
    }
    return result;
  }, [enrichedHoldings, debouncedSearch, changeFilter]);

  // Sort state for holdings table
  type SortColumn = "totalShares" | "avgPrice" | "currentPrice" | "totalValue" | "totalGain" | "gainPct";
  const [sort, setSort] = useState<{ column: SortColumn; direction: "asc" | "desc" } | null>(null);

  // Apply sorting to holdings
  const sortedHoldings = useMemo(() => {
    if (!sort) return filteredHoldings;
    return [...filteredHoldings].sort((a, b) => {
      const aVal = a[sort.column];
      const bVal = b[sort.column];
      return sort.direction === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [filteredHoldings, sort]);

  const handleSort = (column: SortColumn) => {
    setSort((prev) => {
      if (prev?.column !== column) return { column, direction: "desc" };
      if (prev.direction === "desc") return { column, direction: "asc" };
      return null;
    });
  };

  // Reusable sort header
  function SortHeader({
    column,
    label,
  }: {
    column: SortColumn;
    label: string;
  }) {
    const isActive = sort?.column === column;
    const direction = isActive ? sort.direction : null;
    return (
      <button
        onClick={() => handleSort(column)}
        className="flex items-center gap-1 transition-colors hover:text-foreground"
        aria-sort={isActive ? (direction === "asc" ? "ascending" : "descending") : "none"}
      >
        <span>{label}</span>
        {direction === "asc" ? (
          <ArrowUp className="h-3 w-3 shrink-0" />
        ) : direction === "desc" ? (
          <ArrowDown className="h-3 w-3 shrink-0" />
        ) : (
          <ArrowUpDown className="h-3 w-3 shrink-0 text-muted-foreground/40" />
        )}
      </button>
    );
  }

  // Memoize totals — recalculates on enrichedHoldings change (infrequent)
  const totals = useMemo(() => {
    const totalValue = enrichedHoldings.reduce((sum, h) => sum + h.totalValue, 0);
    const totalGain = enrichedHoldings.reduce((sum, h) => sum + h.totalGain, 0);
    const gainPct = totalValue > 0 ? (totalGain / (totalValue - totalGain)) * 100 : 0;
    return { totalValue, totalGain, gainPct };
  }, [enrichedHoldings]);

  const { totalValue: totalPortfolioValue, totalGain: totalPortfolioGain, gainPct: totalGainPct } = totals;

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
    const rows = sortedHoldings.map((h) => [
      h.ticker,
      h.name,
      h.totalShares.toString(),
      h.avgPrice.toFixed(2),
      h.currentPrice.toFixed(2),
      h.totalValue.toFixed(2),
      h.totalGain.toFixed(2),
      h.gainPct.toFixed(2),
    ]);
    exportToCsv(`zse-portfolio-local-${new Date().toISOString().split("T")[0]}`, headers, rows);
    toast.success(t("toast.exported"));
  };

  return (
    <div className="space-y-4">
      {/* Local indicator */}
      <div className="flex items-center justify-between rounded-sm bg-muted/50 px-2 py-1">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-muted-foreground">
            Portfolio saved locally
          </span>
        </div>
        <span
          className={cn(
            "text-[10px] font-medium text-emerald-600 transition-opacity duration-500",
            savedFlash ? "opacity-100" : "opacity-0",
          )}
        >
          Saved
        </span>
      </div>

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
            {filteredHoldings.length}
          </div>
        </div>
      </div>

      {/* Search + filters + Add position + export buttons */}
      <div className="flex flex-wrap justify-end gap-2">
        {enrichedHoldings.length > 0 && (
          <>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-32 pl-8 pr-8 py-2.5 text-xs h-9"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  title="Clear"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {/* Change direction filters */}
            <div className="flex gap-1">
              <button
                onClick={() => setChangeFilter("all")}
                className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all",
                  changeFilter === "all"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                )}
              >
                <TrendingUp className="h-3 w-3" />
                <span className="hidden sm:inline">Svi</span>
              </button>
              <button
                onClick={() => setChangeFilter("gainers")}
                className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all",
                  changeFilter === "gainers"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                )}
              >
                <TrendingUp className="h-3 w-3" />
                <span className="hidden sm:inline">+</span>
              </button>
              <button
                onClick={() => setChangeFilter("losers")}
                className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all",
                  changeFilter === "losers"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                )}
              >
                <TrendingDown className="h-3 w-3" />
                <span className="hidden sm:inline">-</span>
              </button>
            </div>
            <Button size="sm" variant="outline" onClick={handleExportCsv}>
              <Download className="h-3.5 w-3.5" />
              CSV
            </Button>
          </>
        )}
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-3.5 w-3.5" />
          {t("addPosition")}
        </Button>
      </div>

      {/* Add position form */}
      {showAddForm && (
        <AddPositionForm
          onClose={() => setShowAddForm(false)}
          onSuccess={() => {
            toast.success(t("toast.transactionAdded"));
            setSavedFlash(true);
            setTimeout(() => setSavedFlash(false), 2000);
          }}
        />
      )}

      {/* Holdings table - horizontal scroll on mobile */}
      {sortedHoldings.length > 0 ? (
        <div className="overflow-x-auto rounded-md border border-border [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable]">
          <table className="min-w-[400px] w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 text-left font-medium">{t("fields.ticker")}</th>
                <th className="px-3 py-2 text-right font-medium">
                  <SortHeader column="totalShares" label={t("fields.shares")} />
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  <SortHeader column="avgPrice" label={t("fields.avgPrice")} />
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  <SortHeader column="currentPrice" label={t("fields.currentPrice")} />
                </th>
                <th className="hidden px-3 py-2 text-right font-medium md:table-cell">
                  <SortHeader column="totalValue" label={t("fields.value")} />
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  <SortHeader column="gainPct" label={t("fields.gain")} />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedHoldings.map((h) => (
                <tr
                  key={h.ticker}
                  className="border-b border-border/50 cursor-pointer transition-all duration-150 active:bg-accent/50 hover:bg-accent/70"
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
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-md border border-border bg-card">
          <EmptyState
            icon={<Wallet className="h-8 w-8" />}
            title={hasLocalTransactions ? t("emptySold") : t("empty")}
            description={hasLocalTransactions ? t("emptySoldDescription") : t("emptyDescription")}
            action={{ label: t("addPosition"), onClick: () => setShowAddForm(true) }}
          />
        </div>
      )}

      {/* Transaction history */}
      {hasLocalTransactions && (
        <div className="rounded-md border border-border">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-muted/50"
          >
            <span>
              {t("history")} ({transactions.length}) —{" "}
              <span className="text-[10px] text-muted-foreground/70">
                tap a row to delete
              </span>
            </span>
            {showHistory ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>

          {showHistory && (
            <div className="border-t border-border">
              <div className="flex justify-end gap-2 px-3 py-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const headers = ["Date", "Ticker", "Type", "Shares", "Price (EUR)", "Total (EUR)", "Notes"];
                    const rows = transactions.map((tx) => [
                      new Date(tx.transactionDate).toISOString().split("T")[0],
                      tx.ticker,
                      tx.transactionType,
                      tx.shares.toString(),
                      tx.pricePerShare.toFixed(2),
                      tx.totalAmount.toFixed(2),
                      tx.notes || "",
                    ]);
                    exportToCsv(
                      `zse-transactions-${new Date().toISOString().split("T")[0]}`,
                      headers,
                      rows,
                    );
                    toast.success(t("toast.exported"));
                  }}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  <Download className="h-3 w-3" />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Clear all local transactions?")) {
                      clearTransactions();
                    }
                  }}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear all
                </button>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 py-1.5 text-left font-medium">Date</th>
                    <th className="px-3 py-1.5 text-left font-medium">Ticker</th>
                    <th className="px-3 py-1.5 text-left font-medium">Type</th>
                    <th className="px-3 py-1.5 text-right font-medium">Shares</th>
                    <th className="px-3 py-1.5 text-right font-medium">Price</th>
                    <th className="px-3 py-1.5 text-right font-medium">Total</th>
                    <th className="px-3 py-1.5 w-8" />
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => {
                    return (
                      <tr
                        key={tx.id}
                        className="group border-b border-border/50 last:border-b-0 active:bg-muted/50 hover:bg-muted/30"
                      >
                        <td className="px-3 py-2 md:py-1.5 text-muted-foreground">
                          {new Date(tx.transactionDate).toLocaleDateString("hr-HR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "2-digit",
                          })}
                        </td>
                        <td className="px-3 py-2 md:py-1.5 font-data font-semibold text-foreground">
                          {tx.ticker}
                        </td>
                        <td className="px-3 py-2 md:py-1.5">
                          <span
                            className={cn(
                              "inline-block rounded-[3px] px-1.5 py-0.5 font-data text-[10px] uppercase",
                              tx.transactionType === "buy"
                                ? "bg-buy/10 text-buy"
                                : tx.transactionType === "sell"
                                  ? "bg-sell/10 text-sell"
                                  : "bg-dividend/10 text-dividend",
                            )}
                          >
                            {tx.transactionType}
                          </span>
                        </td>
                        <td className="px-3 py-2 md:py-1.5 text-right font-data tabular-nums text-foreground">
                          {tx.shares.toFixed(0)}
                        </td>
                        <td className="px-3 py-2 md:py-1.5 text-right font-data tabular-nums text-muted-foreground">
                          {formatPrice(tx.pricePerShare)}
                        </td>
                        <td className="px-3 py-2 md:py-1.5 text-right font-data tabular-nums text-foreground">
                          {formatCurrency(tx.totalAmount)}
                        </td>
                        <td className="px-3 py-2 md:py-1.5">
                          <button
                            type="button"
                            onClick={() => removeTransaction(tx.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                            title="Delete transaction"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

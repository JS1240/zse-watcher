import { useState, useMemo, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, ChevronDown, ChevronUp, Download, Search, X, ArrowUp, ArrowDown, ArrowUpDown, TrendingUp, TrendingDown, Keyboard, CheckCircle2, ArrowUp as ScrollToTopIcon } from "lucide-react";
import { Highlight } from "@/components/shared/highlight";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { toast } from "sonner";
import { useLocalTransactions } from "@/features/portfolio/hooks/use-local-transactions";
import { useDebounce } from "@/hooks/use-debounce";
import { Input } from "@/components/ui/input";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { AddPositionForm } from "@/features/portfolio/components/add-position-form";
import { PortfolioSkeleton } from "@/features/portfolio/components/portfolio-skeleton";
import { Button } from "@/components/ui/button";
import { ChangeBadge } from "@/components/shared/change-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PortfolioEmptyIllustration, PortfolioSoldIllustration } from "@/components/shared/empty-illustrations";
import { formatPrice, formatCurrency } from "@/lib/formatters";
import { exportToCsv } from "@/lib/export";
import { cn } from "@/lib/utils";
import { useSelectedStock } from "@/hooks/use-selected-stock";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export function LocalPortfolioDashboard() {
  const { t } = useTranslation("portfolio");
  const { t: tc } = useTranslation("common");
  const { transactions, hasLocalTransactions, removeTransaction, clearTransactions } =
    useLocalTransactions();
  const { data: stocksResult, isLoading: isStocksLoading } = useStocksLive();
  const stocks = stocksResult?.stocks ?? null;
  const { select } = useSelectedStock();
  const [showAddForm, setShowAddForm] = useState(false);
  const [search, setSearch] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [scrollTop, setScrollTop] = useState(false);
  const portfolioRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation for portfolio table rows
  const handleRowKeyDown = useCallback((e: React.KeyboardEvent, ticker: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(ticker);
    }
  }, [select]);

  // Click-to-copy handlers
  const handleCopyTicker = useCallback(async (e: React.MouseEvent, ticker: string) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(ticker);
    toast.success(t("toast.copied", { ticker }));
    setCopiedField(`ticker-${ticker}`);
    setTimeout(() => setCopiedField(null), 1200);
  }, [t]);

  const handleCopyPrice = useCallback(async (e: React.MouseEvent, price: number) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(price.toFixed(2));
    toast.success(t("toast.priceCopied", { price: formatPrice(price) }));
    setCopiedField(`price-${price}`);
    setTimeout(() => setCopiedField(null), 1200);
  }, [t]);

  const handleCopyValue = useCallback(async (e: React.MouseEvent, value: number) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(value.toFixed(2));
    toast.success(t("toast.valueCopied", { value: formatCurrency(value) }));
    setCopiedField(`value-${value}`);
    setTimeout(() => setCopiedField(null), 1200);
  }, [t]);

  // Keyboard shortcut to focus search (matching watchlist pattern)
  const searchInputRef = useRef<HTMLInputElement>(null);
  const focusSearch = useCallback(() => searchInputRef.current?.focus(), []);
  useKeyboardShortcut({ key: "/", handler: focusSearch, enabled: true });

  const [changeFilter, setChangeFilter] = useState<"all" | "gainers" | "losers" | "unchanged">("all");
  const [sectorFilter, setSectorFilter] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 200);
  const [showHistory, setShowHistory] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Sort state for transactions
  type TxSortColumn = "transactionDate" | "ticker" | "transactionType" | "shares" | "pricePerShare" | "totalAmount";
  const [txSort, setTxSort] = useState<{ column: TxSortColumn; direction: "asc" | "desc" }>({
    column: "transactionDate",
    direction: "desc",
  });

  // Sort transactions
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      if (txSort.column === "transactionDate") {
        const aTime = new Date(a.transactionDate).getTime();
        const bTime = new Date(b.transactionDate).getTime();
        return txSort.direction === "asc" ? aTime - bTime : bTime - aTime;
      }
      if (txSort.column === "ticker") {
        return txSort.direction === "asc"
          ? a.ticker.localeCompare(b.ticker)
          : b.ticker.localeCompare(a.ticker);
      }
      if (txSort.column === "transactionType") {
        return txSort.direction === "asc"
          ? a.transactionType.localeCompare(b.transactionType)
          : b.transactionType.localeCompare(a.transactionType);
      }
      const aVal = a[txSort.column] as number;
      const bVal = b[txSort.column] as number;
      return txSort.direction === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [transactions, txSort]);

  // Show skeleton while stocks load (conditional render instead of early return for React hooks compliance)
  const showSkeleton = isStocksLoading || (!stocksResult && transactions.length > 0);

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
          sector: stock?.sector ?? "N/A",
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

  // Compute unique sectors from holdings
  const availableSectors = useMemo(() => {
    const sectors = new Set(enrichedHoldings.map((h) => h.sector).filter(Boolean));
    return Array.from(sectors).sort();
  }, [enrichedHoldings]);

  // Apply sector filter
  const filteredBySector = useMemo(() => {
    if (!sectorFilter) return filteredHoldings;
    return filteredHoldings.filter((h) => h.sector === sectorFilter);
  }, [filteredHoldings, sectorFilter]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (debouncedSearch) count++;
    if (sectorFilter) count++;
    if (changeFilter !== "all") count++;
    return count;
  }, [debouncedSearch, sectorFilter, changeFilter]);

  // Sort state for holdings table
  type SortColumn = "name" | "totalShares" | "avgPrice" | "currentPrice" | "totalValue" | "totalGain" | "gainPct";
  const [sort, setSort] = useState<{ column: SortColumn; direction: "asc" | "desc" } | null>(null);

  // Apply sorting to holdings
  const sortedHoldings = useMemo(() => {
    if (!sort) return filteredBySector;
    return [...filteredBySector].sort((a, b) => {
      const aVal = a[sort.column];
      const bVal = b[sort.column];
      // Handle string columns
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sort.direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      // Handle number columns
      return sort.direction === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [filteredBySector, sort]);

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
    toast.success(t("toast.exported"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
  };

  // Export transaction history as CSV for Croatian tax reporting
  const handleExportTransactions = () => {
    if (!transactions.length) return;

    const headers = ["Date", "Ticker", "Type", "Shares", "Price (EUR)", "Total (EUR)", "Notes"];
    const rows = [...transactions]
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      .map((tx) => [
        new Date(tx.transactionDate).toISOString().split("T")[0],
        tx.ticker,
        tx.transactionType,
        tx.shares.toString(),
        tx.pricePerShare.toFixed(2),
        tx.totalAmount.toFixed(2),
        tx.notes ?? "",
      ]);
    exportToCsv(
      `zse-transactions-local-${new Date().toISOString().split("T")[0]}`,
      headers,
      rows,
    );
    toast.success(t("toast.exported"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
  };

  return showSkeleton ? (
    <PortfolioSkeleton />
  ) : (
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
                ref={searchInputRef}
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-32 pl-8 pr-14 py-2.5 text-xs h-9"
              />
              {!search && (
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                  <Keyboard className="h-2.5 w-2.5" />
                  /
                </span>
              )}
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
            {/* Active filters badge */}
            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  setSearch("");
                  setChangeFilter("all");
                  setSectorFilter(null);
                }}
                className="flex items-center gap-1 rounded-full bg-destructive px-2.5 py-1.5 text-[10px] font-semibold text-destructive-foreground shadow-sm transition-colors hover:bg-destructive/90"
                title={tc("actions.clear")}
                aria-label={`${activeFilterCount} ${tc("actions.clear")}`}
              >
                {activeFilterCount}
                <X className="h-3 w-3" />
              </button>
            )}
            {/* Sector filter dropdown */}
            {availableSectors.length > 0 && (
              <select
                value={sectorFilter ?? ""}
                onChange={(e) => setSectorFilter(e.target.value || null)}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[10px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                  sectorFilter
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                )}
              >
                <option value="">{t("filters.allSectors")}</option>
                {availableSectors.map((sector) => (
                  <option key={sector} value={sector}>
                    {sector}
                  </option>
                ))}
              </select>
            )}
            <Button size="sm" variant="outline" onClick={handleExportCsv}>
              <Download className="h-3.5 w-3.5" />
              {t("exportCsv") || "CSV"}
            </Button>
            {transactions.length > 0 && (
              <Button size="sm" variant="outline" onClick={handleExportTransactions}>
                <Download className="h-3.5 w-3.5" />
                {t("exportTransactions") || "Transactions"}
              </Button>
            )}
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
            toast.success(t("toast.transactionAdded"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
            setSavedFlash(true);
            setTimeout(() => setSavedFlash(false), 2000);
          }}
        />
      )}

      {/* Holdings table - horizontal scroll on mobile */}
      {sortedHoldings.length > 0 ? (
        <div
          className="overflow-x-auto rounded-md border border-border [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable]"
          onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop > 200)}
          ref={portfolioRef}
        >
          <table className="min-w-[400px] w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 text-left font-medium">{t("fields.ticker")}</th>
                <th className="hidden px-3 py-2 text-left font-medium md:table-cell">
                  <SortHeader column="name" label={t("fields.name") || "Name"} />
                </th>
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
                  tabIndex={0}
                  role="row"
                  className="border-b border-border/50 cursor-pointer transition-all duration-150 hover:bg-accent/40 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
                  onClick={() => select(h.ticker)}
                  onKeyDown={(e) => handleRowKeyDown(e, h.ticker)}
                >
                  <td className="px-3 py-3 md:py-2">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => handleCopyTicker(e, h.ticker)}
                        className={cn(
                          "font-data font-semibold text-foreground transition-colors hover:text-primary",
                          copiedField === `ticker-${h.ticker}` && "text-primary",
                        )}
                        title="Kopiraj ticker"
                      >
                        <Highlight text={h.ticker} highlight={debouncedSearch} />
                      </button>
                      <span className="text-[10px] text-muted-foreground">
                        <Highlight text={h.name} highlight={debouncedSearch} />
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 md:py-2 text-right font-data tabular-nums text-foreground">
                    {h.totalShares.toFixed(0)}
                  </td>
                  <td className="px-3 py-3 md:py-2 text-right font-data tabular-nums text-muted-foreground">
                    {formatPrice(h.avgPrice)}
                  </td>
                  <td className="px-3 py-3 md:py-2">
                    <button
                      type="button"
                      onClick={(e) => handleCopyPrice(e, h.currentPrice)}
                      className={cn(
                        "font-data text-right tabular-nums text-foreground transition-colors hover:text-primary",
                        copiedField === `price-${h.currentPrice}` && "text-primary",
                      )}
                      title="Kopiraj cijenu"
                    >
                      {formatPrice(h.currentPrice)}
                    </button>
                  </td>
                  <td className="hidden px-3 py-3 md:py-2 text-right md:table-cell">
                    <button
                      type="button"
                      onClick={(e) => handleCopyValue(e, h.totalValue)}
                      className={cn(
                        "font-data tabular-nums text-foreground transition-colors hover:text-primary",
                        copiedField === `value-${h.totalValue}` && "text-primary",
                      )}
                      title="Kopiraj vrijednost"
                    >
                      {formatCurrency(h.totalValue)}
                    </button>
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
            icon={hasLocalTransactions ? <PortfolioSoldIllustration className="h-10 w-10" /> : <PortfolioEmptyIllustration className="h-10 w-10" />}
            title={hasLocalTransactions ? t("emptySold") : t("empty")}
            description={hasLocalTransactions ? t("emptySoldDescription") : t("emptyDescription")}
            action={{ label: t("addPosition"), onClick: () => setShowAddForm(true) }}
            variant="action"
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
              <div className="flex items-center justify-between gap-2 px-3 py-1.5">
                {/* Sort dropdown */}
                <select
                  value={`${txSort.column}-${txSort.direction}`}
                  onChange={(e) => {
                    const [column, direction] = e.target.value.split("-") as [TxSortColumn, "asc" | "desc"];
                    setTxSort({ column, direction });
                  }}
                  className="rounded border border-border bg-background px-2 py-1 text-[10px] text-foreground"
                >
                  <option value="transactionDate-desc">{t("sort.newest") || "Najnovije"}</option>
                  <option value="transactionDate-asc">{t("sort.oldest") || "Najstarije"}</option>
                  <option value="ticker-asc">{t("sort.tickerAsc") || "A-Z"}</option>
                  <option value="ticker-desc">{t("sort.tickerDesc") || "Z-A"}</option>
                  <option value="totalAmount-desc">{t("sort.valueDesc") || "Vrijednost ↓"}</option>
                  <option value="totalAmount-asc">{t("sort.valueAsc") || "Vrijednost ↑"}</option>
                </select>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const headers = ["Date", "Ticker", "Type", "Shares", "Price (EUR)", "Total (EUR)", "Notes"];
                      const rows = sortedTransactions.map((tx) => [
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
                      toast.success(t("toast.exported"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
                    }}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    <Download className="h-3 w-3" />
                    CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                    {t("clearAll") || "Clear all"}
                  </button>
                </div>
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
                  {sortedTransactions.map((tx) => {
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

      {/* Clear confirmation dialog */}
      <ConfirmationDialog
        open={confirmClear}
        onOpenChange={(open) => !open && setConfirmClear(false)}
        title={t("confirmClear") || "Clear all transactions?"}
        description={
          t("confirmClearDescription") ||
          "This will permanently delete all your local transactions. This action cannot be undone."
        }
        confirmLabel={t("actions.clear") || "Clear"}
        cancelLabel={t("actions.cancel") || "Cancel"}
        variant="danger"
        onConfirm={() => {
          clearTransactions();
          toast.success(t("toast.cleared") || "All transactions cleared", { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
        }}
      />

      {/* Scroll to top button */}
      {sortedHoldings.length > 10 && (
        <button
          onClick={() => portfolioRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          className={cn(
            "fixed bottom-6 right-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-200 hover:bg-primary/90",
            scrollTop ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2"
          )}
          aria-label="Pomakni na vrh"
        >
          <ScrollToTopIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

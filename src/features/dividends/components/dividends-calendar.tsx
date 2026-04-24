import { useMemo, useState, useEffect, useRef, useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, Search, Calendar, Download, ChevronDown, ChevronUp, ArrowUp, ArrowUpDown, Keyboard, TrendingUp, TrendingDown, Copy, X } from "lucide-react";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { toast } from "sonner";
import { DividendsCalendarEmptyIllustration } from "@/components/shared/empty-illustrations";
import { useDividends } from "@/features/dividends/api/dividends-queries";
import { DividendsSkeleton } from "./dividends-skeleton";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { StockDetailDrawer } from "@/features/stocks/components/stock-detail-drawer";
import { useSelectedStock } from "@/hooks/use-selected-stock";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { exportToCsv } from "@/lib/export";
import { cn } from "@/lib/utils";
import type { DividendEntry } from "@/features/dividends/api/dividends-queries";

const ROW_FOCUS_ATTR = "data-row-index" as const;

export function DividendsCalendar() {
  const { t } = useTranslation("common");
  const { t: td } = useTranslation("dividends");
  const { data: dividends, isLoading, isError, refetch } = useDividends();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"yield" | "amount" | "exDivDate">("exDivDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [showYearFilter, setShowYearFilter] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [scrollTop, setScrollTop] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<"all" | "upcoming" | "past">("all");
  const dividendsListRef = useRef<HTMLDivElement>(null);
  const { select, selectedTicker } = useSelectedStock();

  // Close dropdowns on outside click — must be called before any early returns
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (showYearFilter || showSortMenu) {
        const target = e.target as HTMLElement;
        if (!target.closest("[data-dropdown]")) {
          setShowYearFilter(false);
          setShowSortMenu(false);
        }
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showYearFilter, showSortMenu]);

  // Stats computed from filtered results (not sorted/grouped)
  const stats = useMemo(() => {
    if (!dividends) return { count: 0, avgYield: 0, totalAmount: 0 };
    const now = new Date();
    const upcoming = dividends.filter((d) => new Date(d.exDivDate) >= now);
    return {
      count: upcoming.length,
      avgYield: upcoming.length > 0
        ? upcoming.reduce((sum, d) => sum + d.yield, 0) / upcoming.length
        : 0,
      totalAmount: upcoming.reduce((sum, d) => sum + d.amountEur, 0),
    };
  }, [dividends]);

  // Click-to-copy handlers for dividend tickers (matching portfolio/stocks pattern)
  const handleCopyTicker = useCallback(async (e: React.MouseEvent, ticker: string) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(ticker);
    toast.success(t("toast.copied", { ticker }) || `${ticker} kopiran`);
    setCopiedField(`ticker-${ticker}`);
    setTimeout(() => setCopiedField(null), 1200);
  }, [t]);

  const handleCopyAmount = useCallback(async (e: React.MouseEvent, amount: number) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(amount.toFixed(2));
    toast.success(t("toast.amountCopied", { amount: formatCurrency(amount) }) || `Kopirano: ${formatCurrency(amount)}`);
    setCopiedField(`amount-${amount}`);
    setTimeout(() => setCopiedField(null), 1200);
  }, [t]);

  const handleCopyYield = useCallback(async (e: React.MouseEvent, yieldPct: number) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(`${yieldPct.toFixed(2)}%`);
    toast.success(`Kopirano: ${yieldPct.toFixed(2)}%`);
    setCopiedField(`yield-${yieldPct}`);
    setTimeout(() => setCopiedField(null), 1200);
  }, []);

  // Keyboard shortcut to focus search (matching stocks/watchlist/portfolio pattern)
  const searchInputRef = useRef<HTMLInputElement>(null);
  const focusSearch = useCallback(() => searchInputRef.current?.focus(), []);
  useKeyboardShortcut({ key: "/", handler: focusSearch, enabled: true });

  // Extract unique years from dividends
  const availableYears = useMemo(() => {
    if (!dividends) return [];
    const years = new Set(dividends.map((d) => new Date(d.exDivDate).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [dividends]);

  // Default to most recent year on first load
  useEffect(() => {
    if (availableYears.length > 0 && selectedYear === null) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // Currently selected year label
  const selectedYearLabel = selectedYear
    ? selectedYear.toString()
    : availableYears[0]?.toString() ?? "Sve";

  // Filter and sort dividends
  const filteredDividends = useMemo(() => {
    if (!dividends) return [];
    let result = [...dividends];

    // Filter by year (default to most recent if none selected)
    const targetYear = selectedYear ?? availableYears[0];
    if (targetYear) {
      result = result.filter((d) => new Date(d.exDivDate).getFullYear() === targetYear);
    }

    // Filter by time (upcoming vs past) — independent of year filter
    const now = new Date();
    if (timeFilter === "upcoming") {
      result = result.filter((d) => new Date(d.exDivDate) >= now);
    } else if (timeFilter === "past") {
      result = result.filter((d) => new Date(d.exDivDate) < now);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.ticker.toLowerCase().includes(query) ||
          d.name.toLowerCase().includes(query)
      );
    }

    return result;
  }, [dividends, searchQuery, selectedYear, availableYears, timeFilter]);

  // Sort (applied after filtering)
  const sortedDividends = useMemo(() => {
    const result = [...filteredDividends];
    result.sort((a, b) => {
      let aVal: number | string;
      let bVal: number | string;
      switch (sortField) {
        case "yield":
          aVal = a.yield;
          bVal = b.yield;
          break;
        case "amount":
          aVal = a.amountEur;
          bVal = b.amountEur;
          break;
        case "exDivDate":
        default:
          aVal = a.exDivDate;
          bVal = b.exDivDate;
          break;
      }
      if (typeof aVal === "string") {
        return sortDir === "asc"
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }
      return sortDir === "asc" ? aVal - (bVal as number) : (bVal as number) - aVal;
    });

    return result;
  }, [filteredDividends, sortField, sortDir]);

  // Group filtered dividends by month
  const grouped = useMemo(() => {
    if (!sortedDividends.length) return [];

    const months = new Map<string, DividendEntry[]>();

    for (const d of sortedDividends) {
      const monthKey = d.exDivDate.slice(0, 7); // YYYY-MM
      if (!months.has(monthKey)) {
        months.set(monthKey, []);
      }
      months.get(monthKey)!.push(d);
    }

    return Array.from(months.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, items]) => ({
        month,
        label: new Date(month + "-01").toLocaleDateString("hr-HR", {
          year: "numeric",
          month: "long",
        }),
        items,
      }));
  }, [sortedDividends]);

  if (isLoading) {
    return <DividendsSkeleton rows={3} />;
  }

  if (isError) {
    return (
      <ErrorState
        title={t("errors.generic")}
        description={t("errors.network")}
        retry={{ onRetry: refetch, label: t("errors.tryAgain") }}
      />
    );
  }

  if (!dividends?.length) {
    return (
      <EmptyState
        icon={<DividendsCalendarEmptyIllustration className="h-10 w-10" />}
        title={td("empty.noData")}
        description={td("empty.noDataDescription")}
        variant="info"
      />
    );
  }

  if (!grouped.length && searchQuery) {
    return (
      <EmptyState
        icon={<Search className="h-8 w-8" />}
        title={t("empty.noResults")}
        description={t("empty.noResultsDescription")}
        variant="no-results"
        action={{ label: t("clear"), onClick: () => setSearchQuery("") }}
        shortcut="/"
      />
    );
  }

  // Export enriched dividends to CSV — includes all relevant fields for Croatian tax planning
  const handleExportCsv = () => {
    if (!sortedDividends.length) return;
    const headers = [
      "Ticker",
      "Name",
      "Ex-Div Date",
      "Pay Date",
      "Days to Ex-Div",
      "Amount (EUR)",
      "Yield (%)",
    ];
    const now = new Date();
    const rows = sortedDividends.map((d) => {
      const exDivDate = new Date(d.exDivDate);
      const daysToExDiv = Math.ceil((exDivDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return [
        d.ticker,
        d.name,
        formatDate(d.exDivDate),
        formatDate(d.payDate),
        daysToExDiv > 0 ? `${daysToExDiv}d` : (daysToExDiv === 0 ? "Today" : "Past"),
        d.amountEur.toFixed(2),
        d.yield.toFixed(2),
      ];
    });
    exportToCsv(`zse-dividends-${selectedYear ?? "all"}-${new Date().toISOString().split("T")[0]}`, headers, rows);
    toast.success(td("toast.exported"));
  };

  return (
    <div className="space-y-4">
      {/* Summary cards for quick stats */}
      {dividends && dividends.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md border border-border bg-card p-2.5">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
              {td("stats.upcomingDividends")}
            </span>
            <div className="mt-0.5 font-data text-base font-bold tabular-nums text-foreground">
              {stats.count}
            </div>
          </div>
          <div className="rounded-md border border-border bg-card p-2.5">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
              {td("stats.avgYield")}
            </span>
            <div className="mt-0.5 font-data text-base font-bold tabular-nums text-foreground">
              {stats.avgYield.toFixed(1)}%
            </div>
          </div>
          <div className="rounded-md border border-border bg-card p-2.5">
            <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
              {td("stats.totalAmount")}
            </span>
            <div className="mt-0.5 font-data text-base font-bold tabular-nums text-foreground">
              {formatCurrency(stats.totalAmount)}
            </div>
          </div>
        </div>
      )}

      {/* Search and sort controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-14 h-8 text-xs"
          />
          {!searchQuery && (
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
              <Keyboard className="h-2.5 w-2.5" />
              /
            </span>
          )}
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              title={t("actions.clear")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Time filter chips */}
        <div className="flex gap-1">
          {(["all", "upcoming", "past"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setTimeFilter(f)}
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                timeFilter === f
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted"
              )}
            >
              {f === "all" && "Svi"}
              {f === "upcoming" && (
                <>
                  <TrendingUp className="h-3 w-3" />
                  <span className="hidden sm:inline">{td("filter.upcoming")}</span>
                </>
              )}
              {f === "past" && (
                <>
                  <TrendingDown className="h-3 w-3" />
                  <span className="hidden sm:inline">{td("filter.past")}</span>
                </>
              )}
            </button>
          ))}
        </div>

        {/* Year filter dropdown */}
        {availableYears.length > 1 && (
          <div className="relative" data-dropdown>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowYearFilter(!showYearFilter)}
              className="min-w-[70px] gap-1"
            >
              <Calendar className="h-3.5 w-3.5" />
              {selectedYearLabel}
              {showYearFilter ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
            {showYearFilter && (
              <div className="absolute right-0 top-full z-10 mt-1 min-w-[80px] rounded-md border border-border bg-card shadow-md">
                <button
                  onClick={() => {
                    setSelectedYear(null);
                    setShowYearFilter(false);
                  }}
                  className={cn(
                    "block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selectedYear === null && "bg-accent font-medium"
                  )}
                >
                  Sve
                </button>
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => {
                      setSelectedYear(year);
                      setShowYearFilter(false);
                    }}
                    className={cn(
                      "block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      selectedYear === year && "bg-accent font-medium"
                    )}
                  >
                    {year}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Sort dropdown */}
        <div className="relative" data-dropdown>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="min-w-[130px] gap-1"
          >
            <ChevronUp
              className={cn("h-3 w-3 transition-transform", sortDir === "asc" ? "" : "rotate-180")}
            />
            {td("sortBy")}
          </Button>
          {showSortMenu && (
            <div className="absolute left-0 top-full z-10 mt-1 min-w-[150px] rounded-md border border-border bg-card shadow-md">
              {([
                { field: "exDivDate", label: td("sort.date") || "Datum", defaultDir: "desc" as const },
                { field: "yield", label: td("sort.yield") || "Prinos", defaultDir: "desc" as const },
                { field: "amount", label: td("sort.amount") || "Iznos", defaultDir: "desc" as const },
              ] as const).map((opt) => {
                const isActive = sortField === opt.field;
                return (
                  <button
                    key={opt.field}
                    onClick={() => {
                      if (isActive) {
                        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                      } else {
                        setSortField(opt.field);
                        setSortDir(opt.defaultDir);
                      }
                      setShowSortMenu(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      isActive && "bg-accent font-medium"
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      {isActive ? (
                        sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowUp className="h-3 w-3 rotate-180" />
                      ) : (
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />
                      )}
                      {opt.label}
                    </span>
                    {isActive && (
                      <ChevronUp className={cn("h-3 w-3", sortDir === "asc" ? "" : "rotate-180")} />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleExportCsv}
          disabled={sortedDividends.length === 0}
          title={td("exportCsv")}
        >
          <Download className="h-3.5 w-3.5" />
          CSV
        </Button>
      </div>

      {/* Results count + always-visible keyboard shortcuts hint */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {sortedDividends.length} {sortedDividends.length === 1 ? "dividend" : "dividendi"}
          {selectedYear && (
            <span className="ml-1 text-primary">({selectedYear})</span>
          )}
        </span>
        <span className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-sans text-[8px]">/</kbd>
          <span className="hidden sm:inline">{td("shortcut.search")}</span>
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-sans text-[8px]">Enter</kbd>
          <span className="hidden sm:inline">{td("shortcut.view")}</span>
        </span>
      </div>

      {grouped.length > 0 && (
        <>
          <div
            ref={dividendsListRef}
            onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop > 200)}
            className="max-h-[calc(100vh-360px)] space-y-4 overflow-y-auto pr-1"
          >
            {grouped.map((group) => (
              <div key={group.month}>
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </h3>
                <div className="space-y-1">
                  {group.items?.map((d, idx) => (
                    <DividendRow
                      key={`${d.ticker}-${d.exDivDate}`}
                      dividend={d}
                      rowIndex={idx}
                      searchQuery={searchQuery}
                      labels={{ exDiv: td('calendar.exDiv'), pay: td('calendar.pay') }}
                      copiedField={copiedField}
                      onCopyTicker={handleCopyTicker}
                      onCopyAmount={handleCopyAmount}
                      onCopyYield={handleCopyYield}
                      onSelect={select}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Scroll to top button */}
          <button
            onClick={() => dividendsListRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
            className={cn(
              "fixed bottom-6 right-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-200 hover:bg-primary/90",
              scrollTop ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2"
            )}
            aria-label={t("scrollToTop") || "Pomakni na vrh"}
            title={t("scrollToTop") || "Pomakni na vrh"}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Stock detail drawer from dividend row click */}
      <StockDetailDrawer
        ticker={selectedTicker}
        onClose={() => {}}
      />
    </div>
  );
}

interface DividendRowProps {
  dividend: DividendEntry;
  rowIndex: number;
  searchQuery: string;
  labels: { exDiv: string; pay: string };
  copiedField: string | null;
  onCopyTicker: (e: React.MouseEvent, ticker: string) => void;
  onCopyAmount: (e: React.MouseEvent, amount: number) => void;
  onCopyYield: (e: React.MouseEvent, yieldPct: number) => void;
  onSelect: (ticker: string) => void;
}

const DividendRow = memo(function DividendRow({
  dividend: d,
  rowIndex,
  searchQuery: _searchQuery,
  labels,
  copiedField,
  onCopyTicker,
  onCopyAmount,
  onCopyYield,
  onSelect,
}: DividendRowProps) {
  const isPast = new Date(d.exDivDate) < new Date();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(d.ticker);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const table = (e.currentTarget as HTMLElement).closest("[class*='space-y-']");
      const rows = Array.from(table?.querySelectorAll<HTMLElement>(`[${ROW_FOCUS_ATTR}]`) ?? []);
      const nextIdx = rowIndex + 1;
      if (rows[nextIdx]) {
        rows[nextIdx].focus();
        rows[nextIdx].scrollIntoView({ block: "nearest" });
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const table = (e.currentTarget as HTMLElement).closest("[class*='space-y-']");
      const rows = Array.from(table?.querySelectorAll<HTMLElement>(`[${ROW_FOCUS_ATTR}]`) ?? []);
      const prevIdx = rowIndex - 1;
      if (rows[prevIdx]) {
        rows[prevIdx].focus();
        rows[prevIdx].scrollIntoView({ block: "nearest" });
      }
    }
  };

  return (
    <button
      type="button"
      onClick={() => onSelect(d.ticker)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="row"
      aria-label={`${d.ticker} — ${d.name}: ex-div ${formatDate(d.exDivDate)}, payment ${formatDate(d.payDate)}, amount ${formatCurrency(d.amountEur)}, yield ${d.yield.toFixed(1)}%. Enter selects, Arrow keys navigate.`}
      className={cn(
        "group flex w-full cursor-pointer items-center justify-between rounded-md border border-border bg-card px-3 py-2.5 text-left transition-all hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isPast && "opacity-50",
      )}
      {...{ [ROW_FOCUS_ATTR]: rowIndex }}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
          <CalendarDays className="h-4 w-4 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => onCopyTicker(e, d.ticker)}
              className={cn(
                "font-data text-xs font-semibold text-foreground transition-colors hover:text-primary",
                copiedField === `ticker-${d.ticker}` && "text-primary"
              )}
              title="Click to copy ticker"
            >
              {d.ticker}
            </button>
            <span className="text-[10px] text-muted-foreground">{d.name}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>
              <span className="text-muted-foreground/60">{labels.exDiv}: </span>
              {formatDate(d.exDivDate)}
            </span>
            <span>
              <span className="text-muted-foreground/60">{labels.pay}: </span>
              {formatDate(d.payDate)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex flex-col items-end gap-0.5">
          <button
            type="button"
            onClick={(e) => onCopyAmount(e, d.amountEur)}
            className={cn(
              "font-data text-xs font-medium tabular-nums text-foreground transition-colors hover:text-primary",
              copiedField === `amount-${d.amountEur}` && "text-primary"
            )}
            title="Click to copy amount"
          >
            {formatCurrency(d.amountEur)}
          </button>
          <button
            type="button"
            onClick={(e) => onCopyYield(e, d.yield)}
            className={cn(
              "font-data text-[10px] tabular-nums transition-colors hover:text-primary",
              copiedField === `yield-${d.yield}` && "text-primary",
              d.yield >= 4
                ? "text-emerald-600 dark:text-emerald-400"
                : d.yield >= 2
                  ? "text-foreground"
                  : "text-muted-foreground"
            )}
            title="Click to copy yield"
          >
            {d.yield.toFixed(1)}%
          </button>
        </div>

        {/* Copy buttons — visible on hover/focus, matching alert row pattern */}
        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          <button
            type="button"
            onClick={(e) => onCopyTicker(e, d.ticker)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Copy ticker"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
      </div>
    </button>
  );
}, (prev, next) => {
  return (
    prev.dividend.ticker === next.dividend.ticker &&
    prev.dividend.exDivDate === next.dividend.exDivDate &&
    prev.copiedField === next.copiedField
  );
});
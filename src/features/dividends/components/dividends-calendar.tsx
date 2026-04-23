import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, Search, Calendar, Download, ChevronDown, ChevronUp, ArrowUp, ArrowUpDown, Keyboard, HelpCircle } from "lucide-react";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { toast } from "sonner";
import { useDividends } from "@/features/dividends/api/dividends-queries";
import { DividendsSkeleton } from "./dividends-skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { StockDetailDrawer } from "@/features/stocks/components/stock-detail-drawer";
import { useSelectedStock } from "@/hooks/use-selected-stock";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { exportToCsv } from "@/lib/export";
import { cn } from "@/lib/utils";

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
  const dividendsListRef = useRef<HTMLDivElement>(null);
  const { select, selectedTicker } = useSelectedStock();

  // Click-to-copy handlers for dividend tickers
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

  // Keyboard shortcut to focus search
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
  }, [dividends, searchQuery, selectedYear, availableYears]);

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

    const months = new Map<string, typeof dividends>();

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
        icon={<CalendarDays className="h-8 w-8" />}
        title={t("empty.noData")}
        description={t("empty.noDataDescription")}
        variant="info"
      />
    );
  }

  if (!grouped.length) {
    return (
      <EmptyState
        icon={<Search className="h-8 w-8" />}
        title={t("empty.noResults")}
        description={t("empty.noResultsDescription")}
        variant="no-results"
        action={{ label: t("clear"), onClick: () => setSearchQuery("") }}
      />
    );
  }

  // Export filtered dividends to CSV
  const handleExportCsv = () => {
    if (!sortedDividends.length) return;
    const headers = ["Ticker", "Name", "Ex-Div Date", "Pay Date", "Amount (EUR)", "Yield (%)"];
    const rows = sortedDividends.map((d) => [
      d.ticker,
      d.name,
      formatDate(d.exDivDate),
      formatDate(d.payDate),
      d.amountEur.toFixed(2),
      d.yield.toFixed(2),
    ]);
    exportToCsv(`zse-dividends-${selectedYear ?? "all"}-${new Date().toISOString().split("T")[0]}`, headers, rows);
    toast.success(td("toast.exported"));
  };

  return (
    <div className="space-y-4">
      {/* Search and sort controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
          {!searchQuery && (
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
              <Keyboard className="h-2.5 w-2.5" />
              /
            </span>
          )}
        </div>

        {/* Year filter dropdown */}
        {availableYears.length > 1 && (
          <div className="relative">
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
                    "block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-accent",
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
                      "block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-accent",
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
        <div className="relative">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="min-w-[130px] gap-1"
          >
            <ChevronUp
              className={cn("h-3 w-3 transition-transform", sortDir === "asc" ? "" : "rotate-180")}
            />
            {t("sortBy")}
          </Button>
          {showSortMenu && (
            <div className="absolute left-0 top-full z-10 mt-1 min-w-[150px] rounded-md border border-border bg-card shadow-md">
              {([
                { field: "exDivDate", label: t("sort.date") ?? td("sort.date", "Datum"), defaultDir: "desc" as const },
                { field: "yield", label: t("sort.yieldDesc") ?? td("sort.yield", "Prinos"), defaultDir: "desc" as const },
                { field: "amount", label: t("sort.amountDesc") ?? td("sort.amount", "Iznos"), defaultDir: "desc" as const },
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
                      "flex w-full items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-accent",
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
          title={t("exportCsv")}
        >
          <Download className="h-3.5 w-3.5" />
          CSV
        </Button>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>
          {sortedDividends.length} {sortedDividends.length === 1 ? "dividend" : "dividendi"}
          {selectedYear && (
            <span className="ml-1 text-primary">({selectedYear})</span>
          )}
        </span>
        {/* Always-visible keyboard shortcuts hint for discoverability */}
        <span className="flex items-center gap-1.5 text-[9px]">
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-sans text-[8px]">/</kbd>
          <span className="text-muted-foreground">{t("shortcut.search")}</span>
          <HelpCircle className="ml-1 h-3 w-3" />
        </span>
      </div>

      {grouped.length > 0 && (
        <>
          <div
            ref={dividendsListRef}
            onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop > 200)}
            className="max-h-[calc(100vh-280px)] space-y-4 overflow-y-auto pr-1"
          >
            {grouped.map((group) => (
              <div key={group.month}>
                <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </h3>
                <div className="space-y-1">
                  {group.items?.map((d) => {
                    const isPast = new Date(d.exDivDate) < new Date();
                    return (
                      <button
                        key={`${d.ticker}-${d.exDivDate}`}
                        onClick={() => select(d.ticker)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2.5 text-left transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isPast && "opacity-50",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                            <CalendarDays className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => handleCopyTicker(e, d.ticker)}
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
                              <span>Ex-div: {formatDate(d.exDivDate)}</span>
                              <span>Pay: {formatDate(d.payDate)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-right">
                          <div>
                            <button
                              type="button"
                              onClick={(e) => handleCopyAmount(e, d.amountEur)}
                              className={cn(
                                "font-data text-xs font-medium tabular-nums text-foreground transition-colors hover:text-primary",
                                copiedField === `amount-${d.amountEur}` && "text-primary"
                              )}
                              title="Click to copy amount"
                            >
                              {formatCurrency(d.amountEur)}
                            </button>
                            <Badge variant="success" className="text-[9px]">
                              {d.yield.toFixed(1)}%
                            </Badge>
                          </div>
                        </div>
                      </button>
                    );
                  })}
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
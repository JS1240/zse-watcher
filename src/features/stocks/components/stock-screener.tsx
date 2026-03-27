import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Filter, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, Info } from "lucide-react";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChangeBadge } from "@/components/shared/change-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatVolume } from "@/lib/formatters";
import type { Stock } from "@/types/stock";

interface ScreenerFilters {
  sector: string;
  minPrice: string;
  maxPrice: string;
  minChange: string;
  maxChange: string;
  minTurnover: string;
  minDividend: string;
  maxDividend: string;
}

type SortColumn = keyof Pick<Stock, "price" | "changePct" | "turnover" | "volume" | "name">;
type SortDirection = "asc" | "desc";

const INITIAL_FILTERS: ScreenerFilters = {
  sector: "",
  minPrice: "",
  maxPrice: "",
  minChange: "",
  maxChange: "",
  minTurnover: "",
  minDividend: "",
  maxDividend: "",
};

function SortHeader({
  column,
  label,
  sort,
  onSort,
}: {
  column: SortColumn;
  label: string;
  sort: { column: SortColumn; direction: SortDirection } | null;
  onSort: (col: SortColumn) => void;
}) {
  const isActive = sort?.column === column;
  const direction = isActive ? sort.direction : null;

  return (
    <button
      onClick={() => onSort(column)}
      className="flex items-center gap-1 px-3 py-2 text-left font-medium transition-colors hover:text-foreground data-[active=true]:text-foreground"
      data-active={isActive || undefined}
      aria-sort={isActive ? (direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <span>{label}</span>
      {direction === "asc" ? (
        <ArrowUp className="h-3 w-3 shrink-0" />
      ) : direction === "desc" ? (
        <ArrowDown className="h-3 w-3 shrink-0" />
      ) : (
        <ArrowUpDown className="h-3 w-3 shrink-0 text-muted-foreground/50" />
      )}
    </button>
  );
}

export function StockScreener() {
  const { t } = useTranslation("stocks");
  const { t: tc } = useTranslation("common");
  const { data: result, isLoading } = useStocksLive();
  const stocks = result?.stocks ?? null;
  const isMockData = result?.isMockData ?? false;
  const [filters, setFilters] = useState<ScreenerFilters>(INITIAL_FILTERS);
  const [sort, setSort] = useState<{ column: SortColumn; direction: SortDirection } | null>({
    column: "turnover",
    direction: "desc",
  });

  const sectors = useMemo(() => {
    if (!stocks) return [];
    return [...new Set(stocks.map((s) => s.sector))].sort();
  }, [stocks]);

  const filtered = useMemo(() => {
    if (!stocks) return [];

    return stocks.filter((s) => {
      if (filters.sector && s.sector !== filters.sector) return false;
      if (filters.minPrice && s.price < parseFloat(filters.minPrice)) return false;
      if (filters.maxPrice && s.price > parseFloat(filters.maxPrice)) return false;
      if (filters.minChange && s.changePct < parseFloat(filters.minChange)) return false;
      if (filters.maxChange && s.changePct > parseFloat(filters.maxChange)) return false;
      if (filters.minTurnover && s.turnover < parseFloat(filters.minTurnover)) return false;
      if (filters.minDividend && (s.dividendYield === null || s.dividendYield < parseFloat(filters.minDividend))) return false;
      if (filters.maxDividend && (s.dividendYield === null || s.dividendYield > parseFloat(filters.maxDividend))) return false;
      return true;
    });
  }, [stocks, filters]);

  const results = useMemo(() => {
    if (!sort) return filtered;

    return [...filtered].sort((a, b) => {
      const aVal = a[sort.column];
      const bVal = b[sort.column];

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sort.direction === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sort.direction === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [filtered, sort]);

  const handleSort = (col: SortColumn) => {
    setSort((prev) => {
      if (prev?.column !== col) return { column: col, direction: "desc" };
      if (prev.direction === "desc") return { column: col, direction: "asc" };
      return null;
    });
  };

  const updateFilter = (key: keyof ScreenerFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-3">
      {isMockData && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
          <Info className="h-3 w-3 shrink-0" />
          <span>{t("detail.demoData")}</span>
        </div>
      )}

      {/* Filter bar */}
      <div className="rounded-md border border-border bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Filter className="h-3 w-3" />
            {tc("common:actions.filter")}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilters(INITIAL_FILTERS);
              setSort({ column: "turnover", direction: "desc" });
            }}
            className="h-6 text-[10px]"
          >
            <RotateCcw className="h-3 w-3" />
            {tc("common:actions.reset")}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-[9px] uppercase text-muted-foreground">
              {t("table.sector")}
            </label>
            <select
              value={filters.sector}
              onChange={(e) => updateFilter("sector", e.target.value)}
              className="flex h-7 w-full rounded-md border border-input bg-background px-2 py-1 font-data text-[11px] text-foreground"
            >
              <option value="">All</option>
              {sectors.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-[9px] uppercase text-muted-foreground">
              {t("screener.minPrice")}
            </label>
            <Input
              type="number"
              step="0.01"
              value={filters.minPrice}
              onChange={(e) => updateFilter("minPrice", e.target.value)}
              className="h-7 text-[11px]"
              placeholder="0"
            />
          </div>

          <div>
            <label className="mb-1 block text-[9px] uppercase text-muted-foreground">
              {t("screener.maxPrice")}
            </label>
            <Input
              type="number"
              step="0.01"
              value={filters.maxPrice}
              onChange={(e) => updateFilter("maxPrice", e.target.value)}
              className="h-7 text-[11px]"
              placeholder="1000"
            />
          </div>

          <div>
            <label className="mb-1 block text-[9px] uppercase text-muted-foreground">
              {t("screener.minChange")}
            </label>
            <Input
              type="number"
              step="0.1"
              value={filters.minChange}
              onChange={(e) => updateFilter("minChange", e.target.value)}
              className="h-7 text-[11px]"
              placeholder="-10"
            />
          </div>

          <div>
            <label className="mb-1 block text-[9px] uppercase text-muted-foreground">
              {t("screener.maxChange")}
            </label>
            <Input
              type="number"
              step="0.1"
              value={filters.maxChange}
              onChange={(e) => updateFilter("maxChange", e.target.value)}
              className="h-7 text-[11px]"
              placeholder="10"
            />
          </div>

          <div>
            <label className="mb-1 block text-[9px] uppercase text-muted-foreground">
              {t("screener.minTurnover")}
            </label>
            <Input
              type="number"
              value={filters.minTurnover}
              onChange={(e) => updateFilter("minTurnover", e.target.value)}
              className="h-7 text-[11px]"
              placeholder="0"
            />
          </div>

          <div>
            <label className="mb-1 block text-[9px] uppercase text-muted-foreground">
              {t("screener.minDividend")}
            </label>
            <Input
              type="number"
              step="0.1"
              value={filters.minDividend}
              onChange={(e) => updateFilter("minDividend", e.target.value)}
              className="h-7 text-[11px]"
              placeholder="0"
            />
          </div>

          <div>
            <label className="mb-1 block text-[9px] uppercase text-muted-foreground">
              {t("screener.maxDividend")}
            </label>
            <Input
              type="number"
              step="0.1"
              value={filters.maxDividend}
              onChange={(e) => updateFilter("maxDividend", e.target.value)}
              className="h-7 text-[11px]"
              placeholder="10"
            />
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-[10px] text-muted-foreground">
        {t("screener.results", { count: results.length, total: stocks?.length ?? 0 })}
      </div>

      {/* Results table */}
      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="py-2 pl-3 pr-1 text-left font-medium">
                {t("table.ticker")}
              </th>
              <th className="px-1 py-2 text-left font-medium">
                <SortHeader
                  column="name"
                  label={t("table.name")}
                  sort={sort}
                  onSort={handleSort}
                />
              </th>
              <th className="px-1 py-2 text-left font-medium">
                {t("table.sector")}
              </th>
              <th className="px-1 py-2 text-right font-medium">
                <SortHeader
                  column="price"
                  label={t("table.price")}
                  sort={sort}
                  onSort={handleSort}
                />
              </th>
              <th className="px-1 py-2 text-right font-medium">
                <SortHeader
                  column="changePct"
                  label={t("table.change")}
                  sort={sort}
                  onSort={handleSort}
                />
              </th>
              <th className="hidden px-1 py-2 text-right font-medium lg:table-cell">
                <SortHeader
                  column="turnover"
                  label={t("table.turnover")}
                  sort={sort}
                  onSort={handleSort}
                />
              </th>
              <th className="hidden px-1 py-2 text-right font-medium lg:table-cell">
                {t("table.dividendYield")}
              </th>
              <th className="hidden px-1 py-2 text-right font-medium lg:table-cell">
                <SortHeader
                  column="volume"
                  label={t("table.volume")}
                  sort={sort}
                  onSort={handleSort}
                />
              </th>
            </tr>
          </thead>
          <tbody>
            {results.map((s) => (
              <tr
                key={s.ticker}
                className="border-b border-border/50 last:border-b-0 hover:bg-accent/50"
              >
                <td className="px-3 py-2 font-data font-semibold text-foreground">
                  {s.ticker}
                </td>
                <td className="px-1 py-2 text-muted-foreground">{s.name}</td>
                <td className="px-1 py-2">
                  <span className="rounded-sm bg-accent px-1.5 py-0.5 text-[10px]">
                    {s.sector}
                  </span>
                </td>
                <td className="px-1 py-2 text-right font-data tabular-nums text-foreground">
                  {formatPrice(s.price)}
                </td>
                <td className="px-1 py-2 text-right">
                  <ChangeBadge value={s.changePct} showIcon={false} />
                </td>
                <td className="hidden px-1 py-2 text-right font-data tabular-nums text-muted-foreground lg:table-cell">
                  {formatVolume(s.turnover)} EUR
                </td>
                <td className="hidden px-1 py-2 text-right font-data tabular-nums text-muted-foreground lg:table-cell">
                  {s.dividendYield !== null ? `${s.dividendYield.toFixed(1)}%` : "—"}
                </td>
                <td className="hidden px-1 py-2 text-right font-data tabular-nums text-muted-foreground lg:table-cell">
                  {formatVolume(s.volume)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {results.length === 0 && (
          <div className="py-8 text-center text-xs text-muted-foreground">
            {t("screener.noResults")}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Filter, RotateCcw } from "lucide-react";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChangeBadge } from "@/components/shared/change-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatVolume } from "@/lib/formatters";

interface ScreenerFilters {
  sector: string;
  minPrice: string;
  maxPrice: string;
  minChange: string;
  maxChange: string;
  minTurnover: string;
}

const INITIAL_FILTERS: ScreenerFilters = {
  sector: "",
  minPrice: "",
  maxPrice: "",
  minChange: "",
  maxChange: "",
  minTurnover: "",
};

export function StockScreener() {
  const { t } = useTranslation("stocks");
  const { data: stocks, isLoading } = useStocksLive();
  const [filters, setFilters] = useState<ScreenerFilters>(INITIAL_FILTERS);

  const sectors = useMemo(() => {
    if (!stocks) return [];
    return [...new Set(stocks.map((s) => s.sector))].sort();
  }, [stocks]);

  const results = useMemo(() => {
    if (!stocks) return [];

    return stocks.filter((s) => {
      if (filters.sector && s.sector !== filters.sector) return false;
      if (filters.minPrice && s.price < parseFloat(filters.minPrice)) return false;
      if (filters.maxPrice && s.price > parseFloat(filters.maxPrice)) return false;
      if (filters.minChange && s.changePct < parseFloat(filters.minChange)) return false;
      if (filters.maxChange && s.changePct > parseFloat(filters.maxChange)) return false;
      if (filters.minTurnover && s.turnover < parseFloat(filters.minTurnover)) return false;
      return true;
    });
  }, [stocks, filters]);

  const updateFilter = (key: keyof ScreenerFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-3">
      {/* Filter bar */}
      <div className="rounded-md border border-border bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Filter className="h-3 w-3" />
            Filters
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFilters(INITIAL_FILTERS)}
            className="h-6 text-[10px]"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-6">
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
            <label className="mb-1 block text-[9px] uppercase text-muted-foreground">Min Price</label>
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
            <label className="mb-1 block text-[9px] uppercase text-muted-foreground">Max Price</label>
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
            <label className="mb-1 block text-[9px] uppercase text-muted-foreground">Min Change %</label>
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
            <label className="mb-1 block text-[9px] uppercase text-muted-foreground">Max Change %</label>
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
            <label className="mb-1 block text-[9px] uppercase text-muted-foreground">Min Turnover</label>
            <Input
              type="number"
              value={filters.minTurnover}
              onChange={(e) => updateFilter("minTurnover", e.target.value)}
              className="h-7 text-[11px]"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-[10px] text-muted-foreground">
        {results.length} results from {stocks?.length ?? 0} stocks
      </div>

      {/* Results table */}
      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 text-left font-medium">{t("table.ticker")}</th>
              <th className="px-3 py-2 text-left font-medium">{t("table.name")}</th>
              <th className="px-3 py-2 text-left font-medium">{t("table.sector")}</th>
              <th className="px-3 py-2 text-right font-medium">{t("table.price")}</th>
              <th className="px-3 py-2 text-right font-medium">{t("table.change")}</th>
              <th className="hidden px-3 py-2 text-right font-medium lg:table-cell">{t("table.turnover")}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((s) => (
              <tr key={s.ticker} className="border-b border-border/50 last:border-b-0 hover:bg-accent/50">
                <td className="px-3 py-2 font-data font-semibold text-foreground">{s.ticker}</td>
                <td className="px-3 py-2 text-muted-foreground">{s.name}</td>
                <td className="px-3 py-2">
                  <span className="rounded-sm bg-accent px-1.5 py-0.5 text-[10px]">{s.sector}</span>
                </td>
                <td className="px-3 py-2 text-right font-data tabular-nums text-foreground">{formatPrice(s.price)}</td>
                <td className="px-3 py-2 text-right"><ChangeBadge value={s.changePct} showIcon={false} /></td>
                <td className="hidden px-3 py-2 text-right font-data tabular-nums text-muted-foreground lg:table-cell">
                  {formatVolume(s.turnover)} EUR
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {results.length === 0 && (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No stocks match the filters
          </div>
        )}
      </div>
    </div>
  );
}

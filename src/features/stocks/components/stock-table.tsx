import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Search, ArrowUpDown, ArrowUp, ArrowDown, Download, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StockRow } from "@/features/stocks/components/stock-row";
import { StockTableSkeleton } from "./stock-table-skeleton";
import { LiveDataIndicator } from "@/components/shared/live-data-indicator";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { usePriceFlash } from "@/hooks/use-price-flash";
import { useDebounce } from "@/hooks/use-debounce";
import { useSubscription } from "@/features/premium/hooks/use-subscription";
import { exportToCsv } from "@/lib/export";
import { EmptyState } from "@/components/shared/empty-state";

type SortField = "ticker" | "price" | "changePct" | "turnover" | "volume";
type SortDir = "asc" | "desc";

export function StockTable() {
  const { t } = useTranslation("stocks");
  const { t: tc } = useTranslation("common");
  const { data: result, isLoading, dataUpdatedAt, isFetching } = useStocksLive();
  const stocks = result?.stocks ?? null;
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("changePct");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const flashMap = usePriceFlash(stocks);
  const debouncedSearch = useDebounce(search, 200);

  const filtered = useMemo(() => {
    if (!stocks) return [];

    let result = stocks;

    // Filter
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (s) =>
          s.ticker.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          s.isin.toLowerCase().includes(q),
      );
    }

    // Sort
    result = [...result].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      const diff = (aVal as number) - (bVal as number);
      return sortDir === "asc" ? diff : -diff;
    });

    return result;
  }, [stocks, debouncedSearch, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "ticker" ? "asc" : "desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />;
    return sortDir === "asc" ? (
      <ArrowUp className="h-3 w-3 text-foreground" />
    ) : (
      <ArrowDown className="h-3 w-3 text-foreground" />
    );
  };

  const { canAccess } = useSubscription();

  const handleExport = () => {
    if (!filtered.length) return;
    exportToCsv(
      `zse-stocks-${new Date().toISOString().slice(0, 10)}`,
      ["Ticker", "Name", "Sector", "Price", "Change %", "Volume", "Turnover"],
      filtered.map((s) => [
        s.ticker,
        s.name,
        s.sector,
        s.price.toString(),
        s.changePct.toString(),
        s.volume.toString(),
        s.turnover.toString(),
      ]),
    );
  };

  if (isLoading) return <StockTableSkeleton />;

  return (
    <div className="flex flex-col gap-2">
      {/* Search + Export */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            aria-label={t("table.ticker") + " " + t("table.name")}
            placeholder={t("table.ticker") + ", " + t("table.name") + "..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <LiveDataIndicator
          updatedAt={dataUpdatedAt}
          isFetching={isFetching}
        />
        {canAccess("dataExport") && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            title="Export CSV"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-auto rounded-md border border-border max-h-[70vh]">
        <table aria-label={t("table.label")} className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
            <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
              <ColumnHeader
                field="ticker"
                label={t("table.ticker")}
                onClick={toggleSort}
                sortIcon={<SortIcon field="ticker" />}
                className="w-28 text-left"
                currentField={sortField}
                currentDir={sortDir}
              />
              <th className="hidden px-3 py-2 text-left font-medium md:table-cell">
                {t("table.name")}
              </th>
              <ColumnHeader
                field="price"
                label={t("table.price")}
                onClick={toggleSort}
                sortIcon={<SortIcon field="price" />}
                className="w-24 text-right"
                currentField={sortField}
                currentDir={sortDir}
              />
              <ColumnHeader
                field="changePct"
                label={t("table.change")}
                onClick={toggleSort}
                sortIcon={<SortIcon field="changePct" />}
                className="w-24 text-right"
                currentField={sortField}
                currentDir={sortDir}
              />
              <ColumnHeader
                field="volume"
                label={t("table.volume")}
                onClick={toggleSort}
                sortIcon={<SortIcon field="volume" />}
                className="hidden w-24 text-right lg:table-cell"
                currentField={sortField}
                currentDir={sortDir}
              />
              <ColumnHeader
                field="turnover"
                label={t("table.turnover")}
                onClick={toggleSort}
                sortIcon={<SortIcon field="turnover" />}
                className="hidden w-28 text-right lg:table-cell"
                currentField={sortField}
                currentDir={sortDir}
              />
            </tr>
          </thead>
          <tbody>
            {filtered.map((stock) => (
              <StockRow
                key={stock.ticker}
                stock={stock}
                flash={flashMap.get(stock.ticker) ?? null}
                searchQuery={debouncedSearch}
              />
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          debouncedSearch ? (
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title={t("noResults")}
              description={tc("empty.noResultsDescription")}
              action={{ label: tc("empty.clearFilters"), onClick: () => setSearch("") }}
            />
          ) : (
            <EmptyState
              icon={<TrendingUp className="h-8 w-8" />}
              title={t("noStocks")}
              description={tc("empty.noDataDescription")}
            />
          )
        )}
      </div>

      <div className="text-[10px] text-muted-foreground">
        {filtered.length} / {stocks?.length ?? 0} stocks
      </div>
    </div>
  );
}

interface ColumnHeaderProps {
  field: SortField;
  label: string;
  onClick: (field: SortField) => void;
  sortIcon: React.ReactNode;
  className?: string;
  currentField: SortField;
  currentDir: SortDir;
}

function ColumnHeader({
  field,
  label,
  onClick,
  sortIcon,
  className,
  currentField,
  currentDir,
}: ColumnHeaderProps) {
  const sortDirection: "ascending" | "descending" | "none" =
    currentField === field
      ? currentDir === "asc"
        ? "ascending"
        : "descending"
      : "none";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick(field);
    }
  };

  return (
    <th
      aria-sort={sortDirection}
      className={`cursor-pointer px-3 py-2 font-medium ${className ?? ""}`}
    >
      <button
        className="inline-flex items-center gap-1"
        onClick={() => onClick(field)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="columnheader"
        aria-label={`${label}: ${sortDirection === "none" ? "unsorted" : sortDirection + ","} click to sort`}
      >
        {label}
        {sortIcon}
      </button>
    </th>
  );
}



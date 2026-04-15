import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Star, Search, ArrowUp, ArrowDown, ArrowUpDown, GripVertical, Download, X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useLocalWatchlist } from "@/features/watchlist/hooks/use-local-watchlist";
import { useWatchlistItems } from "@/features/watchlist/api/watchlist-queries";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { useSelectedStock } from "@/hooks/use-selected-stock";
import { usePriceFlash } from "@/hooks/use-price-flash";
import { WatchlistToggle } from "@/features/watchlist/components/watchlist-toggle";
import { WatchlistSkeleton } from "@/features/watchlist/components/watchlist-skeleton";
import { ChangeBadge } from "@/components/shared/change-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatPrice, formatVolume } from "@/lib/formatters";
import { exportToCsv } from "@/lib/export";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Stock } from "@/types/stock";

type SortColumn = keyof Pick<Stock, "price" | "changePct" | "turnover" | "volume" | "name" | "sector">;
type SortDirection = "asc" | "desc";
type ChangeFilter = "all" | "gainers" | "losers" | "unchanged";
type SectorFilter = string | null;

const changeFilters: { value: ChangeFilter; labelKey: string; icon: typeof TrendingUp }[] = [
  { value: "all", labelKey: "filters.all", icon: TrendingUp },
  { value: "gainers", labelKey: "filters.gainers", icon: TrendingUp },
  { value: "losers", labelKey: "filters.losers", icon: TrendingDown },
  { value: "unchanged", labelKey: "filters.unchanged", icon: Minus },
];

function getUniqueSectors(stocks: Stock[]): string[] {
  const sectors = new Set(stocks.map((s) => s.sector).filter(Boolean));
  return Array.from(sectors).sort();
}

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
      className="flex items-center gap-1 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background rounded-sm"
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
  const { data: stocksResult, isError, refetch } = useStocksLive();
  const stocks = useMemo(() => stocksResult?.stocks ?? [], [stocksResult]);
  const [search, setSearch] = useState("");
  const [changeFilter, setChangeFilter] = useState<ChangeFilter>("all");
  const [sectorFilter, setSectorFilter] = useState<SectorFilter>(null);
  const [sort, setSort] = useState<{ column: SortColumn; direction: SortDirection } | null>({
    column: "turnover",
    direction: "desc",
  });
  const debouncedSearch = useDebounce(search, 200);

  const watchedStocks = useMemo(() => {
    const tickers = new Set(watchlistItems.data?.map((i) => i.ticker) ?? []);
    return stocks.filter((s) => tickers.has(s.ticker));
  }, [stocks, watchlistItems.data]);

  // Compute unique sectors from watched stocks
  const availableSectors = useMemo(() => getUniqueSectors(watchedStocks), [watchedStocks]);

  const filtered = useMemo(() => {
    let result = watchedStocks;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (s) =>
          s.ticker.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q),
      );
    }
    // Apply sector filter
    if (sectorFilter) {
      result = result.filter((s) => s.sector === sectorFilter);
    }
    // Apply change direction filter
    if (changeFilter !== "all") {
      result = result.filter((s) => {
        if (changeFilter === "gainers") return s.changePct > 0;
        if (changeFilter === "losers") return s.changePct < 0;
        return s.changePct === 0;
      });
    }
    if (!sort) return result;
    return [...result].sort((a, b) => {
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
  }, [watchedStocks, debouncedSearch, sectorFilter, changeFilter, sort]);

  const handleSort = (col: SortColumn) => {
    setSort((prev) => {
      if (prev?.column !== col) return { column: col, direction: "desc" };
      if (prev.direction === "desc") return { column: col, direction: "asc" };
      return null;
    });
  };

  const handleExportCsv = () => {
    const headers = ["Ticker", "Name", "Sector", "Price (EUR)", "Change (%)", "Volume", "Turnover (EUR)", "Dividend Yield (%)"];
    const rows = filtered.map((s) => [
      s.ticker,
      s.name,
      s.sector,
      s.price.toFixed(2),
      s.changePct.toFixed(2),
      s.volume.toString(),
      s.turnover.toFixed(2),
      s.dividendYield ? s.dividendYield.toFixed(2) : "",
    ]);
    exportToCsv(`zse-watchlist-${new Date().toISOString().split("T")[0]}`, headers, rows);
    toast.success(t("toast.exported"));
  };

  if (watchlistItems.isLoading) {
    return <WatchlistSkeleton />;
  }

  if (isError) {
    return (
      <ErrorState
        title={tc("errors.generic")}
        description={tc("errors.network")}
        retry={{ onRetry: refetch, label: tc("errors.tryAgain") }}
      />
    );
  }

  const handleClearSearch = () => setSearch("");

  return (
    <div className="flex flex-col gap-3">
      {/* Search + CSV */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={tc("actions.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-8"
          />
          {search && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              title={tc("actions.clear")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleExportCsv}
          disabled={filtered.length === 0}
          title={t("exportCsv")}
        >
          <Download className="h-3.5 w-3.5" />
          CSV
        </Button>
      </div>

      {/* Quick filters: change direction + sector */}
      <div className="flex gap-1.5 flex-wrap">
        {changeFilters.map(({ value, labelKey, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setChangeFilter(value)}
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              changeFilter === value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted",
            )}
          >
            <Icon className="h-3 w-3" />
            <span className="hidden sm:inline">{t(labelKey)}</span>
          </button>
        ))}
        {/* Sector filter dropdown */}
        {availableSectors.length > 0 && (
          <select
            value={sectorFilter ?? ""}
            onChange={(e) => setSectorFilter(e.target.value || null)}
            className={cn(
              "rounded-full px-2.5 py-1 text-[10px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
              sectorFilter
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted",
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
      </div>

      {/* Results count */}
      {watchedStocks.length > 0 && (
        <div className="text-[10px] text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "stock" : "stockova"}
        </div>
      )}

      {filtered.length > 0 ? (
        <WatchlistTable stocks={filtered} sort={sort} onSort={handleSort} />
      ) : debouncedSearch ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title={tc("empty.noResults")}
          description={tc("empty.noResultsDescription")}
          action={{ label: tc("empty.clearFilters"), onClick: () => setSearch("") }}
          variant="no-results"
        />
      ) : (
        <EmptyState
          icon={<Star className="h-8 w-8" />}
          title={t("empty")}
          description={t("emptyDescription")}
          action={{ label: t("browseAction"), onClick: () => { window.location.href = "/"; } }}
          hint={t("emptyHint")}
        />
      )}
    </div>
  );
}

function SortableRow({
  stock,
  showRemove,
  onRemove,
  flash,
}: {
  stock: Stock;
  showRemove?: boolean;
  onRemove?: (ticker: string) => void;
  flash?: "up" | "down" | null;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stock.ticker });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : "auto",
  };

  const { select, selectedTicker } = useSelectedStock();
  const isSelected = selectedTicker === stock.ticker;

  return (
    <tr
      ref={setNodeRef}
      style={style}
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
        isDragging && "bg-muted",
        flash === "up" && "price-flash-up",
        flash === "down" && "price-flash-down",
      )}
    >
      <td className="px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab rounded-sm p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
            title="Drag to reorder"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </button>
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
      <td className="hidden px-3 py-2 lg:table-cell">
        <span className="text-xs text-muted-foreground">{stock.sector || "-"}</span>
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

function LocalWatchlist() {
  const { t } = useTranslation("watchlist");
  const { t: tc } = useTranslation("common");
  const { items, removeItem, reorder: reorderItems } = useLocalWatchlist();
  const { data: stocksResult, isError, refetch } = useStocksLive();
  const stocks = useMemo(() => stocksResult?.stocks ?? [], [stocksResult]);
  const [search, setSearch] = useState("");
  const [changeFilter, setChangeFilter] = useState<ChangeFilter>("all");
  const [sort, setSort] = useState<{ column: SortColumn; direction: SortDirection } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 200);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.ticker === active.id);
    const newIndex = items.findIndex((i) => i.ticker === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderItems(arrayMove(items, oldIndex, newIndex));
    }
  };

  const watchedStocks = useMemo(() => {
    const tickerSet = new Set(items.map((i) => i.ticker));
    return stocks.filter((s) => tickerSet.has(s.ticker));
  }, [stocks, items]);

  const filtered = useMemo(() => {
    let result = watchedStocks;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (s) =>
          s.ticker.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q),
      );
    }
    // Apply change direction filter before sorting
    if (changeFilter !== "all") {
      result = result.filter((s) => {
        if (changeFilter === "gainers") return s.changePct > 0;
        if (changeFilter === "losers") return s.changePct < 0;
        return s.changePct === 0;
      });
    }
    if (!sort) return result;
    return [...result].sort((a, b) => {
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
  }, [watchedStocks, debouncedSearch, changeFilter, sort]);

  const handleSort = (col: SortColumn) => {
    setSort((prev) => {
      if (prev?.column !== col) return { column: col, direction: "desc" };
      if (prev.direction === "desc") return { column: col, direction: "asc" };
      return null;
    });
  };

  const handleExportCsv = () => {
    const headers = ["Ticker", "Name", "Sector", "Price (EUR)", "Change (%)", "Volume", "Turnover (EUR)", "Dividend Yield (%)"];
    const rows = filtered.map((s) => [
      s.ticker,
      s.name,
      s.sector,
      s.price.toFixed(2),
      s.changePct.toFixed(2),
      s.volume.toString(),
      s.turnover.toFixed(2),
      s.dividendYield ? s.dividendYield.toFixed(2) : "",
    ]);
    exportToCsv(`zse-watchlist-${new Date().toISOString().split("T")[0]}`, headers, rows);
    toast.success(t("toast.exported"));
  };

  if (isError) {
    return (
      <ErrorState
        title={tc("errors.generic")}
        description={tc("errors.network")}
        retry={{ onRetry: refetch, label: tc("errors.tryAgain") }}
      />
    );
  }

  if (!stocksResult) {
    return <WatchlistSkeleton />;
  }

  const handleClearSearch = () => setSearch("");

  return (
    <div className="flex flex-col gap-3">
      {/* Search + CSV */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={tc("actions.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-8"
          />
          {search && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              title={tc("actions.clear")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleExportCsv}
          disabled={filtered.length === 0}
          title={t("exportCsv")}
        >
          <Download className="h-3.5 w-3.5" />
          CSV
        </Button>
      </div>

      {/* Quick filters: gainers / losers / unchanged */}
      <div className="flex gap-1.5 flex-wrap">
        {changeFilters.map(({ value, labelKey, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setChangeFilter(value)}
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all",
              changeFilter === value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted/60 text-muted-foreground hover:bg-muted",
            )}
          >
            <Icon className="h-3 w-3" />
            <span className="hidden sm:inline">{t(labelKey)}</span>
          </button>
        ))}
      </div>

      {/* Results count */}
      {items.length > 0 && (
        <div className="text-[10px] text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? "stock" : "stockova"}
        </div>
      )}

      {filtered.length > 0 ? (
        // Only enable drag-drop when not filtering (preserves actual watchlist order)
        !debouncedSearch && items.length > 1 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filtered.map((s) => s.ticker)}
              strategy={verticalListSortingStrategy}
            >
              <WatchlistTable
                stocks={filtered}
                sort={sort}
                onSort={handleSort}
                showRemove
                onRemove={(ticker) => setConfirmRemove(ticker)}
                dragEnabled
              />
            </SortableContext>
          </DndContext>
        ) : (
          <WatchlistTable
            stocks={filtered}
            sort={sort}
            onSort={handleSort}
            showRemove
            onRemove={(ticker) => setConfirmRemove(ticker)}
            dragEnabled={false}
          />
        )
      ) : debouncedSearch ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title={tc("empty.noResults")}
          description={tc("empty.noResultsDescription")}
          action={{ label: tc("empty.clearFilters"), onClick: () => setSearch("") }}
          variant="no-results"
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
          hint={t("emptyHint")}
        />
      ) : (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title={tc("empty.noResults")}
          description={tc("empty.noResultsDescription")}
          action={{ label: tc("empty.clearFilters"), onClick: () => setSearch("") }}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        open={!!confirmRemove}
        onOpenChange={(open) => !open && setConfirmRemove(null)}
        title={t("confirmRemove") || "Remove from watchlist?"}
        description={
          confirmRemove
            ? t("confirmRemoveDescription")?.replace("{ticker}", confirmRemove) ?? `Remove ${confirmRemove} from your watchlist?`
            : ""
        }
        confirmLabel={tc("actions.delete") || "Remove"}
        cancelLabel={tc("actions.cancel") || "Cancel"}
        variant="danger"
        onConfirm={() => {
          if (confirmRemove) {
            removeItem(confirmRemove);
            toast.success(t("toast.removed") || "Removed from watchlist");
          }
        }}
      />
    </div>
  );
}

interface WatchlistTableProps {
  stocks: Stock[];
  showRemove?: boolean;
  onRemove?: (ticker: string) => void;
  sort: { column: SortColumn; direction: SortDirection } | null;
  onSort: (col: SortColumn) => void;
  dragEnabled?: boolean;
}

function WatchlistTable({ stocks, showRemove, onRemove, sort, onSort, dragEnabled }: WatchlistTableProps) {
  const { t } = useTranslation("watchlist");
  const flashMap = usePriceFlash(stocks);
  return (
    <div className="overflow-auto rounded-md border border-border max-h-[60vh]">
      <table className="w-full text-xs">
        <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
          <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="px-3 py-2 text-left font-medium">{t("table.ticker")}</th>
            <th className="hidden px-3 py-2 text-left font-medium md:table-cell">
              <SortHeader column="name" label={t("table.name")} sort={sort} onSort={onSort} />
            </th>
            <th className="hidden px-3 py-2 text-left font-medium lg:table-cell">
              <SortHeader column="sector" label={t("table.sector")} sort={sort} onSort={onSort} />
            </th>
            <th className="px-3 py-2 text-right font-medium">
              <SortHeader column="price" label={t("table.price")} sort={sort} onSort={onSort} />
            </th>
            <th className="px-3 py-2 text-right font-medium">
              <SortHeader column="changePct" label={t("table.change")} sort={sort} onSort={onSort} />
            </th>
            <th className="hidden px-3 py-2 text-right font-medium lg:table-cell">
              <SortHeader column="volume" label={t("table.volume")} sort={sort} onSort={onSort} />
            </th>
            <th className="hidden px-3 py-2 text-right font-medium lg:table-cell">
              <SortHeader column="turnover" label={t("table.turnover")} sort={sort} onSort={onSort} />
            </th>
            {showRemove && <th className="w-10" />}
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) =>
            dragEnabled ? (
              <SortableRow
                key={stock.ticker}
                stock={stock}
                showRemove={showRemove}
                onRemove={onRemove}
                flash={flashMap.get(stock.ticker) ?? null}
              />
            ) : (
              <WatchlistRow
                key={stock.ticker}
                stock={stock}
                showRemove={showRemove}
                onRemove={onRemove}
                flash={flashMap.get(stock.ticker) ?? null}
              />
            )
          )}
        </tbody>
      </table>
    </div>
  );
}

interface WatchlistRowProps {
  stock: Stock;
  showRemove?: boolean;
  onRemove?: (ticker: string) => void;
  flash?: "up" | "down" | null;
}

function WatchlistRow({ stock, showRemove, onRemove, flash }: WatchlistRowProps) {
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
        flash === "up" && "price-flash-up",
        flash === "down" && "price-flash-down",
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
      <td className="hidden px-3 py-2 lg:table-cell">
        <span className="text-xs text-muted-foreground">{stock.sector || "-"}</span>
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

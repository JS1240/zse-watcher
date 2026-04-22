import { useMemo, useState, useRef, useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import { Star, Search, Keyboard, ArrowUp, ArrowDown, ArrowUpDown, GripVertical, Download, X, TrendingUp, TrendingDown, Minus, CheckCircle2, ChevronUp, HelpCircle } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useLocalWatchlist } from "@/features/watchlist/hooks/use-local-watchlist";
import { useWatchlistItems } from "@/features/watchlist/api/watchlist-queries";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { LiveDataIndicator } from "@/components/shared/live-data-indicator";
import { useSelectedStock } from "@/hooks/use-selected-stock";
import { usePriceFlash } from "@/hooks/use-price-flash";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { WatchlistToggle } from "@/features/watchlist/components/watchlist-toggle";
import { WatchlistSkeleton } from "@/features/watchlist/components/watchlist-skeleton";
import { ChangeBadge } from "@/components/shared/change-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { WatchlistEmptyIllustration } from "@/components/shared/empty-illustrations";
import { ErrorState } from "@/components/shared/error-state";
import { Highlight } from "@/components/shared/highlight";
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
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
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

type SortColumn = keyof Pick<Stock, "price" | "changePct" | "turnover" | "volume" | "name" | "sector" | "dividendYield">;
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
  tooltip,
}: {
  column: SortColumn;
  label: string;
  sort: { column: SortColumn; direction: SortDirection } | null;
  onSort: (col: SortColumn) => void;
  tooltip?: string;
}) {
  const isActive = sort?.column === column;
  const direction = isActive ? sort.direction : null;
  const sortDirection = isActive
    ? direction === "asc"
      ? "ascending"
      : "descending"
    : "none";

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSort(column);
    }
  };

  const headerContent = (
    <button
      onClick={() => onSort(column)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="columnheader"
      aria-sort={sortDirection}
      aria-label={`${label}: ${sortDirection === "none" ? "unsorted" : sortDirection}, click to sort`}
      className="flex items-center gap-1 transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background rounded-sm"
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

  // Only wrap with tooltip if tooltip text is provided
  if (!tooltip) {
    return <>{headerContent}</>;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help">{headerContent}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
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
  const { data: stocksResult, isError, refetch, dataUpdatedAt, isFetching } = useStocksLive();
  const stocks = useMemo(() => stocksResult?.stocks ?? [], [stocksResult]);
  const [search, setSearch] = useState("");
  const [changeFilter, setChangeFilter] = useState<ChangeFilter>("all");
  const [sectorFilter, setSectorFilter] = useState<SectorFilter>(null);
  const [sort, setSort] = useState<{ column: SortColumn; direction: SortDirection } | null>({
    column: "turnover",
    direction: "desc",
  });
  const debouncedSearch = useDebounce(search, 200);

  // Keyboard shortcut to focus search
  const searchInputRef = useRef<HTMLInputElement>(null);
  const focusSearch = useCallback(() => searchInputRef.current?.focus(), []);
  useKeyboardShortcut({ key: "/", handler: focusSearch, enabled: true });

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
    const headers = ["Ticker", "Name", "Sector", "Price (EUR)", "Change (%)", "Volume", "Turnover (EUR)", "Dividend Yield (%)", "P/E Ratio", "Market Cap (MEUR)"];
    const rows = filtered.map((s) => [
      s.ticker,
      s.name,
      s.sector,
      s.price.toFixed(2),
      s.changePct.toFixed(2),
      s.volume.toString(),
      s.turnover.toFixed(2),
      s.dividendYield ? s.dividendYield.toFixed(2) : "",
      (s as any).peRatio ? (s as any).peRatio.toFixed(2) : "",
      (s as any).marketCapM ? (s as any).marketCapM.toFixed(1) : "",
    ]);
    exportToCsv(`zse-watchlist-${new Date().toISOString().split("T")[0]}`, headers, rows);
    toast.success(t("toast.exported"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
  };

  // Loading and error states (conditional render instead of early return for React hooks compliance)
  const isLoading = watchlistItems.isLoading;
  const showError = isError;

  // Count active filters for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (debouncedSearch) count++;
    if (sectorFilter) count++;
    if (changeFilter !== "all") count++;
    return count;
  }, [debouncedSearch, sectorFilter, changeFilter]);

  const handleClearSearch = () => setSearch("");
  const handleClearFilters = () => {
    setSearch("");
    setChangeFilter("all");
    setSectorFilter(null);
  };

  // Track focus for search input accessibility
  const [searchFocused, setSearchFocused] = useState(false);

  // Render loading skeleton or error state
  if (isLoading) {
    return <WatchlistSkeleton />;
  }

  if (showError) {
    return (
      <ErrorState
        title={tc("errors.generic")}
        description={tc("errors.network")}
        retry={{ onRetry: refetch, label: tc("errors.tryAgain") }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search + filters badge + CSV */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={tc("actions.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={`pl-8 pr-14 transition-shadow ${searchFocused ? "ring-2 ring-ring ring-offset-1 ring-offset-background" : ""}`}
          />
          {!search && watchedStocks.length > 0 && (
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
              <Keyboard className="h-2.5 w-2.5" />
              /
            </span>
          )}
          {search && (
            <button
              onClick={handleClearSearch}
              className="absolute right-8 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              title={tc("actions.clear")}
              aria-label={tc("actions.clear")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {/* Active filters badge */}
        {activeFilterCount > 0 && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1.5 text-[10px] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-destructive"
            title={tc("actions.clear")}
            aria-label={`${activeFilterCount} ${tc("actions.clear")}`}
          >
            {activeFilterCount}
            <X className="h-3 w-3" />
          </button>
        )}
        <LiveDataIndicator
          updatedAt={dataUpdatedAt}
          isFetching={isFetching}
        />
        {/* Results count badge */}
        {filtered.length > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {filtered.length}
            <span className="text-[9px]">rezultat{filtered.length !== 1 ? "a" : ""}</span>
          </span>
        )}
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
              "flex h-11 min-w-11 items-center gap-1 rounded-full px-2.5 py-2 text-[10px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
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

      {/* Results count + keyboard shortcuts hint */}
      {watchedStocks.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "stock" : "stockova"}
            {debouncedSearch && (
              <span className="ml-1 text-muted-foreground/60">
                / {watchedStocks.length}
              </span>
            )}
          </span>
          {/* Keyboard shortcuts hint - always visible with tooltip for discoverability */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex items-center gap-1.5 text-[9px] text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Keyboard shortcuts"
              >
                <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Enter</kbd>
                <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">W</kbd>
                <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Del</kbd>
                <HelpCircle className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end" className="space-y-1 p-2.5">
              <p className="text-[10px] font-semibold text-foreground">{t("shortcuts") || "Tipkovnički prečaci"}</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[9px]">
                <kbd className="rounded bg-muted px-1.5 py-0.5 text-[8px] font-sans">Enter</kbd>
                <span className="text-muted-foreground">{t("shortcut.details") || "detalji dionice"}</span>
                <kbd className="rounded bg-muted px-1.5 py-0.5 text-[8px] font-sans">W</kbd>
                <span className="text-muted-foreground">{t("shortcut.toggle") || "dodaj/ukloni iz pratnje"}</span>
                <kbd className="rounded bg-muted px-1.5 py-0.5 text-[8px] font-sans">Del</kbd>
                <span className="text-muted-foreground">{t("shortcut.delete") || "ukloni iz pratnje"}</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {filtered.length > 0 ? (
        <WatchlistTableMemo stocks={filtered} sort={sort} onSort={handleSort} searchQuery={debouncedSearch} />
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
          icon={<WatchlistEmptyIllustration className="h-10 w-10" />}
          title={t("empty")}
          description={t("emptyDescription")}
          steps={[
            { label: t("emptyHints.step1"), description: t("emptyHints.step2") },
            { label: t("emptyHints.step3"), description: "" },
          ]}
          action={{ label: t("browseAction"), onClick: () => { window.location.href = "/"; } }}
          variant="action"
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
  searchQuery,
}: {
  stock: Stock;
  showRemove?: boolean;
  onRemove?: (ticker: string) => void;
  flash?: "up" | "down" | null;
  searchQuery?: string;
}) {
  const { t } = useTranslation("watchlist");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: stock.ticker });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : "auto",
  };

  const { select, selectedTicker } = useSelectedStock();
  const isSelected = selectedTicker === stock.ticker;
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyTicker = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(stock.ticker);
    toast.success(t("toast.copied", { ticker: stock.ticker }));
    setCopiedField("ticker");
    setTimeout(() => setCopiedField(null), 1200);
  }, [stock.ticker, t]);

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
        "group cursor-pointer border-b border-border/50 transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/50 hover:shadow-md",
        "last:border-b-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "border-l-2 border-l-primary bg-accent/30",
        isDragging && "bg-muted opacity-75",
        isOver && !isDragging && "border-l-2 border-l-primary/50 bg-primary/5",
        flash === "up" && "price-flash-up",
        flash === "down" && "price-flash-down",
      )}
    >
      <td className="sticky left-0 z-[1] bg-card shadow-[2px_0_4px_hsl(var(--border))] px-3 py-2">
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
          <button
            type="button"
            onClick={handleCopyTicker}
            className={cn(
              "font-data text-xs font-semibold text-foreground",
              "cursor-pointer transition-colors hover:text-primary",
              copiedField === "ticker" && "text-primary",
            )}
            title="Click to copy ticker"
          >
            <Highlight text={stock.ticker} highlight={searchQuery ?? ""} />
          </button>
        </div>
      </td>
      <td className="hidden px-3 py-2 md:table-cell">
        <span className="truncate text-xs text-muted-foreground">
          <Highlight text={stock.name} highlight={searchQuery ?? ""} />
        </span>
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
      <td className="hidden px-3 py-2 text-right xl:table-cell">
        <span className="font-data text-xs tabular-nums text-muted-foreground">
          {stock.dividendYield !== null && stock.dividendYield !== undefined
            ? `${stock.dividendYield.toFixed(1)}%`
            : "—"}
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
  const { data: stocksResult, isError, refetch, dataUpdatedAt, isFetching } = useStocksLive();
  const stocks = useMemo(() => stocksResult?.stocks ?? [], [stocksResult]);
  const [search, setSearch] = useState("");
  const [changeFilter, setChangeFilter] = useState<ChangeFilter>("all");
  const [sectorFilter, setSectorFilter] = useState<SectorFilter>(null);
  const [sort, setSort] = useState<{ column: SortColumn; direction: SortDirection } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [activeDragItem, setActiveDragItem] = useState<Stock | null>(null);
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
    setActiveDragItem(null);
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.ticker === active.id);
    const newIndex = items.findIndex((i) => i.ticker === over.id);
    if (oldIndex !== -1 && newIndex !== -1) {
      reorderItems(arrayMove(items, oldIndex, newIndex));
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const draggedStock = stocks.find((s) => s.ticker === active.id);
    if (draggedStock) {
      setActiveDragItem(draggedStock);
    }
  };

  const watchedStocks = useMemo(() => {
    const tickerSet = new Set(items.map((i) => i.ticker));
    return stocks.filter((s) => tickerSet.has(s.ticker));
  }, [stocks, items]);

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
  }, [watchedStocks, debouncedSearch, sectorFilter, changeFilter, sort]);

  const handleSort = (col: SortColumn) => {
    setSort((prev) => {
      if (prev?.column !== col) return { column: col, direction: "desc" };
      if (prev.direction === "desc") return { column: col, direction: "asc" };
      return null;
    });
  };

  const handleExportCsv = () => {
    const headers = ["Ticker", "Name", "Sector", "Price (EUR)", "Change (%)", "Volume", "Turnover (EUR)", "Dividend Yield (%)", "P/E Ratio", "Market Cap (MEUR)"];
    const rows = filtered.map((s) => [
      s.ticker,
      s.name,
      s.sector,
      s.price.toFixed(2),
      s.changePct.toFixed(2),
      s.volume.toString(),
      s.turnover.toFixed(2),
      s.dividendYield ? s.dividendYield.toFixed(2) : "",
      (s as any).peRatio ? (s as any).peRatio.toFixed(2) : "",
      (s as any).marketCapM ? (s as any).marketCapM.toFixed(1) : "",
    ]);
    exportToCsv(`zse-watchlist-${new Date().toISOString().split("T")[0]}`, headers, rows);
    toast.success(t("toast.exported"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
  };

  // Track loading and error states for conditional rendering (moved before any hooks for React compliance)
  const showLoadingSkeleton = !stocksResult;

  const handleClearSearch = () => setSearch("");
  const handleClearFilters = () => {
    setSearch("");
    setChangeFilter("all");
    setSectorFilter(null);
  };

  // Track focus for search input accessibility
  const [searchFocused, setSearchFocused] = useState(false);

  // Count active filters for badge
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (debouncedSearch) count++;
    if (sectorFilter) count++;
    if (changeFilter !== "all") count++;
    return count;
  }, [debouncedSearch, sectorFilter, changeFilter]);

  // Render error, loading, or main content
  if (isError) {
    return (
      <ErrorState
        title={tc("errors.generic")}
        description={tc("errors.network")}
        retry={{ onRetry: refetch, label: tc("errors.tryAgain") }}
      />
    );
  }

  if (showLoadingSkeleton) {
    return <WatchlistSkeleton />;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search + filters badge + CSV */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={tc("actions.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className={`pl-8 pr-14 transition-shadow ${searchFocused ? "ring-2 ring-ring ring-offset-1 ring-offset-background" : ""}`}
          />
          {!search && watchedStocks.length > 0 && (
            <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
              <Keyboard className="h-2.5 w-2.5" />
              /
            </span>
          )}
          {search && (
            <button
              onClick={handleClearSearch}
              className="absolute right-8 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              title={tc("actions.clear")}
              aria-label={tc("actions.clear")}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {/* Active filters badge */}
        {activeFilterCount > 0 && (
          <button
            onClick={handleClearFilters}
            className="flex items-center gap-1 rounded-full bg-primary px-2.5 py-1.5 text-[10px] font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-destructive"
            title={tc("actions.clear")}
            aria-label={`${activeFilterCount} ${tc("actions.clear")}`}
          >
            {activeFilterCount}
            <X className="h-3 w-3" />
          </button>
        )}
        <LiveDataIndicator
          updatedAt={dataUpdatedAt}
          isFetching={isFetching}
        />
        {/* Results count badge */}
        {filtered.length > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {filtered.length}
            <span className="text-[9px]">rezultat{filtered.length !== 1 ? "a" : ""}</span>
          </span>
        )}
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
          <Tooltip key={value}>
            <TooltipTrigger asChild>
              <button
                onClick={() => setChangeFilter(value)}
                className={cn(
                  "flex h-11 min-w-11 items-center gap-1 rounded-full px-2.5 py-2 text-[10px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                  changeFilter === value
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{t(labelKey)}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              <p>{t(`filters.${value}Tooltip`) || (value === "all" ? "Svi" : value === "gainers" ? "Prikaži samo dobitnike" : value === "losers" ? "Prikaži samo gubitnike" : "Prikaži nepromijenjene")}</p>
            </TooltipContent>
          </Tooltip>
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

      {/* Results count + keyboard shortcuts hint */}
      {watchedStocks.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "stock" : "stockova"}
            {debouncedSearch && (
              <span className="ml-1 text-muted-foreground/60">
                / {watchedStocks.length}
              </span>
            )}
          </span>
          {/* Keyboard shortcuts hint - always visible with tooltip for discoverability */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                className="flex items-center gap-1.5 text-[9px] text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Keyboard shortcuts"
              >
                <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Enter</kbd>
                <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">S</kbd>
                <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Del</kbd>
                <HelpCircle className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" align="end" className="space-y-1 p-2.5">
              <p className="text-[10px] font-semibold text-foreground">{t("shortcuts") || "Tipkovnički prečaci"}</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[9px]">
                <kbd className="rounded bg-muted px-1.5 py-0.5 text-[8px] font-sans">Enter</kbd>
                <span className="text-muted-foreground">{t("shortcut.details") || "detalji dionice"}</span>
                <kbd className="rounded bg-muted px-1.5 py-0.5 text-[8px] font-sans">S</kbd>
                <span className="text-muted-foreground">{t("shortcut.toggle") || "dodaj/ukloni iz pratnje"}</span>
                <kbd className="rounded bg-muted px-1.5 py-0.5 text-[8px] font-sans">Del</kbd>
                <span className="text-muted-foreground">{t("shortcut.delete") || "ukloni iz pratnje"}</span>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {filtered.length > 0 ? (
        // Only enable drag-drop when not filtering (preserves actual watchlist order)
        !debouncedSearch && items.length > 1 ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filtered.map((s) => s.ticker)}
              strategy={verticalListSortingStrategy}
            >
              <WatchlistTableMemo
                stocks={filtered}
                sort={sort}
                onSort={handleSort}
                showRemove
                onRemove={(ticker) => setConfirmRemove(ticker)}
                dragEnabled
                searchQuery={debouncedSearch}
              />
            </SortableContext>
            <DragOverlay>
              {activeDragItem ? (
                <div className="rounded-md border border-border bg-card px-3 py-2 shadow-xl ring-2 ring-primary/20">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-data text-xs font-semibold">{activeDragItem.ticker}</span>
                    <span className="text-xs text-muted-foreground">{formatPrice(activeDragItem.price)}</span>
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          <WatchlistTableMemo
            stocks={filtered}
            sort={sort}
            onSort={handleSort}
            showRemove
            onRemove={(ticker) => setConfirmRemove(ticker)}
            dragEnabled={false}
            searchQuery={debouncedSearch}
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
          icon={<WatchlistEmptyIllustration className="h-10 w-10" />}
          title={t("empty")}
          description={t("emptyDescription")}
          steps={[
            { label: t("emptyHints.step1"), description: t("emptyHints.step2") },
            { label: t("emptyHints.step3"), description: "" },
          ]}
          action={{
            label: t("browseAction"),
            onClick: () => { window.location.href = "/"; },
          }}
          variant="action"
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
        icon={<Star className="h-5 w-5 fill-amber text-amber" />}
        onConfirm={() => {
          if (confirmRemove) {
            removeItem(confirmRemove);
            toast.success(t("toast.removed") || "Removed from watchlist", { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
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
  searchQuery?: string;
}

function WatchlistTable({ stocks, showRemove, onRemove, sort, onSort, dragEnabled, searchQuery }: WatchlistTableProps) {
  const { t } = useTranslation("watchlist");
  const flashMap = usePriceFlash(stocks);
  const [scrollTop, setScrollTop] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={tableRef}
      onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop > 200)}
      className="relative overflow-auto rounded-md border border-border max-h-[75vh] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-muted-foreground/30 hover:scrollbar-thumb-muted-foreground/50"
    >
      <table className="w-full text-xs">
        <thead className="sticky top-0 z-10 bg-card">
          <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="sticky left-0 z-10 bg-card px-3 py-2 text-left font-medium shadow-[2px_0_4px_hsl(var(--border))]">{t("table.ticker")}</th>
            <th className="hidden px-3 py-2 text-left font-medium md:table-cell">
              <SortHeader column="name" label={t("table.name")} sort={sort} onSort={onSort} />
            </th>
            <th className="hidden px-3 py-2 text-left font-medium lg:table-cell">
              <SortHeader column="sector" label={t("table.sector")} sort={sort} onSort={onSort} tooltip={t("tooltips.sector")} />
            </th>
            <th className="px-3 py-2 text-right font-medium">
              <SortHeader column="price" label={t("table.price")} sort={sort} onSort={onSort} tooltip={t("tooltips.price")} />
            </th>
            <th className="px-3 py-2 text-right font-medium">
              <SortHeader column="changePct" label={t("table.change")} sort={sort} onSort={onSort} tooltip={t("tooltips.change")} />
            </th>
            <th className="hidden px-3 py-2 text-right font-medium lg:table-cell">
              <SortHeader column="volume" label={t("table.volume")} sort={sort} onSort={onSort} tooltip={t("tooltips.volume")} />
            </th>
            <th className="hidden px-3 py-2 text-right font-medium lg:table-cell">
              <SortHeader column="turnover" label={t("table.turnover")} sort={sort} onSort={onSort} tooltip={t("tooltips.turnover")} />
            </th>
            <th className="hidden px-3 py-2 text-right font-medium xl:table-cell">
              <SortHeader column="dividendYield" label={t("table.dividendYield")} sort={sort} onSort={onSort} tooltip={t("tooltips.dividendYield")} />
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
                searchQuery={searchQuery}
              />
            ) : (
              <WatchlistRowMemo
                key={stock.ticker}
                stock={stock}
                showRemove={showRemove}
                onRemove={onRemove}
                flash={flashMap.get(stock.ticker) ?? null}
                searchQuery={searchQuery}
              />
            )
          )}
        </tbody>
      </table>

      {/* Scroll to top button */}
      <button
        onClick={() => tableRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
        className={cn(
          "absolute bottom-6 right-6 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md transition-all hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          scrollTop ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2"
        )}
        aria-label="Povratak na vrh"
        title="Povratak na vrh"
      >
        <ChevronUp className="h-4 w-4" />
      </button>
    </div>
  );
}

const WatchlistTableMemo = memo(WatchlistTable, (prev, next) => {
  return (
    prev.stocks === next.stocks &&
    prev.showRemove === next.showRemove &&
    prev.onRemove === next.onRemove &&
    prev.sort === next.sort &&
    prev.onSort === next.onSort &&
    prev.dragEnabled === next.dragEnabled &&
    prev.searchQuery === next.searchQuery
  );
});

interface WatchlistRowProps {
  stock: Stock;
  showRemove?: boolean;
  onRemove?: (ticker: string) => void;
  flash?: "up" | "down" | null;
  searchQuery?: string;
}

function WatchlistRow({ stock, showRemove, onRemove, flash, searchQuery }: WatchlistRowProps) {
  const { t } = useTranslation("watchlist");
  const { select, selectedTicker } = useSelectedStock();
  const isSelected = selectedTicker === stock.ticker;
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopyTicker = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(stock.ticker);
    toast.success(t("toast.copied", { ticker: stock.ticker }));
    setCopiedField("ticker");
    setTimeout(() => setCopiedField(null), 1200);
  }, [stock.ticker, t]);

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
        "group cursor-pointer border-b border-border/50 transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/50 hover:shadow-md",
        "last:border-b-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "border-l-2 border-l-primary bg-accent/30",
        flash === "up" && "price-flash-up",
        flash === "down" && "price-flash-down",
      )}
    >
      <td className="sticky left-0 z-[1] bg-card shadow-[2px_0_4px_hsl(var(--border))] px-3 py-2">
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
          <button
            type="button"
            onClick={handleCopyTicker}
            className={cn(
              "font-data text-xs font-semibold text-foreground",
              "cursor-pointer transition-colors hover:text-primary",
              copiedField === "ticker" && "text-primary",
            )}
            title="Click to copy ticker"
          >
            <Highlight text={stock.ticker} highlight={searchQuery ?? ""} />
          </button>
        </div>
      </td>
      <td className="hidden px-3 py-2 md:table-cell">
        <span className="truncate text-xs text-muted-foreground">
          <Highlight text={stock.name} highlight={searchQuery ?? ""} />
        </span>
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
      <td className="hidden px-3 py-2 text-right xl:table-cell">
        <span className="font-data text-xs tabular-nums text-muted-foreground">
          {stock.dividendYield !== null && stock.dividendYield !== undefined
            ? `${stock.dividendYield.toFixed(1)}%`
            : "—"}
        </span>
      </td>
      {showRemove && <td />}
    </tr>
  );
}

const WatchlistRowMemo = memo(WatchlistRow, (prev, next) => {
  return (
    prev.stock.ticker === next.stock.ticker &&
    prev.stock.price === next.stock.price &&
    prev.showRemove === next.showRemove &&
    prev.onRemove === next.onRemove &&
    prev.flash === next.flash &&
    prev.searchQuery === next.searchQuery
  );
});

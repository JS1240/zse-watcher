import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Filter, RotateCcw, ArrowUpDown, ArrowUp, ArrowDown, Info, Download, Save, Trash2, Bookmark, Search, ChevronDown, AlertTriangle, X, Keyboard, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChangeBadge } from "@/components/shared/change-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Highlight } from "@/components/shared/highlight";
import { SearchEmptyIllustration } from "@/components/shared/empty-illustrations";
import { ErrorState } from "@/components/shared/error-state";
import { ScreenerSkeleton } from "@/features/stocks/components/screener-skeleton";
import { formatPrice, formatVolume } from "@/lib/formatters";
import { exportToCsv } from "@/lib/export";
import { useSelectedStock } from "@/hooks/use-selected-stock";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { useDebounce } from "@/hooks/use-debounce";
import type { Stock } from "@/types/stock";
import { cn } from "@/lib/utils";

/** Cross-field validation: check min <= max for range fields */
type RangeError = { message: string; fields: (keyof ScreenerFilters)[] } | null;

function validateFilterRange(filters: ScreenerFilters, t: (key: string) => string): RangeError {
  const parse = (v: string) => (v ? parseFloat(v.replace(",", ".")) : null);
  const violations: { message: string; fields: (keyof ScreenerFilters)[] }[] = [];

  const minPrice = parse(filters.minPrice);
  const maxPrice = parse(filters.maxPrice);
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    violations.push({ message: t("screener.validation.minGreaterThanMax"), fields: ["minPrice", "maxPrice"] });
  }

  const minChange = parse(filters.minChange);
  const maxChange = parse(filters.maxChange);
  if (minChange !== null && maxChange !== null && minChange > maxChange) {
    violations.push({ message: t("screener.validation.minGreaterThanMax"), fields: ["minChange", "maxChange"] });
  }

  const minDividend = parse(filters.minDividend);
  const maxDividend = parse(filters.maxDividend);
  if (minDividend !== null && maxDividend !== null && minDividend > maxDividend) {
    violations.push({ message: t("screener.validation.minGreaterThanMax"), fields: ["minDividend", "maxDividend"] });
  }

  // Return first violation for simple error display, or we'd show multiple alerts which could be noisy
  return violations[0] ?? null;
}

/** Validation helper: returns error message or null if valid */
function validateFilterValue(value: string, field: keyof ScreenerFilters, t: (key: string) => string): string | null {
  if (!value) return null; // Empty is valid (no filter)
  const parsed = parseFloat(value.replace(",", "."));
  if (isNaN(parsed)) return t("screener.validation.mustBeNumber");
  if (parsed < 0) return t("screener.validation.notNegative");
  if (field === "minPrice" || field === "maxPrice") {
    if (parsed > 100_000) return t("screener.validation.tooLarge");
  }
  if (field === "minTurnover") {
    if (parsed > 10_000_000) return t("screener.validation.tooLarge");
  }
  return null;
}

interface ScreenerFilterInputProps {
  label: string;
  field: keyof ScreenerFilters;
  placeholder?: string;
  inputMode?: "decimal" | "numeric";
  className?: string;
}

function ScreenerFilterInput({
  label,
  field,
  value,
  onChange,
  placeholder,
  inputMode = "decimal",
  className,
}: ScreenerFilterInputProps & { value: string; onChange: (key: keyof ScreenerFilters, value: string) => void }) {
  const { t } = useTranslation("stocks");
  const [localValue, setLocalValue] = useState(value);
  const [touched, setTouched] = useState(false);
  const error = touched ? validateFilterValue(localValue, field, t) : null;
  const hasValue = localValue !== "";

  // Sync with parent when parent value changes (e.g. preset load)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);


  const handleChange = (v: string) => {
    setLocalValue(v);
    // Validate synchronously so we don't block subsequent keystrokes
    const immediateError = v && isNaN(parseFloat(v.replace(",", "."))) ? t("screener.validation.mustBeNumber") : null;
    if (!immediateError) {
      onChange(field, v);
    }
  };

  const handleBlur = () => {
    setTouched(true);
    if (localValue && !error) {
      onChange(field, localValue);
    }
  };


  return (
    <div className={className}>
      <label className={cn("mb-1 block text-[9px] uppercase", error ? "text-destructive" : "text-muted-foreground")}>
        {label}
      </label>
      <div className="relative">
        <Input
          type="text"
          inputMode={inputMode}
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            "h-7 text-[11px] font-data transition-all",
            error && "border-destructive/60 bg-destructive/5 pr-7",
            hasValue && !error && "border-primary/40 bg-primary/5",
          )}
        />
        {error && (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5">
            <span className="text-[9px] font-medium text-destructive">
              {error}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}

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

interface ScreenerPreset {
  id: string;
  name: string;
  filters: ScreenerFilters;
  createdAt: string;
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
  const { data: result, isLoading, isError, refetch } = useStocksLive();
  const stocks = result?.stocks ?? null;
  const isMockData = result?.isMockData ?? false;
  const { select } = useSelectedStock();
  const [filters, setFilters] = useState<ScreenerFilters>(INITIAL_FILTERS);
  const [filtersCollapsed, setFiltersCollapsed] = useState(false);

  // Cross-field range validation
  const rangeError = useMemo(() => validateFilterRange(filters, t), [filters, t]);

  // Count active filters for badge
  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (!value) return false;
      const initial = INITIAL_FILTERS[key as keyof ScreenerFilters];
      return value !== (initial ?? "");
    }).length;
  }, [filters]);
  const [sort, setSort] = useState<{ column: SortColumn; direction: SortDirection } | null>({
    column: "turnover",
    direction: "desc",
  });
  const [presets, setPresets] = useLocalStorage<ScreenerPreset[]>("zse-screener-presets", []);
  const [savePresetName, setSavePresetName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [presetSearch, setPresetSearch] = useState("");
  const [search, setSearch] = useState("");
  const [scrollTop, setScrollTop] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(search, 200);

  // Keyboard shortcut to focus search
  const searchInputRef = useRef<HTMLInputElement>(null);
  const focusSearch = useCallback(() => searchInputRef.current?.focus(), []);
  useKeyboardShortcut({ key: "/", handler: focusSearch, enabled: true });

  // Filter presets by search
  const filteredPresets = useMemo(() => {
    if (!presetSearch.trim()) return presets;
    const q = presetSearch.toLowerCase();
    return presets.filter((p) => p.name.toLowerCase().includes(q));
  }, [presets, presetSearch]);

  const sectors = useMemo(() => {
    if (!stocks) return [];
    return [...new Set(stocks.map((s) => s.sector))].sort();
  }, [stocks]);

  const filtered = useMemo(() => {
    if (!stocks) return [];

    const q = debouncedSearch.toLowerCase();

    return stocks.filter((s) => {
      // Search filter
      if (q && !s.ticker.toLowerCase().includes(q) && !s.name.toLowerCase().includes(q)) return false;
      // Sector filter
      if (filters.sector && s.sector !== filters.sector) return false;
      // Price filters
      if (filters.minPrice && s.price < parseFloat(filters.minPrice)) return false;
      if (filters.maxPrice && s.price > parseFloat(filters.maxPrice)) return false;
      // Change filters
      if (filters.minChange && s.changePct < parseFloat(filters.minChange)) return false;
      if (filters.maxChange && s.changePct > parseFloat(filters.maxChange)) return false;
      // Turnover filter
      if (filters.minTurnover && s.turnover < parseFloat(filters.minTurnover)) return false;
      // Dividend filters
      if (filters.minDividend && (s.dividendYield === null || s.dividendYield < parseFloat(filters.minDividend))) return false;
      if (filters.maxDividend && (s.dividendYield === null || s.dividendYield > parseFloat(filters.maxDividend))) return false;
      return true;
    });
  }, [stocks, filters, debouncedSearch]);

  // Stock count for search UI
  const stockCount = stocks?.length ?? 0;

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

  const savePreset = () => {
    if (!savePresetName.trim()) return;
    const preset: ScreenerPreset = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: savePresetName.trim(),
      filters: { ...filters },
      createdAt: new Date().toISOString(),
    };
    setPresets((prev) => [preset, ...prev]);
    setSavePresetName("");
    setShowSaveInput(false);
  };

  const loadPreset = (preset: ScreenerPreset) => {
    setFilters(preset.filters);
  };

  const deletePreset = (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  };

  if (isLoading) return <ScreenerSkeleton />;

  if (isError) {
    return (
      <ErrorState
        title={tc("errors.generic")}
        description={tc("errors.network")}
        retry={{ onRetry: refetch, label: tc("errors.tryAgain") }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {isMockData && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
          <Info className="h-3 w-3 shrink-0" />
          <span>{t("detail.demoData")}</span>
        </div>
      )}

      {/* Search bar */}
      {stockCount > 0 && (
        <div className="mb-2 flex items-center justify-between">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder={tc("actions.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-14"
            />
            {!search && stockCount > 0 && (
              <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                <Keyboard className="h-2.5 w-2.5" />
              </span>
            )}
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setFiltersCollapsed(!filtersCollapsed)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
            aria-expanded={!filtersCollapsed}
            aria-controls="stock-screener-filters"
            aria-label={filtersCollapsed ? tc("common:actions.show") + " " + tc("common:actions.filter") : tc("common:actions.hide") + " " + tc("common:actions.filter")}
          >
            <span>{activeFilterCount > 0 ? `${activeFilterCount} ` : ""}{tc("common:actions.filter")}</span>
            <ChevronDown className={cn("h-3 w-3 transition-transform", filtersCollapsed && "-rotate-90")} />
          </button>
        </div>
      )}

      {/* Filter bar */}
      <div id="stock-screener-filters" className="rounded-md border border-border bg-card p-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {tc("common:actions.filter")}
            </span>
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-semibold text-foreground">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            {showSaveInput ? (
              <div className="flex items-center gap-1">
                <Input
                  value={savePresetName}
                  onChange={(e) => setSavePresetName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && savePreset()}
                  placeholder="Preset name"
                  className="h-6 w-28 text-[10px]"
                  autoFocus
                />
                <Button size="sm" onClick={savePreset} className="h-6 text-[10px] px-1.5">Save</Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowSaveInput(false); setSavePresetName(""); }} className="h-6 text-[10px] px-1.5">Cancel</Button>
              </div>
            ) : (
              <Button size="sm" variant="ghost" onClick={() => setShowSaveInput(true)} className="h-6 text-[10px]">
                <Save className="h-3 w-3" />
                Save
              </Button>
            )}
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
        </div>

        {/* Presets row */}
        {(presets.length > 0 || activeFilterCount > 0) && (
          <div className="mb-2 flex flex-wrap items-center gap-1">
            {presets.length > 0 && (
              <>
                {presets.length > 3 && (
                  <div className="relative">
                    <Input
                      value={presetSearch}
                      onChange={(e) => setPresetSearch(e.target.value)}
                      placeholder={tc("common:actions.filter") || "Filter..."}
                      className="h-5 w-20 text-[9px] pl-1.5 pr-5 py-0 transition-all focus:w-32"
                      onFocus={(e) => e.target.classList.add("w-32")}
                      onBlur={(e) => {
                        if (!e.target.value) e.target.classList.remove("w-32");
                      }}
                    />
                    {presetSearch && (
                      <button
                        onClick={() => setPresetSearch("")}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )}
                <Bookmark className="h-3 w-3 shrink-0 text-muted-foreground" />
                {filteredPresets.map((p) => (
                  <div key={p.id} className="flex items-center gap-0.5 rounded-sm bg-accent/70 px-1.5 py-0.5">
                    <button
                      onClick={() => loadPreset(p)}
                      className="text-[10px] font-medium text-foreground hover:text-primary"
                    >
                      {p.name}
                    </button>
                    <button
                      onClick={() => deletePreset(p.id)}
                      className="text-muted-foreground/50 hover:text-price-down ml-0.5"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </div>
                ))}
                {presetSearch && filteredPresets.length === 0 && (
                  <span className="text-[10px] text-muted-foreground">
                    {tc("common:empty.noResults") || "No results"}
                  </span>
                )}
              </>
            )}
            {/* Collapse/expand toggle */}
            <button
              onClick={() => setFiltersCollapsed(!filtersCollapsed)}
              className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronDown
                className={cn(
                  "h-3 w-3 transition-transform",
                  filtersCollapsed && "-rotate-90"
                )}
              />
              {filtersCollapsed ? tc("common:actions.show") : tc("common:actions.hide")}
            </button>
          </div>
        )}

        {/* Cross-field range error with field highlighting */}
        {rangeError && (
          <div className="mb-2 flex items-center gap-2 rounded-md border border-destructive/60 bg-destructive/10 px-3 py-2 text-[11px] text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="font-medium">{rangeError.message}</span>
              <div className="flex gap-1">
                {rangeError.fields.map((field) => (
                  <span
                    key={field}
                    className="rounded bg-destructive/20 px-1.5 py-0.5 text-[9px] font-semibold"
                  >
                    {t(`screener.${field}`)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Collapsible filter inputs */}
        <div className={cn(
          "grid grid-cols-2 gap-2 overflow-hidden transition-all duration-200",
          filtersCollapsed ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"
        )}>
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

          <ScreenerFilterInput
            label={t("screener.minPrice")}
            field="minPrice"
            value={filters.minPrice}
            onChange={updateFilter}
            placeholder="0"
            inputMode="decimal"
            className="col-span-1"
          />
          <ScreenerFilterInput
            label={t("screener.maxPrice")}
            field="maxPrice"
            value={filters.maxPrice}
            onChange={updateFilter}
            placeholder="1000"
            inputMode="decimal"
            className="col-span-1"
          />
          <ScreenerFilterInput
            label={t("screener.minChange")}
            field="minChange"
            value={filters.minChange}
            onChange={updateFilter}
            placeholder="-10"
            inputMode="decimal"
            className="col-span-1"
          />
          <ScreenerFilterInput
            label={t("screener.maxChange")}
            field="maxChange"
            value={filters.maxChange}
            onChange={updateFilter}
            placeholder="10"
            inputMode="decimal"
            className="col-span-1"
          />
          <ScreenerFilterInput
            label={t("screener.minTurnover")}
            field="minTurnover"
            value={filters.minTurnover}
            onChange={updateFilter}
            placeholder="0"
            inputMode="numeric"
            className="col-span-1"
          />
          <ScreenerFilterInput
            label={t("screener.minDividend")}
            field="minDividend"
            value={filters.minDividend}
            onChange={updateFilter}
            placeholder="0"
            inputMode="decimal"
            className="col-span-1"
          />
          <ScreenerFilterInput
            label={t("screener.maxDividend")}
            field="maxDividend"
            value={filters.maxDividend}
            onChange={updateFilter}
            placeholder="10"
            inputMode="decimal"
            className="col-span-1"
          />
        </div>
        </div>
        </div>
      </div>

      {/* Results count + keyboard shortcuts hint + export */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          {t("screener.results", { count: results.length, total: stocks?.length ?? 0 })}
        </span>
        <div className="flex items-center gap-3">
          {results.length > 0 && (
            /* Keyboard shortcuts hint */
            <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Enter</kbd>
                <span>{t("shortcut.details")}</span>
              </span>
              <span className="flex items-center gap-0.5">
                <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">S</kbd>
                <span>{t("shortcut.watch")}</span>
              </span>
              <span className="flex items-center gap-0.5">
                <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">C</kbd>
                <span>{t("shortcut.copy")}</span>
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const headers = ["Ticker", "Name", "Sector", "Price (EUR)", "Change (%)", "Turnover (EUR)", "Dividend Yield (%)", "Volume"];
              const rows = results.map((s) => [
                s.ticker,
                s.name,
                s.sector,
                s.price.toFixed(2),
                s.changePct.toFixed(2),
                s.turnover.toFixed(0),
                s.dividendYield !== null ? s.dividendYield.toFixed(1) : "",
                s.volume.toString(),
              ]);
              exportToCsv(`zse-screener-${new Date().toISOString().split("T")[0]}`, headers, rows);
              toast.success(t("toast.exported") || "Exported to CSV");
            }}
            className="h-6 text-[10px]"
            disabled={results.length === 0}
          >
            <Download className="h-3 w-3" />
            CSV
          </Button>
        </div>
      </div>

      {/* Results table */}
      <div
        ref={tableRef}
        onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop > 200)}
        className="relative overflow-auto rounded-md border border-border max-h-[60vh]"
      >
        <table className="w-full text-xs">
          <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur supports-[backdrop-filter]:bg-muted/80">
            <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
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
                className="border-b border-border/50 cursor-pointer transition-all duration-150 hover:bg-accent/70"
                onClick={() => select(s.ticker)}
              >
                <td className="px-3 py-2 font-data font-semibold text-foreground">
                  <Highlight text={s.ticker} highlight={debouncedSearch} />
                </td>
                <td className="px-1 py-2 text-muted-foreground">
                  <Highlight text={s.name} highlight={debouncedSearch} />
                </td>
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

        {results.length === 0 && stocks && (
          <EmptyState
            icon={<SearchEmptyIllustration className="h-8 w-8" />}
            title={t("screener.noResults")}
            description={tc("empty.noResultsDescription")}
            action={{
              label: tc("common:actions.reset"),
              onClick: () => {
                setFilters(INITIAL_FILTERS);
                setSort({ column: "turnover", direction: "desc" });
              },
            }}
            variant="no-results"
          />
        )}
      </div>

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

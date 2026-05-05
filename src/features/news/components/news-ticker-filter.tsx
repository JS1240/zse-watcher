import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/formatters";

interface EnrichedTicker {
  ticker: string;
  name: string;
  price: number | null;
}

interface NewsTickerFilterProps {
  /** Ticker strings derived from articles */
  availableTickers: string[];
  /** Currently selected ticker (empty string = all) */
  value: string;
  /** Callback when a ticker is selected */
  onChange: (ticker: string) => void;
  /** Article count per ticker for display */
  tickerCounts?: Map<string, number>;
  className?: string;
}

export function NewsTickerFilter({
  availableTickers,
  value,
  onChange,
  tickerCounts,
  className,
}: NewsTickerFilterProps) {
  const { t } = useTranslation("news");
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(search, 120);

  const { data: stocksResult } = useStocksLive();
  const stocks = stocksResult?.stocks ?? [];

  // Enrich tickers with stock metadata (name, price)
  const enrichedTickers = useMemo((): EnrichedTicker[] => {
    return availableTickers.map((ticker) => {
      const stock = stocks.find((s) => s.ticker === ticker);
      return {
        ticker,
        name: stock?.name ?? ticker,
        price: stock?.price ?? null,
      };
    });
  }, [availableTickers, stocks]);

  // Filter tickers by search term
  const filteredTickers = useMemo(() => {
    if (!debouncedSearch) return enrichedTickers;
    const q = debouncedSearch.toLowerCase();
    return enrichedTickers.filter(
      (t) =>
        t.ticker.toLowerCase().includes(q) ||
        t.name.toLowerCase().includes(q),
    );
  }, [enrichedTickers, debouncedSearch]);

  // Currently selected enriched ticker (for display)
  const selectedTicker = useMemo(() => {
    if (!value) return null;
    return enrichedTickers.find((t) => t.ticker === value) ?? null;
  }, [value, enrichedTickers]);

  // Open dropdown and focus search
  const openDropdown = useCallback(() => {
    setIsOpen(true);
    setSearch("");
    setHighlightedIndex(-1);
    // Focus search after dropdown opens
    setTimeout(() => inputRef.current?.focus(), 10);
  }, []);

  // Close dropdown
  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setSearch("");
    setHighlightedIndex(-1);
  }, []);

  // Select a ticker
  const selectTicker = useCallback(
    (ticker: string) => {
      onChange(ticker);
      closeDropdown();
    },
    [onChange, closeDropdown],
  );

  // Clear selection (back to "all tickers")
  const clearSelection = useCallback(() => {
    onChange("");
    closeDropdown();
  }, [onChange, closeDropdown]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, closeDropdown]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openDropdown();
        }
        return;
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((i) => Math.min(i + 1, filteredTickers.length));
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((i) => Math.max(i - 1, -1));
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (highlightedIndex === 0) {
            clearSelection();
          } else if (highlightedIndex > 0 && filteredTickers[highlightedIndex - 1]) {
            selectTicker(filteredTickers[highlightedIndex - 1].ticker);
          } else if (filteredTickers.length > 0) {
            selectTicker(filteredTickers[0].ticker);
          }
          break;
        case "Escape":
          e.preventDefault();
          closeDropdown();
          break;
        case "Tab":
          // Accept first match on Tab
          if (search && filteredTickers.length > 0) {
            selectTicker(filteredTickers[0].ticker);
          } else {
            closeDropdown();
          }
          break;
      }
    },
    [isOpen, openDropdown, filteredTickers, highlightedIndex, search, clearSelection, selectTicker, closeDropdown],
  );

  // Total article count for "all" option
  const totalCount = useMemo(() => {
    if (!tickerCounts) return availableTickers.length;
    return Array.from(tickerCounts.values()).reduce((sum, c) => sum + c, 0);
  }, [tickerCounts, availableTickers]);

  // Count for selected ticker
  const selectedCount = value && tickerCounts ? tickerCounts.get(value) ?? 0 : totalCount;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger button — matches CategoryChip h-8 style */}
      <button
        type="button"
        onClick={isOpen ? closeDropdown : openDropdown}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={
          value
            ? `${t("filter.tickerFiltered") || "Filter by ticker"}: ${value}`
            : t("filter.allTickers")
        }
        className={cn(
          "flex h-8 min-w-11 items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium transition-all duration-150",
          value
            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
            : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        )}
      >
        <span>
          {value ? (
            <span className="flex items-center gap-1">
              <span className="font-data font-semibold">{value}</span>
              {selectedTicker?.price != null && (
                <span className="opacity-80">{formatPrice(selectedTicker.price)}</span>
              )}
            </span>
          ) : (
            t("filter.allTickers")
          )}
        </span>
        {value && (
          <span
            className={cn(
              "ml-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
              value
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-muted-foreground/20 text-muted-foreground",
            )}
          >
            {selectedCount}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-3 w-3 shrink-0 transition-transform duration-150",
            isOpen && "rotate-180",
          )}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[200px] rounded-md border border-border bg-popover py-1 shadow-lg">
          {/* Search input */}
          <div className="px-2 pb-1.5">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder={t("filter.searchTicker") || "Search ticker or name..."}
              className={cn(
                "h-7 w-full rounded border border-input bg-background px-2 py-1 text-[10px] text-foreground",
                "placeholder:text-muted-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              autoComplete="off"
              spellCheck={false}
            />
          </div>

          {/* Keyboard hint */}
          {filteredTickers.length > 0 && (
            <div className="flex items-center gap-1 px-3 pb-1 text-[8px] text-muted-foreground">
              <kbd className="rounded bg-muted px-1 py-0.5 font-data">↑↓</kbd>
              <span>navigiraj</span>
              <kbd className="rounded bg-muted px-1 py-0.5 font-data ml-2">↵</kbd>
              <span>odaberi</span>
              <kbd className="rounded bg-muted px-1 py-0.5 font-data ml-2">Esc</kbd>
              <span>zatvori</span>
            </div>
          )}

          {/* Options list */}
          <ul ref={listRef} role="listbox" className="max-h-52 overflow-y-auto py-0.5">
            {/* "All tickers" option */}
            <li
              role="option"
              aria-selected={!value}
              className={cn(
                "flex cursor-pointer items-center justify-between px-3 py-1.5 text-[10px] transition-colors",
                !value
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "hover:bg-accent/50 text-foreground",
                highlightedIndex === 0 && "bg-accent/70",
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                clearSelection();
              }}
              onMouseEnter={() => setHighlightedIndex(0)}
            >
              <span className="flex items-center gap-2">
                <span className="text-muted-foreground">{t("filter.allTickers")}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="rounded-full bg-muted-foreground/20 px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                  {totalCount}
                </span>
                {!value && <Check className="h-3 w-3 text-primary" />}
              </span>
            </li>

            {/* Individual ticker options */}
            {filteredTickers.map((ticker, i) => {
              const count = tickerCounts?.get(ticker.ticker) ?? 0;
              const isSelected = ticker.ticker === value;
              const isHighlighted = i + 1 === highlightedIndex;

              return (
                <li
                  key={ticker.ticker}
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    "flex cursor-pointer items-center justify-between px-3 py-1.5 text-[10px] transition-colors",
                    isSelected
                      ? "bg-accent text-accent-foreground font-semibold"
                      : "hover:bg-accent/50 text-foreground",
                    isHighlighted && "bg-accent/70",
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectTicker(ticker.ticker);
                  }}
                  onMouseEnter={() => setHighlightedIndex(i + 1)}
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 font-data font-semibold">{ticker.ticker}</span>
                    <span className="truncate text-muted-foreground">{ticker.name}</span>
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0 ml-2">
                    {ticker.price != null && (
                      <span className="font-data tabular-nums text-[9px] text-muted-foreground">
                        {formatPrice(ticker.price)}
                      </span>
                    )}
                    {count > 0 && (
                      <span className="rounded-full bg-muted-foreground/20 px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                        {count}
                      </span>
                    )}
                    {isSelected && <Check className="h-3 w-3 text-primary" />}
                  </span>
                </li>
              );
            })}

            {/* No results */}
            {filteredTickers.length === 0 && search && (
              <li className="px-3 py-3 text-center text-[10px] text-muted-foreground">
                {t("filter.noTickersFound") || "Nema dionica pronađenih"}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

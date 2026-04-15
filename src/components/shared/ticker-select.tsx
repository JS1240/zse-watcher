import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Check } from "lucide-react";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

interface TickerSelectProps {
  value: string;
  onChange: (ticker: string) => void;
  placeholder?: string;
  className?: string;
  error?: boolean;
  id?: string;
}

export function TickerSelect({
  value,
  onChange,
  placeholder = "KOEI-R-A",
  className,
  error,
  id,
}: TickerSelectProps) {
  const [text, setText] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debouncedText = useDebounce(text, 150);

  const { data: result } = useStocksLive();
  const stocks = result?.stocks ?? [];

  // Filter stocks by ticker/name text
  const suggestions = debouncedText
    ? stocks.filter((s) => {
        const q = debouncedText.toLowerCase();
        return (
          s.ticker.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q)
        );
      }).slice(0, 8) // cap at 8 suggestions
    : [];

  // When text matches exactly a ticker, close dropdown
  const exactMatch = debouncedText
    ? suggestions.find((s) => s.ticker.toLowerCase() === debouncedText.toLowerCase())
    : null;

  useEffect(() => {
    if (exactMatch) {
      setIsOpen(false);
    }
  }, [exactMatch]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && text) {
      // Open dropdown on arrow down if we have text
      if (e.key === "ArrowDown") {
        setIsOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((i) => Math.min(i + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          select(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setHighlightedIndex(-1);
        break;
      case "Tab":
        // Accept first suggestion on Tab
        if (isOpen && suggestions.length > 0) {
          select(suggestions[0]);
        }
        break;
    }
  };

  const select = useCallback(
    (stock: { ticker: string; name: string }) => {
      onChange(stock.ticker);
      setText(stock.ticker);
      setIsOpen(false);
      setHighlightedIndex(-1);
      inputRef.current?.blur();
    },
    [onChange],
  );

  const showDropdown = isOpen && suggestions.length > 0;

  return (
    <div className={cn("relative", className)}>
      <div className="relative flex items-center">
        <input
          id={id}
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(-1);
          }}
          onFocus={() => text && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className={cn(
            "flex h-8 w-full rounded-md border border-input bg-background px-3 py-1.5 pr-7 font-data text-xs text-foreground transition-colors",
            "placeholder:text-muted-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            error && "border-destructive focus-visible:ring-destructive",
          )}
        />
        <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-muted-foreground" />
      </div>

      {showDropdown && (
        <ul
          ref={listRef}
          className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-border bg-popover py-1 shadow-md"
          role="listbox"
        >
          {suggestions.map((stock, i) => (
            <li
              key={stock.ticker}
              role="option"
              aria-selected={i === highlightedIndex}
              className={cn(
                "flex cursor-pointer items-center justify-between px-3 py-1.5 text-xs transition-colors",
                i === highlightedIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50 text-foreground",
              )}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur from stealing the click
                select(stock);
              }}
              onMouseEnter={() => setHighlightedIndex(i)}
            >
              <span className="flex items-center gap-2">
                <span className="font-data font-semibold">{stock.ticker}</span>
                <span className="text-muted-foreground">{stock.name}</span>
              </span>
              {stock.ticker.toLowerCase() === text.toLowerCase() && (
                <Check className="h-3 w-3 text-muted-foreground" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
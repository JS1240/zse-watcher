import { useState, useCallback, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, AlertCircle, CheckCircle2, Star, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Stock } from "@/types/stock";

interface QuickAddTickerProps {
  stocks: Stock[];
  watchedTickers: Set<string>;
  onAdd: (ticker: string) => void;
}

export function QuickAddTicker({ stocks, watchedTickers, onAdd }: QuickAddTickerProps) {
  const { t } = useTranslation("watchlist");
  const [isOpen, setIsOpen] = useState(false);
  const [ticker, setTicker] = useState("");
  const [touched, setTouched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Real-time validation
  const tickerUpper = ticker.trim().toUpperCase();
  
  const isTickerValid = useMemo(() => {
    if (!tickerUpper || tickerUpper.length < 3) return false;
    return stocks.some((s) => s.ticker.toUpperCase() === tickerUpper);
  }, [tickerUpper, stocks]);

  const isTickerFormatValid = useMemo(() => {
    if (!tickerUpper || tickerUpper.length < 3) return false;
    return /^[A-Z0-9_-]{3,10}$/i.test(tickerUpper);
  }, [tickerUpper]);

  const showTickerNotFound = useMemo(() => {
    return isTickerFormatValid && !isTickerValid && tickerUpper.length >= 3;
  }, [isTickerFormatValid, isTickerValid, tickerUpper]);

  const isAlreadyWatched = useMemo(() => {
    return tickerUpper.length >= 3 && watchedTickers.has(tickerUpper);
  }, [tickerUpper, watchedTickers]);

  // Current price for display
  const currentPrice = useMemo(() => {
    if (!tickerUpper || !isTickerValid) return null;
    const stock = stocks.find((s) => s.ticker.toUpperCase() === tickerUpper);
    return stock?.price ?? null;
  }, [tickerUpper, isTickerValid, stocks]);

  // Validation state for display
  const showError = touched && (showTickerNotFound || (tickerUpper && !isTickerFormatValid));
  const showAlreadyWatched = touched && isAlreadyWatched && !showTickerNotFound;
  const showValid = touched && isTickerValid && !isAlreadyWatched;

  const handleAdd = useCallback(() => {
    const tickerVal = ticker.trim().toUpperCase();
    if (!tickerVal) return;

    // Validate ticker format
    if (!/^[A-Z0-9_-]{3,10}$/i.test(tickerVal)) {
      toast.error(t("quickAddInvalid", { ticker: tickerVal }), { icon: <AlertCircle className="h-4 w-4 text-red-500" /> });
      setTouched(true);
      return;
    }

    // Check if already watched
    if (watchedTickers.has(tickerVal)) {
      toast.info(t("quickAddAlreadyWatched", { ticker: tickerVal }), { icon: <Star className="h-4 w-4 text-amber" /> });
      setTouched(true);
      return;
    }

    // Find stock (case-insensitive)
    const stock = stocks.find((s) => s.ticker.toUpperCase() === tickerVal);
    if (!stock) {
      toast.error(t("quickAddInvalid", { ticker: tickerVal }), { icon: <AlertCircle className="h-4 w-4 text-red-500" /> });
      setTouched(true);
      return;
    }

    // Add to watchlist
    onAdd(tickerVal);
    toast.success(t("quickAddSuccess", { ticker: tickerVal }), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
    setTicker("");
    setTouched(false);
    setIsOpen(false);
  }, [ticker, stocks, watchedTickers, onAdd, t]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd();
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setTicker("");
      setTouched(false);
    }
  };

  const handleToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleFocus = () => {
    setTouched(true);
  };

  const handleBlur = () => {
    setTouched(true);
  };

  return (
    <div className="flex items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleToggle}
            className="flex h-8 items-center gap-1 rounded-md border border-dashed border-input bg-background px-2.5 py-1 text-[10px] text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            title={t("quickAddTooltip")}
          >
            <Plus className="h-3 w-3" />
            <span className="hidden sm:inline">{t("quickAdd")}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <p>{t("quickAddTooltip")}</p>
        </TooltipContent>
      </Tooltip>
      {isOpen && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder={t("quickAddPlaceholder")}
              className={cn(
                "h-8 w-28 rounded-md border border-input bg-background px-2 py-1 text-[10px] uppercase placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                showError && "ring-1 ring-destructive border-destructive",
                showValid && "ring-1 ring-emerald-500 border-emerald-500",
                showAlreadyWatched && "ring-1 ring-amber-500 border-amber-500"
              )}
            />
            <button
              onClick={handleAdd}
              disabled={!ticker.trim()}
              className="flex h-8 items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[10px] text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          {/* Inline validation feedback */}
          {showError && (
            <div className="flex items-center gap-1 rounded border border-destructive/30 bg-destructive/15 px-2 py-1 text-[9px] font-semibold text-red-600 dark:text-red-400">
              <AlertCircle className="h-3 w-3" />
              {showTickerNotFound 
                ? t("tickerNotFound") 
                : t("quickAddInvalid", { ticker: tickerUpper })}
            </div>
          )}
          {showAlreadyWatched && (
            <div className="flex items-center gap-1 rounded border border-amber-400/30 bg-amber-50 px-2 py-1 text-[9px] font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
              <Star className="h-3 w-3 fill-amber" />
              {t("quickAddAlreadyWatched", { ticker: tickerUpper })}
            </div>
          )}
          {showValid && currentPrice && (
            <div className="flex items-center gap-1 rounded border border-emerald-400/30 bg-emerald-50 px-2 py-1 text-[9px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
              <TrendingUp className="h-3 w-3" />
              <span>{currentPrice.toFixed(2)} EUR</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
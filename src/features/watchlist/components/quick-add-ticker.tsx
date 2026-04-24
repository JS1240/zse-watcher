import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Plus, AlertCircle, CheckCircle2, Star } from "lucide-react";
import { toast } from "sonner";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
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
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = useCallback(() => {
    const tickerUpper = ticker.trim().toUpperCase();
    if (!tickerUpper) return;

    // Find stock (case-insensitive)
    const stock = stocks.find((s) => s.ticker.toUpperCase() === tickerUpper);
    if (!stock) {
      toast.error(t("quickAddInvalid", { ticker: tickerUpper }), { icon: <AlertCircle className="h-4 w-4 text-red-500" /> });
      return;
    }

    // Check if already watched
    if (watchedTickers.has(tickerUpper)) {
      toast.info(t("quickAddAlreadyWatched", { ticker: tickerUpper }), { icon: <Star className="h-4 w-4 text-amber" /> });
      return;
    }

    // Add to watchlist
    onAdd(tickerUpper);
    toast.success(t("quickAddSuccess", { ticker: tickerUpper }), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
    setTicker("");
    setIsOpen(false);
  }, [ticker, stocks, watchedTickers, onAdd, t]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd();
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setTicker("");
    }
  };

  const handleToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
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
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("quickAddPlaceholder")}
            className="h-8 w-28 rounded-md border border-input bg-background px-2 py-1 text-[10px] uppercase placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleAdd}
            disabled={!ticker.trim()}
            className="flex h-8 items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-[10px] text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
}
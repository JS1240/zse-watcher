import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Command } from "cmdk";
import {
  Activity,
  BarChart3,
  Grid3X3,
  Wallet,
  CalendarDays,
  Bell,
  Settings,
  Sun,
  Moon,
  SlidersHorizontal,
  Star,
  TrendingUp,
} from "lucide-react";
import { useThemeStore } from "@/hooks/use-theme";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { useSelectedStock } from "@/hooks/use-selected-stock";
import { useRecentStocks } from "@/hooks/use-recent-stocks";
import { eventBus } from "@/lib/event-bus";
import { formatPrice, formatPercent } from "@/lib/formatters";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const { mode, toggle: toggleTheme } = useThemeStore();
  const { data: stocksResult, isLoading: stocksLoading } = useStocksLive();
  const { select } = useSelectedStock();
  const { recentStocks } = useRecentStocks();

  // Get stock data for recent stocks
  const recentStocksWithData = useMemo(() => {
    if (!stocksResult?.stocks || recentStocks.length === 0) return [];
    return recentStocks
      .map((recent) => {
        const stock = stocksResult.stocks.find((s) => s.ticker === recent.ticker);
        if (!stock) return null;
        return { ...recent, price: stock.price, changePct: stock.changePct };
      })
      .filter((s): s is { ticker: string; name: string; viewedAt: number; price: number; changePct: number } => s !== null);
  }, [stocksResult?.stocks, recentStocks]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const unsubscribe = eventBus.on("toggle-command-palette", () => {
      setOpen((prev) => !prev);
    });
    return unsubscribe;
  }, []);

  // Filter stocks based on search input
  const matchingStocks = useMemo(() => {
    if (!stocksResult?.stocks || search.length < 1) return [];
    const q = search.toLowerCase();
    return stocksResult.stocks
      .filter(
        (s) =>
          s.ticker.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [stocksResult?.stocks, search]);

  const navigateTo = (path: string) => {
    navigate({ to: path });
    setOpen(false);
  };

  const selectStock = (ticker: string) => {
    select(ticker);
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Command dialog */}
      <Command
        className="relative w-full max-w-lg overflow-hidden rounded-lg border border-border bg-popover shadow-2xl"
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        <Command.Input
          placeholder={t("commandPalette.placeholder")}
          value={search}
          onValueChange={setSearch}
          className="h-11 w-full border-b border-border bg-transparent px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />

        <Command.List className="max-h-80 overflow-y-auto p-2">
          {/* Recently viewed stocks - show when no search */}
          {search.length < 2 && recentStocksWithData.length > 0 && (
            <Command.Group
              heading={t("commandPalette.recent") || "Recently Viewed"}
              className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              {recentStocksWithData.map((stock) => (
                <Command.Item
                  key={stock.ticker}
                  onSelect={() => selectStock(stock.ticker)}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground aria-selected:bg-accent"
                >
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-1 items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-data font-semibold">{stock.ticker}</span>
                      <span className="text-xs text-muted-foreground">{stock.name}</span>
                    </div>
                    <div className="flex flex-col items-end font-data text-xs">
                      <span className="text-foreground">
                        {formatPrice(stock.price)}
                      </span>
                      <span
                        className={
                          stock.changePct >= 0
                            ? "text-emerald-500"
                            : "text-destructive"
                        }
                      >
                        {formatPercent(stock.changePct)}
                      </span>
                    </div>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            {search.length > 0 && matchingStocks.length === 0
              ? t("commandPalette.noResults")
              : stocksLoading
                ? t("commandPalette.loading")
                : t("commandPalette.hint")}
          </Command.Empty>

          {/* Stock search results */}
          {matchingStocks.length > 0 && (
            <Command.Group
              heading="Stocks"
              className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
            >
              {matchingStocks.map((stock) => (
                <Command.Item
                  key={stock.ticker}
                  onSelect={() => selectStock(stock.ticker)}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground aria-selected:bg-accent"
                >
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-1 items-center justify-between">
                    <div className="flex flex-col">
                      <span className="font-data font-semibold">{stock.ticker}</span>
                      <span className="text-xs text-muted-foreground">{stock.name}</span>
                    </div>
                    <div className="flex flex-col items-end font-data text-xs">
                      <span className="text-foreground">
                        {formatPrice(stock.price)}
                      </span>
                      <span
                        className={
                          stock.changePct >= 0
                            ? "text-emerald-500"
                            : "text-destructive"
                        }
                      >
                        {formatPercent(stock.changePct)}
                      </span>
                    </div>
                  </div>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* Navigation - show when no search or search is short */}
          {search.length < 2 && (
            <>
              <Command.Group
                heading="Navigation"
                className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
              >
                <CommandItem
                  icon={Activity}
                  label={t("nav.stocks")}
                  shortcut="1"
                  onSelect={() => navigateTo("/")}
                />
                <CommandItem
                  icon={BarChart3}
                  label={t("nav.macro")}
                  shortcut="2"
                  onSelect={() => navigateTo("/macro")}
                />
                <CommandItem
                  icon={Grid3X3}
                  label={t("nav.heatmap")}
                  shortcut="3"
                  onSelect={() => navigateTo("/heatmap")}
                />
                <CommandItem
                  icon={Wallet}
                  label={t("nav.portfolio")}
                  shortcut="4"
                  onSelect={() => navigateTo("/portfolio")}
                />
                <CommandItem
                  icon={CalendarDays}
                  label={t("nav.dividends")}
                  shortcut="5"
                  onSelect={() => navigateTo("/dividends")}
                />
                <CommandItem
                  icon={Bell}
                  label={t("nav.alerts")}
                  shortcut="6"
                  onSelect={() => navigateTo("/alerts")}
                />
                <CommandItem
                  icon={SlidersHorizontal}
                  label={t("nav.screener")}
                  shortcut="7"
                  onSelect={() => navigateTo("/screener")}
                />
                <CommandItem
                  icon={Star}
                  label={t("nav.watchlist")}
                  shortcut="8"
                  onSelect={() => navigateTo("/watchlist")}
                />
                <CommandItem
                  icon={Settings}
                  label={t("nav.settings")}
                  onSelect={() => navigateTo("/settings")}
                />
              </Command.Group>

              <Command.Separator className="my-1 h-px bg-border" />

              <Command.Group
                heading="Actions"
                className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
              >
                <CommandItem
                  icon={mode === "dark" ? Sun : Moon}
                  label={mode === "dark" ? t("theme.light") : t("theme.dark")}
                  shortcut="T"
                  onSelect={() => {
                    toggleTheme();
                    setOpen(false);
                  }}
                />
              </Command.Group>
            </>
          )}
        </Command.List>
      </Command>
    </div>
  );
}

interface CommandItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  onSelect: () => void;
}

function CommandItem({ icon: Icon, label, shortcut, onSelect }: CommandItemProps) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground aria-selected:bg-accent"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1">{label}</span>
      {shortcut && (
        <kbd className="font-data text-[10px] text-muted-foreground">{shortcut}</kbd>
      )}
    </Command.Item>
  );
}
import { useEffect, useState, useCallback, memo } from "react";
import { X, Info, RefreshCw, Download, Bell } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useStockDetail } from "@/features/stocks/api/stock-detail-queries";
import { useRecentStocks } from "@/hooks/use-recent-stocks";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { StockHeader } from "@/features/stocks/components/stock-header";
import { StockFundamentals } from "@/features/stocks/components/stock-fundamentals";
import { HistoryChart } from "@/features/charts/components/history-chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { exportToCsv } from "@/lib/export";
import { AlertForm } from "@/features/alerts/components/alert-form";
import { CheckCircle2 } from "lucide-react";
import { Star } from "lucide-react";
import { InlineTransactionForm } from "@/features/portfolio/components/inline-transaction-form";
import { WatchlistToggle } from "@/features/watchlist/components/watchlist-toggle";

interface StockDetailDrawerProps {
  ticker: string | null;
  onClose: () => void;
}

export function StockDetailDrawer({ ticker, onClose }: StockDetailDrawerProps) {
  const { t } = useTranslation("stocks");
  const { t: ta } = useTranslation("alerts");
  const { t: tc } = useTranslation("common");
  const { data: result, isLoading, isError, refetch } = useStockDetail(ticker);
  const stock = result?.stock ?? null;
  const isMockData = result?.isMockData ?? false;
  const { addRecentStock } = useRecentStocks();
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [showTransactionForm, setShowTransactionForm] = useState(false);

  // Export stock fundamentals as CSV for Croatian investors
  const handleExportCsv = useCallback(() => {
    if (!stock) return;
    const headers = [
      "Ticker",
      "Name",
      "Price (EUR)",
      "Change (%)",
      "Market Cap (M EUR)",
      "P/E Ratio",
      "Dividend Yield (%)",
      "52W High (EUR)",
      "52W Low (EUR)",
      "Volume",
      "Turnover (EUR)",
      "Sector",
      "Shares (M)",
      "ISIN",
    ];
    const rows = [
      [
        stock.ticker,
        stock.name,
        stock.price.toFixed(2),
        stock.changePct.toFixed(2),
        stock.marketCapM != null && stock.marketCapM > 0 ? stock.marketCapM.toFixed(2) : "N/A",
        stock.peRatio !== null ? stock.peRatio.toFixed(1) : "N/A",
        stock.dividendYield !== null ? stock.dividendYield.toFixed(2) : "N/A",
        stock.high52w.toFixed(2),
        stock.low52w.toFixed(2),
        stock.volume.toString(),
        stock.turnover.toFixed(2),
        stock.sector || "N/A",
        stock.sharesM > 0 ? stock.sharesM.toFixed(1) : "N/A",
        stock.isin,
      ],
    ];
    exportToCsv(`zse-${stock.ticker}-${new Date().toISOString().split("T")[0]}`, headers, rows);
    toast.success(t("toast.exported"));
  }, [stock, t]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Focus trap for keyboard accessibility
  const { setContainerRef } = useFocusTrap({
    active: drawerOpen,
    onEscape: onClose,
  });

  // Handle drawer open/close animations and stock tracking
  useEffect(() => {
    if (ticker && stock?.name) {
      addRecentStock(ticker, stock.name);
    }

    if (ticker) {
      // Opening: enable focus trap immediately
      setDrawerOpen(true);
      setIsClosing(false);
    } else if (drawerOpen) {
      // Closing: play exit animation first
      setIsClosing(true);
      const timer = setTimeout(() => {
        setDrawerOpen(false);
        setIsClosing(false);
      }, 200); // Match animation duration
      return () => clearTimeout(timer);
    }
  }, [ticker, stock?.name, addRecentStock, drawerOpen]);

  // Keyboard shortcuts for drawer actions (A=alert, D=download, W=watchlist)
  useEffect(() => {
    if (!drawerOpen || !stock) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't fire when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;


      switch (e.key) {
        case "a":
        case "A":
          e.preventDefault();
          setShowAlertForm(true);
          break;
        case "t":
        case "T":
          e.preventDefault();
          setShowTransactionForm(true);
          break;
        case "d":
        case "D":
          e.preventDefault();
          handleExportCsv();
          break;
        case "w":
        case "W":
          e.preventDefault();
          // Watchlist toggle handled by WatchlistToggle component via click
          document.getElementById(`watchlist-toggle-${stock?.ticker}`)?.click();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen, stock, handleExportCsv]);

  // Don't render anything until first open
  if (!ticker && !drawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/60 backdrop-blur-sm",
          isClosing ? "animate-fade-out" : "animate-fade-in",
        )}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={setContainerRef}
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full flex-col border-l border-border bg-card shadow-2xl",
          isClosing
            ? "animate-[slide-out-right_0.2s_ease-in]"
            : "animate-[slide-in-right_0.2s_ease-out]",
          "max-w-[85vw] md:max-w-xl lg:max-w-2xl xl:max-w-[42rem] 2xl:max-w-[48rem]",
        )}
        role="dialog"
        aria-modal="true"
        aria-label={`${ticker} ${t("detail.title")}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-data text-sm font-bold text-foreground shrink-0">
              {ticker}
            </span>
            {stock && (
              <span className="truncate text-xs text-muted-foreground">
                {stock.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {stock && (
              <>
                <WatchlistToggle
                  id={`watchlist-toggle-${stock.ticker}`}
                  ticker={stock.ticker}
                  className="h-8 w-8"
                />
                <button
                  onClick={() => setShowTransactionForm(true)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title={t("drawer.recordTransaction")}
                >
                  <Star className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t("drawer.recordTransaction")}</span>
                </button>
                <button
                  onClick={() => setShowAlertForm(true)}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title={ta("create")}
                >
                  <Bell className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{ta("create")}</span>
                </button>
                <button
                  onClick={handleExportCsv}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title={t("exportCsv")}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{t("exportCsv")}</span>
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={t("close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Always-visible keyboard shortcuts hint — matching portfolio/stocks pattern */}
        {stock && (
          <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-4 py-1.5 text-[9px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Esc</kbd>
                <span>{t("shortcut.close") || "zatvori"}</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">T</kbd>
                <span>{t("drawer.recordTransaction") || "transakcija"}</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">A</kbd>
                <span>{ta("create") || "alarm"}</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">D</kbd>
                <span>{t("exportCsv") || "CSV"}</span>
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">W</kbd>
              <span>{t("watchlist.add") || "praćenje"}</span>
            </span>
          </div>
        )}

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4">
            {isLoading || !stock ? (
              <DrawerSkeleton />
            ) : isError ? (
              <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  <Info className="h-4 w-4" />
                  <span>{tc("errors.network")}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="gap-2"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {tc("errors.tryAgain")}
                </Button>
              </div>
            ) : (
              <>
                {showAlertForm && (
                  <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                    <AlertForm
                      defaultTicker={ticker ?? undefined}
                      onClose={() => setShowAlertForm(false)}
                      onSuccess={() => {
                        toast.success(ta("toast.created"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
                        setShowAlertForm(false);
                      }}
                    />
                  </div>
                )}

                {showTransactionForm && stock && (
                  <InlineTransactionForm
                    ticker={stock.ticker}
                    currentPrice={stock.price}
                    onClose={() => setShowTransactionForm(false)}
                    onSuccess={() => setShowTransactionForm(false)}
                  />
                )}

                {isMockData && (
                  <div className="flex items-center gap-2 rounded-md border border-border bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
                    <Info className="h-3 w-3 shrink-0" />
                    <span>{t("detail.demoData")}</span>
                  </div>
                )}

                <StockHeader stock={stock} />

                <Separator />

                {/* Chart */}
                <HistoryChart
                  ticker={stock.ticker}
                  chartType="area"
                  height={260}
                />

                <Separator />

                {/* Fundamentals */}
                <StockFundamentals stock={stock} />
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}

const DrawerSkeleton = memo(function DrawerSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-6 w-32 animate-shimmer" />
        <Skeleton className="h-8 w-48 animate-shimmer" />
        <Skeleton className="h-4 w-64 animate-shimmer" />
      </div>
      <Skeleton className="h-px w-full animate-shimmer" />
      <Skeleton className="h-[260px] w-full animate-shimmer" />
      <Skeleton className="h-px w-full animate-shimmer" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 animate-shimmer" />
        ))}
      </div>
    </div>
  );
});

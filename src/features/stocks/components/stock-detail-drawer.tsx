import { useEffect, useState } from "react";
import { X, Info, Keyboard, RefreshCw } from "lucide-react";
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

interface StockDetailDrawerProps {
  ticker: string | null;
  onClose: () => void;
}

export function StockDetailDrawer({ ticker, onClose }: StockDetailDrawerProps) {
  const { t } = useTranslation("stocks");
  const { t: tc } = useTranslation("common");
  const { data: result, isLoading, isError, refetch } = useStockDetail(ticker);
  const stock = result?.stock ?? null;
  const isMockData = result?.isMockData ?? false;
  const { addRecentStock } = useRecentStocks();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Focus trap for keyboard accessibility
  const { setContainerRef } = useFocusTrap({
    active: drawerOpen,
    onEscape: onClose,
  });

  // Record stock view when drawer opens with valid stock
  useEffect(() => {
    if (ticker && stock?.name) {
      addRecentStock(ticker, stock.name);
    }
    // Set drawer open state after mount to enable focus trap
    if (ticker) {
      const timer = setTimeout(() => setDrawerOpen(true), 0);
      return () => {
        clearTimeout(timer);
        setDrawerOpen(false);
      };
    }
  }, [ticker, stock?.name, addRecentStock]);

  if (!ticker) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={setContainerRef}
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-border bg-card shadow-2xl",
          "animate-[slide-in-right_0.2s_ease-out]",
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
            <span className="hidden items-center gap-1 text-[10px] text-muted-foreground md:flex">
              <Keyboard className="h-3 w-3" />
              Esc
            </span>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label={t("close")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

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

function DrawerSkeleton() {
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
}

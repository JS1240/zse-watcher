import { X, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useStockDetail } from "@/features/stocks/api/stock-detail-queries";
import { StockHeader } from "@/features/stocks/components/stock-header";
import { StockFundamentals } from "@/features/stocks/components/stock-fundamentals";
import { HistoryChart } from "@/features/charts/components/history-chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface StockDetailDrawerProps {
  ticker: string | null;
  onClose: () => void;
}

export function StockDetailDrawer({ ticker, onClose }: StockDetailDrawerProps) {
  const { t } = useTranslation("stocks");
  const { data: result, isLoading } = useStockDetail(ticker);
  const stock = result?.stock ?? null;
  const isMockData = result?.isMockData ?? false;

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
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-border bg-card shadow-2xl",
          "animate-[slide-in-right_0.2s_ease-out]",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="font-data text-sm font-bold text-foreground">
            {ticker}
          </span>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="space-y-4 p-4">
            {isLoading || !stock ? (
              <DrawerSkeleton />
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
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-px w-full" />
      <Skeleton className="h-[260px] w-full" />
      <Skeleton className="h-px w-full" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </div>
    </div>
  );
}

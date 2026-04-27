import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { LazyTradingChart } from "@/features/charts/components/lazy-trading-chart";
import { ChartSkeleton } from "@/features/charts/components/chart-skeleton";
import { useStockHistory } from "@/features/stocks/api/stock-detail-queries";
import { CHART_RANGES, type ChartRange } from "@/config/constants";
import { ErrorState } from "@/components/shared/error-state";
import { cn } from "@/lib/utils";
import { exportToCsv } from "@/lib/export";
import { Download, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface HistoryChartProps {
  ticker: string;
  chartType?: "area" | "candlestick";
  height?: number;
  showExport?: boolean;
}

export function HistoryChart({
  ticker,
  chartType = "area",
  height = 300,
  showExport = true,
}: HistoryChartProps) {
  const [range, setRange] = useState<ChartRange>("1M");
  const { t } = useTranslation("stocks");
  const { data: history, isLoading, isError, refetch } = useStockHistory(ticker, range);

  if (isError) {
    return (
      <ErrorState
        title={t("chart.loadError")}
        description={t("errors.network")}
        retry={{ onRetry: refetch, label: t("errors.tryAgain") }}
      />
    );
  }

  // Export price history as CSV
  const handleExport = useMemo(() => {
    return () => {
      if (!history || history.length === 0) return;
      const headers = ["Date", "Open (EUR)", "High (EUR)", "Low (EUR)", "Close (EUR)", "Volume"];
      const rows = history.map((point) => [
        point.time,
        point.open?.toFixed(2) ?? "N/A",
        point.high?.toFixed(2) ?? "N/A",
        point.low?.toFixed(2) ?? "N/A",
        point.close?.toFixed(2) ?? "N/A",
        point.volume?.toString() ?? "N/A",
      ]);
      exportToCsv(`${ticker}-price-history-${range}-${new Date().toISOString().split("T")[0]}`, headers, rows);
      toast.success(t("toast.historyExported") || "Price history exported", { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
    };
  }, [history, range, ticker, t]);

  return (
    <div className="flex flex-col gap-2">
      {/* Range selector + Export */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {CHART_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-sm px-2 py-1 font-data text-[10px] font-medium transition-colors",
                range === r
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {t(`ranges.${r}`, r)}
            </button>
          ))}
        </div>
        {showExport && (
          <button
            onClick={handleExport}
            disabled={!history || history.length === 0}
            className="flex items-center gap-1 rounded-sm px-2 py-1 font-data text-[10px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
            title={t("exportHistory") || "Export price history"}
          >
            <Download className="h-3 w-3" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        )}
      </div>

      {/* Chart */}
      {isLoading ? (
        <ChartSkeleton height={height} />
      ) : history && history.length > 0 ? (
        <LazyTradingChart
          data={history}
          chartType={chartType}
          height={height}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-md border border-border bg-card text-xs text-muted-foreground"
          style={{ height: `${height}px` }}
        >
          {t("chart.noData")}
        </div>
      )}
    </div>
  );
}

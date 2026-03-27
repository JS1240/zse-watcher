import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TradingChart } from "@/features/charts/components/trading-chart";
import { useStockHistory } from "@/features/stocks/api/stock-detail-queries";
import { CHART_RANGES, type ChartRange } from "@/config/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface HistoryChartProps {
  ticker: string;
  chartType?: "area" | "candlestick";
  height?: number;
}

export function HistoryChart({
  ticker,
  chartType = "area",
  height = 300,
}: HistoryChartProps) {
  const [range, setRange] = useState<ChartRange>("1M");
  const { t } = useTranslation("stocks");
  const { data: history, isLoading } = useStockHistory(ticker, range);

  return (
    <div className="flex flex-col gap-2">
      {/* Range selector */}
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

      {/* Chart */}
      {isLoading ? (
        <Skeleton className="w-full" style={{ height: `${height}px` }} />
      ) : history && history.length > 0 ? (
        <TradingChart
          data={history}
          chartType={chartType}
          height={height}
        />
      ) : (
        <div
          className="flex items-center justify-center rounded-md border border-border bg-card text-xs text-muted-foreground"
          style={{ height: `${height}px` }}
        >
          No chart data available
        </div>
      )}
    </div>
  );
}

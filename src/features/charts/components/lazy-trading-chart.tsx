import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { PricePoint } from "@/types/stock";

const TradingChart = lazy(() =>
  import("@/features/charts/components/trading-chart").then((m) => ({
    default: m.TradingChart,
  })),
);

interface LazyTradingChartProps {
  data: PricePoint[];
  chartType?: "area" | "candlestick";
  height?: number;
  className?: string;
}

export function LazyTradingChart({
  data,
  chartType = "area",
  height = 300,
  className,
}: LazyTradingChartProps) {
  return (
    <Suspense
      fallback={
        <Skeleton
          className={className}
          style={{ height: `${height}px`, width: "100%" }}
        />
      }
    >
      <TradingChart
        data={data}
        chartType={chartType}
        height={height}
        className={className}
      />
    </Suspense>
  );
}

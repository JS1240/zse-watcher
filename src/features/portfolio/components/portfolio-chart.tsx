import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { usePortfolioHistory } from "@/features/portfolio/hooks/use-portfolio-history";
import { CHART_RANGES, type ChartRange } from "@/config/constants";
import { formatCurrency } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PortfolioChartProps {
  className?: string;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-sm border border-border bg-card px-2 py-1.5 shadow-sm">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="font-data text-sm font-semibold text-foreground">
        {formatCurrency(payload[0].value)}
      </p>
    </div>
  );
}

export function PortfolioChart({ className }: PortfolioChartProps) {
  const { t } = useTranslation("stocks");
  const [range, setRange] = useState<ChartRange>("1M");
  const history = usePortfolioHistory(range);

  const firstValue = history[0]?.value ?? 0;
  const lastValue = history[history.length - 1]?.value ?? 0;
  const change = lastValue - firstValue;
  const changePct = firstValue > 0 ? (change / firstValue) * 100 : 0;
  const isUp = change >= 0;

  const formatXAxis = (dateStr: string) => {
    const date = new Date(dateStr);
    if (range === "1D" || range === "1W") {
      return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    }
    return date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
  };

  if (!history.length) {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
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
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Range selector */}
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
        <div className="flex items-baseline gap-1.5">
          <span
            className={cn(
              "font-data text-sm font-bold tabular-nums",
              isUp ? "text-price-up" : "text-price-down",
            )}
          >
            {isUp ? "+" : ""}
            {formatCurrency(change)}
          </span>
          <span
            className={cn(
              "font-data text-[10px] tabular-nums",
              isUp ? "text-price-up" : "text-price-down",
            )}
          >
            ({isUp ? "+" : ""}
            {changePct.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isUp ? "var(--color-price-up)" : "var(--color-price-down)"}
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor={isUp ? "var(--color-price-up)" : "var(--color-price-down)"}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={60}
              domain={["auto", "auto"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={firstValue} stroke="var(--color-border)" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isUp ? "var(--color-price-up)" : "var(--color-price-down)"}
              strokeWidth={1.5}
              fill="url(#portfolioGradient)"
              dot={false}
              activeDot={{ r: 3, fill: isUp ? "var(--color-price-up)" : "var(--color-price-down)" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

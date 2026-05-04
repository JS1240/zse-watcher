import type { Meta, StoryObj } from "@storybook/react";
import type { PortfolioDataPoint } from "@/features/portfolio/hooks/use-portfolio-history";

// Mock portfolio history data for stories
const MOCK_HISTORY_UP: PortfolioDataPoint[] = [
  { date: "2026-04-01", value: 10000, cost: 9000 },
  { date: "2026-04-08", value: 10200, cost: 9000 },
  { date: "2026-04-15", value: 10100, cost: 9000 },
  { date: "2026-04-22", value: 10400, cost: 9000 },
  { date: "2026-04-29", value: 10800, cost: 9000 },
  { date: "2026-05-01", value: 11000, cost: 9000 },
  { date: "2026-05-04", value: 11200, cost: 9000 },
];

const MOCK_HISTORY_DOWN: PortfolioDataPoint[] = [
  { date: "2026-04-01", value: 12000, cost: 11000 },
  { date: "2026-04-08", value: 11800, cost: 11000 },
  { date: "2026-04-15", value: 11500, cost: 11000 },
  { date: "2026-04-22", value: 11200, cost: 11000 },
  { date: "2026-04-29", value: 11000, cost: 11000 },
  { date: "2026-05-01", value: 10800, cost: 11000 },
  { date: "2026-05-04", value: 10600, cost: 11000 },
];

const meta: Meta<typeof PortfolioChartStoryWrapper> = {
  title: "Portfolio/PortfolioChart",
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Portfolio performance area chart with range selector (1D/1W/1M/3M/6M/1Y). Shows gain/loss delta, gradient fill, and reference line at starting value. Croatian retail investors track portfolio performance at a glance.",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    mode: {
      control: "select",
      options: ["up", "down", "empty", "flat"],
      description: "Story mode: up/down trend, empty state, or flat",
    },
    height: {
      control: "number",
      min: 150,
      max: 400,
    },
  },
};

export default meta;

// Wrapper component that simulates PortfolioChart behavior
import { useState } from "react";
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
import { CHART_RANGES, type ChartRange } from "@/config/constants";
import { formatCurrency } from "@/lib/formatters";
import { EmptyState } from "@/components/shared/empty-state";
import { ChartEmptyIllustration } from "@/components/shared/empty-illustrations";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

function PortfolioChartStoryWrapper({ mode, height = 220 }: { mode?: string; height?: number }) {
  const { t } = useTranslation("stocks");
  const [range, setRange] = useState<ChartRange>("1M");

  const history = mode === "empty"
    ? []
    : mode === "up"
    ? MOCK_HISTORY_UP
    : mode === "down"
    ? MOCK_HISTORY_DOWN
    : MOCK_HISTORY_UP.map((p) => ({ ...p, value: 11000 }));

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

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-sm border border-border bg-card px-2 py-1.5 shadow-sm">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="font-data text-sm font-semibold text-foreground">
          {formatCurrency(payload[0].value)}
        </p>
      </div>
    );
  };

  if (!history.length) {
    return (
      <div className={cn("flex flex-col gap-3", mode === "story" ? "" : "rounded-lg border border-border p-4")}>
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
        <EmptyState
          icon={<ChartEmptyIllustration className="h-8 w-8" />}
          title={t("chart.noData")}
          description={t("chart.emptyDescription")}
          variant="info"
          className="rounded-md border border-border py-6"
        />
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", mode === "story" ? "" : "rounded-lg border border-border p-4")}>
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
      <div style={{ height }} className="w-full">
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

type Story = StoryObj<typeof PortfolioChartStoryWrapper>;

export const Default: Story = {
  args: {
    mode: "up",
    height: 220,
  },
  name: "Uptrend",
};

export const Downtrend: Story = {
  args: {
    mode: "down",
    height: 220,
  },
  name: "Downtrend",
};

export const FlatTrend: Story = {
  args: {
    mode: "flat",
    height: 220,
  },
  name: "Flat Trend",
};

export const EmptyStateStory: Story = {
  args: {
    mode: "empty",
    height: 220,
  },
  name: "Empty State",
};

export const TallChart: Story = {
  args: {
    mode: "up",
    height: 320,
  },
  name: "Tall (320px)",
};
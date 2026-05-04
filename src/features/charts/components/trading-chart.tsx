import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import {
  createChart,
  type IChartApi,
  CandlestickSeries,
  AreaSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
} from "lightweight-charts";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/shared/empty-state";
import { ChartEmptyIllustration } from "@/components/shared/empty-illustrations";
import type { PricePoint } from "@/types/stock";

/** Get responsive chart height based on container width */
function getResponsiveHeight(containerWidth: number, requestedHeight?: number): number {
  const baseHeight = requestedHeight ?? 300;
  
  // Scale down on narrow screens
  if (containerWidth < 400) {
    return Math.min(200, baseHeight * 0.65);
  }
  if (containerWidth < 640) {
    return Math.min(250, baseHeight * 0.8);
  }
  return baseHeight;
}

interface TradingChartProps {
  data: PricePoint[];
  chartType?: "area" | "candlestick";
  height?: number;
  className?: string;
  /** Callback to retry loading data (e.g., refetch from API) */
  onRetry?: () => void;
  /** Whether data is currently loading */
  isLoading?: boolean;
}

export function TradingChart({
  data,
  chartType = "area",
  height = 300,
  className,
  onRetry,
  isLoading,
}: TradingChartProps) {
  const { t } = useTranslation("common");
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [currentHeight, setCurrentHeight] = useState(height);

  // Check if we have data
  const hasData = data.length > 0;

  const getThemeColors = useCallback(() => {
    const isDark = document.documentElement.classList.contains("dark");
    return {
      background: isDark ? "#0f1117" : "#fafafa",
      textColor: isDark ? "#828a97" : "#71717a",
      gridColor: isDark ? "rgba(42, 46, 57, 0.3)" : "rgba(228, 228, 231, 0.5)",
      lineColor: isDark ? "#da2b2b" : "#dc2626",
      areaTopColor: isDark ? "rgba(218, 43, 43, 0.3)" : "rgba(220, 38, 38, 0.2)",
      areaBottomColor: isDark ? "rgba(218, 43, 43, 0.02)" : "rgba(220, 38, 38, 0.02)",
      upColor: "#22c55e",
      downColor: "#ef4444",
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const colors = getThemeColors();

    const chart = createChart(containerRef.current, {
      height,
      layout: {
        background: { type: ColorType.Solid, color: colors.background },
        textColor: colors.textColor,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
      },
      grid: {
        vertLines: { color: colors.gridColor },
        horzLines: { color: colors.gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: colors.gridColor,
      },
      timeScale: {
        borderColor: colors.gridColor,
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    chartRef.current = chart;

    // Create price series
    if (chartType === "candlestick") {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: colors.upColor,
        downColor: colors.downColor,
        borderUpColor: colors.upColor,
        borderDownColor: colors.downColor,
        wickUpColor: colors.upColor,
        wickDownColor: colors.downColor,
      });

      if (data.length > 0) {
        series.setData(
          data.map((d) => ({
            time: d.time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          })),
        );
      }
    } else {
      const series = chart.addSeries(AreaSeries, {
        lineColor: colors.lineColor,
        topColor: colors.areaTopColor,
        bottomColor: colors.areaBottomColor,
        lineWidth: 2,
      });

      if (data.length > 0) {
        series.setData(
          data.map((d) => ({
            time: d.time,
            value: d.close,
          })),
        );
      }
    }

    // Volume histogram
    const isDark = document.documentElement.classList.contains("dark");
    const volumeColor = isDark ? "rgba(130, 138, 151, 0.2)" : "rgba(113, 113, 122, 0.15)";

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: volumeColor,
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });

    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.85, bottom: 0 },
    });

    if (data.length > 0) {
      volumeSeries.setData(
        data.map((d) => ({
          time: d.time,
          value: d.volume,
          color: d.close >= d.open ? `${colors.upColor}33` : `${colors.downColor}33`,
        })),
      );

      chart.timeScale().fitContent();
    }

    // Subscribe to crosshair move for OHLCV display
    const handleCrosshairMove = useCallback(
      (param: { time?: unknown; price?: number; point?: { x: number; y: number } }) => {
        if (!param.time || !param.point) return;
        // lightweight-charts uses UTCTimestamp (number) internally
        const timeKey = param.time as string | number;
        const dataPoint = data.find((d) => String(d.time) === String(timeKey));
        if (!dataPoint) return;
        // Tooltip is handled via container ref + portal — emit event for parent to display
        const container = containerRef.current;
        if (!container) return;
        container.dispatchEvent(
          new CustomEvent("chart-tooltip", {
            detail: {
              time: dataPoint.time,
              open: dataPoint.open,
              high: dataPoint.high,
              low: dataPoint.low,
              close: dataPoint.close,
              volume: dataPoint.volume,
              x: param.point.x,
              y: param.point.y,
            },
            bubbles: true,
          }),
        );
      },
      [data],
    );

    chart.subscribeCrosshairMove(handleCrosshairMove);

    // Resize observer with responsive height
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        chart.applyOptions({ width });

        // Adjust height for screen size
        const newHeight = getResponsiveHeight(width, height);
        if (newHeight !== currentHeight) {
          setCurrentHeight(newHeight);
          chart.applyOptions({ height: newHeight });
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [data, chartType, height, getThemeColors, currentHeight]);

  // OHLCV tooltip state — updated via chart-tooltip custom events from crosshair
  const [tooltipData, setTooltipData] = useState<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    x: number;
    y: number;
  } | null>(null);

  // Subscribe to chart-tooltip events from the container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleTooltip = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setTooltipData(detail);
    };

    const handleMouseLeave = () => setTooltipData(null);

    container.addEventListener("chart-tooltip", handleTooltip);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("chart-tooltip", handleTooltip);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  // Format timestamp for display
  const formatTooltipTime = useCallback(
    (time: string) => {
      const ts = Number(time);
      const date = new Date(ts * 1000);
      return date.toLocaleString("hr-HR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
    [],
  );

  // Memoized formatting for OHLCV values to avoid re-renders
  const ohlcvLabels = useMemo(() => {
    if (!tooltipData) return null;
    const { open, high, low, close, volume } = tooltipData;
    const fmt = (n: number) => n.toFixed(2);
    const change = close - open;
    const changePct = open !== 0 ? ((change / open) * 100).toFixed(2) : "0.00";
    return {
      O: fmt(open),
      H: fmt(high),
      L: fmt(low),
      C: fmt(close),
      V: volume >= 1000 ? `${(volume / 1000).toFixed(0)}K` : volume.toFixed(0),
      change: change >= 0 ? `+${change.toFixed(2)}` : change.toFixed(2),
      changePct: change >= 0 ? `+${changePct}%` : `${changePct}%`,
      isUp: change >= 0,
    };
  }, [tooltipData]);

  // Render empty state when no data is available
  if (!isLoading && !hasData) {
    return (
      <EmptyState
        icon={<ChartEmptyIllustration className="h-12 w-12" />}
        title={t("empty.noChartData")}
        description={t("empty.noChartDataDescription")}
        action={onRetry ? { label: t("empty.retry"), onClick: onRetry } : undefined}
        variant="info"
        className={className}
        style={{ height: `${currentHeight}px` }}
      />
    );
  }

  return (
    <div className="relative" style={{ width: "100%", height: `${currentHeight}px` }}>
      <div
        ref={containerRef}
        className={className}
        style={{ width: "100%", height: "100%" }}
      />

      {/* OHLCV tooltip overlay — appears on crosshair hover */}
      {tooltipData && ohlcvLabels && (
        <div
          className="pointer-events-none absolute z-20 rounded-md border border-border bg-popover/95 px-2.5 py-1.5 shadow-lg backdrop-blur"
          style={{
            left: Math.min(tooltipData.x + 12, 300),
            top: Math.max(tooltipData.y - 40, 8),
          }}
        >
          <div className="mb-1 flex items-center justify-between gap-3 font-data text-[10px] text-muted-foreground">
            <span>{formatTooltipTime(tooltipData.time)}</span>
            <span className={ohlcvLabels.isUp ? "text-price-up" : "text-price-down"}>
              {ohlcvLabels.change} ({ohlcvLabels.changePct})
            </span>
          </div>
          <div className="grid grid-cols-5 gap-x-2 gap-y-0.5 font-data text-[10px] tabular-nums">
            <span className="text-muted-foreground">O</span>
            <span className="text-muted-foreground">H</span>
            <span className="text-muted-foreground">L</span>
            <span className="text-muted-foreground">C</span>
            <span className="text-muted-foreground">V</span>
            <span className={ohlcvLabels.isUp ? "text-price-up" : "text-price-down"}>{ohlcvLabels.O}</span>
            <span className={ohlcvLabels.isUp ? "text-price-up" : "text-price-down"}>{ohlcvLabels.H}</span>
            <span className={ohlcvLabels.isUp ? "text-price-up" : "text-price-down"}>{ohlcvLabels.L}</span>
            <span className={ohlcvLabels.isUp ? "text-price-up" : "text-price-down"}>{ohlcvLabels.C}</span>
            <span className="text-foreground">{ohlcvLabels.V}</span>
          </div>
        </div>
      )}
    </div>
  );
}

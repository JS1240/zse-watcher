import { useRef, useEffect, useCallback } from "react";
import {
  createChart,
  type IChartApi,
  CandlestickSeries,
  AreaSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
} from "lightweight-charts";
import type { PricePoint } from "@/types/stock";

interface TradingChartProps {
  data: PricePoint[];
  chartType?: "area" | "candlestick";
  height?: number;
  className?: string;
}

export function TradingChart({
  data,
  chartType = "area",
  height = 300,
  className,
}: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

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

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        chart.applyOptions({ width });
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [data, chartType, height, getThemeColors]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: `${height}px` }}
    />
  );
}

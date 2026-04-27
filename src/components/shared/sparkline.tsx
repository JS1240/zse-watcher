import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Memoized sparkline component for performance optimization.
 * Only re-renders when data actually changes, preventing unnecessary
 * re-renders when parent components receive new stock data.
 */
export const Sparkline = memo(function Sparkline({
  data,
  width = 60,
  height = 20,
  className,
}: SparklineProps) {
  // Memoize the derived values to prevent recalculation on every render
  const { points, isUp } = useMemo(() => {
    if (data.length < 2) {
      return { points: "", isUp: false };
    }
    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);
    const rangeVal = maxVal - minVal || 1;
    
    const pointsVal = data
      .map((value, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((value - minVal) / rangeVal) * height;
        return `${x},${y}`;
      })
      .join(" ");

    return {
      points: pointsVal,
      isUp: data[data.length - 1] >= data[0],
    };
  }, [data, width, height]);

  if (data.length < 2) return null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("overflow-visible", className)}
    >
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? "var(--color-price-up)" : "var(--color-price-down)"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if data actually changed
  if (prevProps.width !== nextProps.width || prevProps.height !== nextProps.height || prevProps.className !== nextProps.className) {
    return false; // props changed, re-render
  }
  
  // Deep compare data arrays
  if (prevProps.data.length !== nextProps.data.length) {
    return false;
  }
  
  for (let i = 0; i < prevProps.data.length; i++) {
    if (prevProps.data[i] !== nextProps.data[i]) {
      return false;
    }
  }
  
  return true; // data is identical, skip re-render
});

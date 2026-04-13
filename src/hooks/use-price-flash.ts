import { useRef, useState, useEffect, useMemo } from "react";
import type { Stock } from "@/types/stock";

type FlashDirection = "up" | "down" | null;

/**
 * Detects price changes between renders and returns the flash direction
 * for any stocks whose price actually changed. Memoized to only return new map
 * when actual changes occur.
 */
export function usePriceFlash(stocks: Stock[] | null): Map<string, FlashDirection> {
  const prevRef = useRef<Map<string, number>>(new Map());
  const [flashMap, setFlashMap] = useState<Map<string, FlashDirection>>(new Map());
  const stocksJson = useMemo(() => JSON.stringify(stocks?.map(s => ({ t: s.ticker, p: s.price })) ?? []), [stocks]);

  useEffect(() => {
    if (!stocks) return;

    const prev = prevRef.current;
    const newFlashes = new Map<string, FlashDirection>();

    for (const stock of stocks) {
      const prevPrice = prev.get(stock.ticker);
      if (prevPrice !== undefined && prevPrice !== stock.price) {
        newFlashes.set(stock.ticker, stock.price > prevPrice ? "up" : "down");
      }
      prev.set(stock.ticker, stock.price);
    }

    // Only update if there are actual changes
    if (newFlashes.size > 0) {
      // Create new map to trigger re-render
      setFlashMap(() => {
        const next = new Map<string, FlashDirection>();
        newFlashes.forEach((v, k) => next.set(k, v));
        return next;
      });
      // Clear flashes after animation duration
      const timer = setTimeout(() => setFlashMap(new Map()), 800);
      return () => clearTimeout(timer);
    }
  }, [stocksJson]);

  return flashMap;
}

import { useRef, useState, useEffect } from "react";
import type { Stock } from "@/types/stock";

type FlashDirection = "up" | "down" | null;

/**
 * Detects price changes between renders and returns the flash direction
 * for any stocks whose price changed. Clears flash after 800ms to allow re-trigger.
 */
export function usePriceFlash(stocks: Stock[] | null): Map<string, FlashDirection> {
  const prevRef = useRef<Map<string, number> | null>(null);
  const [flashMap, setFlashMap] = useState<Map<string, FlashDirection>>(new Map());

  useEffect(() => {
    if (!stocks) return;

    const prev = prevRef.current ?? new Map();
    const next = new Map<string, number>();
    const newFlashes = new Map<string, FlashDirection>();

    for (const stock of stocks) {
      next.set(stock.ticker, stock.price);
      const prevPrice = prev.get(stock.ticker);
      if (prevPrice !== undefined && prevPrice !== stock.price) {
        newFlashes.set(stock.ticker, stock.price > prevPrice ? "up" : "down");
      }
    }

    prevRef.current = next;

    if (newFlashes.size > 0) {
      setFlashMap(newFlashes);
      // Clear flashes after animation duration
      const timer = setTimeout(() => setFlashMap(new Map()), 800);
      return () => clearTimeout(timer);
    }
  }, [stocks]);

  return flashMap;
}

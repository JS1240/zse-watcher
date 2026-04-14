import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "zse-recent-stocks";
const MAX_RECENT = 5;

interface RecentStock {
  ticker: string;
  name: string;
  viewedAt: number;
}

function getRecentStocks(): RecentStock[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecentStocks(stocks: RecentStock[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stocks));
  } catch {
    // Storage full or unavailable
  }
}

export function useRecentStocks() {
  const [recentStocks, setRecentStocks] = useState<RecentStock[]>([]);

  // Load on mount
  useEffect(() => {
    setRecentStocks(getRecentStocks());
  }, []);

  const addRecentStock = useCallback((ticker: string, name: string) => {
    setRecentStocks((prev) => {
      // Remove if already exists
      const filtered = prev.filter((s) => s.ticker !== ticker);
      // Add to front
      const updated = [{ ticker, name, viewedAt: Date.now() }, ...filtered];
      // Keep only MAX_RECENT
      const trimmed = updated.slice(0, MAX_RECENT);
      saveRecentStocks(trimmed);
      return trimmed;
    });
  }, []);

  const clearRecentStocks = useCallback(() => {
    setRecentStocks([]);
    saveRecentStocks([]);
  }, []);

  return { recentStocks, addRecentStock, clearRecentStocks };
}

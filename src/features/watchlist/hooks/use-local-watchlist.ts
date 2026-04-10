import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";

const STORAGE_KEY = "zse-local-watchlist";

export interface LocalWatchlistItem {
  ticker: string;
  addedAt: string;
}

function getStorageItems(): LocalWatchlistItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LocalWatchlistItem[]) : [];
  } catch {
    return [];
  }
}

function setStorageItems(items: LocalWatchlistItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Quota exceeded or other storage error — silently fail
  }
}

export function useLocalWatchlist() {
  const queryClient = useQueryClient();

  const items = getStorageItems();

  const addItem = useCallback((ticker: string) => {
    const current = getStorageItems();
    if (current.some((i) => i.ticker === ticker)) return;
    setStorageItems([...current, { ticker, addedAt: new Date().toISOString() }]);
    queryClient.setQueryData(["local-watchlist"], getStorageItems());
    queryClient.invalidateQueries({ queryKey: ["local-watchlist"] });
  }, [queryClient]);

  const removeItem = useCallback((ticker: string) => {
    const current = getStorageItems();
    setStorageItems(current.filter((i) => i.ticker !== ticker));
    queryClient.setQueryData(["local-watchlist"], getStorageItems());
    queryClient.invalidateQueries({ queryKey: ["local-watchlist"] });
  }, [queryClient]);

  const clearAll = useCallback(() => {
    setStorageItems([]);
    queryClient.setQueryData(["local-watchlist"], []);
    queryClient.invalidateQueries({ queryKey: ["local-watchlist"] });
  }, [queryClient]);

  return { items, addItem, removeItem, clearAll };
}

import { create } from "zustand";

interface SelectedStockState {
  selectedTicker: string | null;
  select: (ticker: string) => void;
  clear: () => void;
  urlTicker: string | null; // Track ticker from URL for deep linking
}

// Get initial ticker from URL hash (for deep linking)
const getInitialTickerFromHash = (): string | null => {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.slice(1).toUpperCase();
  return hash && /^[A-Z0-9.-]+$/.test(hash) ? hash : null;
};

export const useSelectedStock = create<SelectedStockState>()((set) => ({
  selectedTicker: null,
  urlTicker: getInitialTickerFromHash(),
  select: (ticker) => {
    // Update URL hash for deep linking
    if (typeof window !== "undefined") {
      window.location.hash = ticker;
    }
    set({ selectedTicker: ticker });
  },
  clear: () => {
    // Clear URL hash
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", window.location.pathname);
    }
    set({ selectedTicker: null });
  },
}));

// Hook to initialize deep linking from URL - call once in AppShell
export function useStockDeepLink() {
  const { urlTicker, select } = useSelectedStock();
  return { initFromUrl: urlTicker, select };
}

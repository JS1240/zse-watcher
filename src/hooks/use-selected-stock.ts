import { create } from "zustand";

interface SelectedStockState {
  selectedTicker: string | null;
  select: (ticker: string) => void;
  clear: () => void;
}

export const useSelectedStock = create<SelectedStockState>()((set) => ({
  selectedTicker: null,
  select: (ticker) => set({ selectedTicker: ticker }),
  clear: () => set({ selectedTicker: null }),
}));

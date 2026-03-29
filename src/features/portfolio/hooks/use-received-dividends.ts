import { useCallback } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

const STORAGE_KEY = "zse-received-dividends";

export interface ReceivedDividend {
  id: string;
  ticker: string;
  shares: number;
  amountPerShare: number;
  totalAmount: number;
  currency: "EUR" | "HRK";
  payDate: string;
  notes: string | null;
  createdAt: string;
}

interface ReceivedDividendsState {
  dividends: ReceivedDividend[];
  addDividend: (d: Omit<ReceivedDividend, "id" | "createdAt">) => ReceivedDividend;
  removeDividend: (id: string) => void;
  clearDividends: () => void;
  hasDividends: boolean;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useReceivedDividends(): ReceivedDividendsState {
  const [dividends, setDividends] = useLocalStorage<ReceivedDividend[]>(STORAGE_KEY, []);

  const addDividend = useCallback(
    (d: Omit<ReceivedDividend, "id" | "createdAt">): ReceivedDividend => {
      const newDiv: ReceivedDividend = {
        ...d,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      setDividends((prev) => [newDiv, ...prev]);
      return newDiv;
    },
    [setDividends],
  );

  const removeDividend = useCallback(
    (id: string) => {
      setDividends((prev) => prev.filter((d) => d.id !== id));
    },
    [setDividends],
  );

  const clearDividends = useCallback(() => {
    setDividends([]);
  }, [setDividends]);

  return {
    dividends,
    addDividend,
    removeDividend,
    clearDividends,
    hasDividends: dividends.length > 0,
  };
}

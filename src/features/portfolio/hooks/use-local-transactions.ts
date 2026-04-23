import { useCallback } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

const STORAGE_KEY = "zse-portfolio-transactions";

export interface LocalTransaction {
  id: string;
  ticker: string;
  transactionType: "buy" | "sell" | "dividend";
  shares: number;
  pricePerShare: number;
  totalAmount: number;
  transactionDate: string;
  notes: string | null;
  createdAt: string;
}

interface LocalTransactionsState {
  transactions: LocalTransaction[];
  addTransaction: (tx: Omit<LocalTransaction, "id" | "createdAt">) => LocalTransaction;
  removeTransaction: (id: string) => void;
  updateTransaction: (id: string, updates: Partial<Omit<LocalTransaction, "id" | "createdAt">>) => void;
  clearTransactions: () => void;
  hasLocalTransactions: boolean;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useLocalTransactions(): LocalTransactionsState {
  const [transactions, setTransactions] = useLocalStorage<LocalTransaction[]>(
    STORAGE_KEY,
    [],
  );

  const addTransaction = useCallback(
    (tx: Omit<LocalTransaction, "id" | "createdAt">): LocalTransaction => {
      const newTx: LocalTransaction = {
        ...tx,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };

      setTransactions((prev) => [newTx, ...prev]);
      return newTx;
    },
    [setTransactions],
  );

  const removeTransaction = useCallback(
    (id: string) => {
      setTransactions((prev) => prev.filter((tx) => tx.id !== id));
    },
    [setTransactions],
  );

  const clearTransactions = useCallback(() => {
    setTransactions([]);
  }, [setTransactions]);

  const updateTransaction = useCallback(
    (id: string, updates: Partial<Omit<LocalTransaction, "id" | "createdAt">>) => {
      setTransactions((prev) =>
        prev.map((tx) =>
          tx.id === id ? { ...tx, ...updates } : tx
        )
      );
    },
    [setTransactions]);

  return {
    transactions,
    addTransaction,
    removeTransaction,
    updateTransaction,
    clearTransactions,
    hasLocalTransactions: transactions.length > 0,
  };
}

// Transform local transaction to the shape used by usePortfolioHoldings
export function localTransactionToHolding(tx: LocalTransaction): {
  ticker: string;
  totalShares: number;
  avgPrice: number;
  totalCost: number;
} {
  return {
    ticker: tx.ticker,
    totalShares: tx.transactionType === "buy" ? tx.shares : tx.shares,
    avgPrice: tx.pricePerShare,
    totalCost: tx.totalAmount,
  };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/config/supabase";
import { useAuth } from "@/hooks/use-auth";
import { REFETCH_INTERVALS } from "@/config/constants";
import { createLogger } from "@/lib/logger";
import { toast } from "sonner";

const logger = createLogger("PortfolioQueries");

interface PortfolioRow {
  id: string;
  name: string;
}

interface TransactionRow {
  id: string;
  ticker: string;
  transaction_type: string;
  shares: number;
  price_per_share: number;
  total_amount: number;
  transaction_date: string;
  notes: string | null;
}

export interface Holding {
  ticker: string;
  totalShares: number;
  avgPrice: number;
  totalCost: number;
}

async function fetchPortfolio(userId: string): Promise<{ portfolio: PortfolioRow | null; transactions: TransactionRow[] }> {
  const { data: portfolios } = await supabase
    .from("portfolios")
    .select("id, name")
    .eq("user_id", userId)
    .order("created_at")
    .limit(1);

  if (!portfolios?.length) return { portfolio: null, transactions: [] };

  const portfolio = portfolios[0];

  const { data: transactions, error } = await supabase
    .from("portfolio_transactions")
    .select("id, ticker, transaction_type, shares, price_per_share, total_amount, transaction_date, notes")
    .eq("portfolio_id", portfolio.id)
    .order("transaction_date", { ascending: false });

  if (error) {
    logger.error("Failed to fetch transactions", error);
    return { portfolio, transactions: [] };
  }

  return { portfolio, transactions: transactions ?? [] };
}

export function usePortfolio() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["portfolio", user?.id],
    queryFn: () => fetchPortfolio(user!.id),
    enabled: !!user,
    refetchInterval: REFETCH_INTERVALS.PORTFOLIO,
  });
}

export function usePortfolioHoldings(): Holding[] {
  const { data } = usePortfolio();
  if (!data?.transactions.length) return [];

  const holdingsMap = new Map<string, { totalShares: number; totalCost: number }>();

  for (const txn of data.transactions) {
    const current = holdingsMap.get(txn.ticker) ?? { totalShares: 0, totalCost: 0 };

    if (txn.transaction_type === "buy") {
      current.totalShares += txn.shares;
      current.totalCost += txn.total_amount;
    } else if (txn.transaction_type === "sell") {
      current.totalShares -= txn.shares;
      current.totalCost -= txn.shares * (current.totalCost / (current.totalShares + txn.shares));
    }

    holdingsMap.set(txn.ticker, current);
  }

  return Array.from(holdingsMap.entries())
    .filter(([_, h]) => h.totalShares > 0)
    .map(([ticker, h]) => ({
      ticker,
      totalShares: h.totalShares,
      avgPrice: h.totalCost / h.totalShares,
      totalCost: h.totalCost,
    }));
}

export function useAddTransaction() {
  const { t } = useTranslation("portfolio");
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      ticker: string;
      transactionType: "buy" | "sell" | "dividend";
      shares: number;
      pricePerShare: number;
      transactionDate: string;
      notes?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Get or create portfolio
      const { data: portfolios } = await supabase
        .from("portfolios")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      let portfolioId: string;

      if (!portfolios?.length) {
        const { data: newPortfolio, error } = await supabase
          .from("portfolios")
          .insert({ user_id: user.id })
          .select("id")
          .single();

        if (error || !newPortfolio) throw error ?? new Error("Failed to create portfolio");
        portfolioId = newPortfolio.id;
      } else {
        portfolioId = portfolios[0].id;
      }

      const { error } = await supabase
        .from("portfolio_transactions")
        .insert({
          portfolio_id: portfolioId,
          ticker: data.ticker,
          transaction_type: data.transactionType,
          shares: data.shares,
          price_per_share: data.pricePerShare,
          transaction_date: data.transactionDate,
          notes: data.notes ?? null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio", user?.id] });
      toast.success(t("toast.transactionAdded"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("toast.transactionAddFailed"));
    },
  });
}

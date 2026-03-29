import { useMemo } from "react";
import { usePortfolio } from "@/features/portfolio/api/portfolio-queries";
import { useLocalTransactions } from "@/features/portfolio/hooks/use-local-transactions";
import { getMockPriceHistory } from "@/lib/mock-data";
import type { ChartRange } from "@/config/constants";

export interface PortfolioDataPoint {
  date: string;
  value: number;
  cost: number;
}

const RANGE_DAYS: Record<ChartRange, number> = {
  "1D": 1,
  "1W": 7,
  "1M": 30,
  "3M": 90,
  "6M": 180,
  "1Y": 365,
};

function generatePortfolioHistory(
  tickers: string[],
  basePrices: Record<string, number>,
  range: ChartRange,
): PortfolioDataPoint[] {
  const days = RANGE_DAYS[range];
  const points: PortfolioDataPoint[] = [];
  const now = new Date();

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    let portfolioValue = 0;
    let totalCost = 0;

    for (const ticker of tickers) {
      const basePrice = basePrices[ticker] ?? 10;
      const history = getMockPriceHistory(ticker, range);

      // Find closest price point to this date
      const targetTime = date.getTime();
      let closest = history[history.length - 1];
      let minDiff = Infinity;

      for (const hp of history) {
        const hpTime = new Date(hp.time).getTime();
        const diff = Math.abs(hpTime - targetTime);
        if (diff < minDiff) {
          minDiff = diff;
          closest = hp;
        }
      }

      if (closest) {
        // Scale position value proportionally
        const priceRatio = closest.close / basePrice;
        const positionValue = basePrices[ticker] * priceRatio;
        portfolioValue += positionValue;
        totalCost += basePrices[ticker];
      }
    }

    points.push({ date: dateStr, value: Math.round(portfolioValue * 100) / 100, cost: totalCost });
  }

  return points;
}

export function usePortfolioHistory(range: ChartRange = "1M") {
  const { data } = usePortfolio();
  const { transactions: localTxs } = useLocalTransactions();

  return useMemo(() => {
    // Collect all tickers and derive base prices from transactions
    const tickerMap: Record<string, { shares: number; avgCost: number }> = {};

    for (const tx of data?.transactions ?? []) {
      if (!tickerMap[tx.ticker]) {
        tickerMap[tx.ticker] = { shares: 0, avgCost: tx.price_per_share };
      }
      const entry = tickerMap[tx.ticker];
      if (tx.transaction_type === "buy") {
        const totalCost = entry.shares * entry.avgCost + tx.shares * tx.price_per_share;
        entry.shares += tx.shares;
        entry.avgCost = entry.shares > 0 ? totalCost / entry.shares : tx.price_per_share;
      } else if (tx.transaction_type === "sell") {
        entry.shares = Math.max(0, entry.shares - tx.shares);
      }
    }

    for (const tx of localTxs) {
      if (!tickerMap[tx.ticker]) {
        tickerMap[tx.ticker] = { shares: 0, avgCost: tx.pricePerShare };
      }
      const entry = tickerMap[tx.ticker];
      if (tx.transactionType === "buy") {
        const totalCost = entry.shares * entry.avgCost + tx.shares * tx.pricePerShare;
        entry.shares += tx.shares;
        entry.avgCost = entry.shares > 0 ? totalCost / entry.shares : tx.pricePerShare;
      } else if (tx.transactionType === "sell") {
        entry.shares = Math.max(0, entry.shares - tx.shares);
      }
    }

    const tickers = Object.keys(tickerMap).filter((t) => tickerMap[t].shares > 0);
    const basePrices: Record<string, number> = {};
    for (const t of tickers) {
      basePrices[t] = tickerMap[t].avgCost;
    }

    if (tickers.length === 0) return [];

    return generatePortfolioHistory(tickers, basePrices, range);
  }, [data?.transactions, localTxs, range]);
}

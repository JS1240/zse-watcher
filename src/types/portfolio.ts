export interface Portfolio {
  id: string;
  userId: string;
  name: string;
  currency: string;
  createdAt: string;
}

export interface PortfolioTransaction {
  id: string;
  portfolioId: string;
  ticker: string;
  transactionType: "buy" | "sell" | "dividend";
  shares: number;
  pricePerShare: number;
  totalAmount: number;
  transactionDate: string;
  notes: string | null;
  createdAt: string;
}

export interface PortfolioHolding {
  ticker: string;
  name: string;
  totalShares: number;
  avgPrice: number;
  currentPrice: number;
  totalValue: number;
  totalGain: number;
  gainPct: number;
}

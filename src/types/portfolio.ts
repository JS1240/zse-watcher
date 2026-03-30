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

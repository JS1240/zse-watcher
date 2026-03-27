export interface Stock {
  ticker: string;
  name: string;
  sector: string;
  isin: string;
  price: number;
  changePct: number;
  turnover: number;
  volume: number;
  dividendYield: number | null;
}

export interface StockDetail extends Stock {
  description: string;
  founded: string;
  marketCapM: number;
  sharesM: number;
  peRatio: number | null;
  dividendYield: number | null;
  high52w: number;
  low52w: number;
  website: string;
}

export interface PricePoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

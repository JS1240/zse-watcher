export interface MarketStatus {
  isOpen: boolean;
  nextOpenAt: string | null;
  nextCloseAt: string | null;
}

export interface Mover {
  ticker: string;
  name: string;
  price: number;
  changePct: number;
}

export interface MacroData {
  crobex: { value: number; changePct: number };
  crobex10: { value: number; changePct: number };
  euroStoxx50: { value: number; changePct: number };
  eurUsd: number;
}

/** Refetch intervals in milliseconds */
export const REFETCH_INTERVALS = {
  STOCKS_LIVE: 30_000,
  STOCK_DETAIL: 30_000,
  STOCK_HISTORY: 60_000,
  MARKET_STATUS: 60_000,
  MOVERS: 30_000,
  NEWS: 120_000,
  TRADING_NEWS: 300_000,
  MACRO: 300_000,
  ALERTS: 15_000,
  PORTFOLIO: 30_000,
  DIVIDENDS: 300_000,
} as const;

/** Stale time for TanStack Query */
export const STALE_TIMES = {
  STOCK_DETAIL: 15_000,
  MARKET_STATUS: 30_000,
  MACRO: 120_000,
} as const;

/** Free tier limits */
export const FREE_TIER_LIMITS = {
  MAX_WATCHLIST_ITEMS: 10,
  MAX_PORTFOLIOS: 1,
  MAX_ALERTS: 3,
} as const;

/** Chart time ranges */
export const CHART_RANGES = ["1D", "1W", "1M", "3M", "6M", "1Y"] as const;
export type ChartRange = (typeof CHART_RANGES)[number];

/** ZSE market trading hours (CET) */
export const MARKET_HOURS = {
  OPEN_HOUR: 9,
  OPEN_MINUTE: 0,
  CLOSE_HOUR: 16,
  CLOSE_MINUTE: 0,
} as const;

/** Navigation tabs */
export const NAV_TABS = [
  { id: "stocks", labelKey: "common:nav.stocks", path: "/" },
  { id: "macro", labelKey: "common:nav.macro", path: "/macro" },
  { id: "heatmap", labelKey: "common:nav.heatmap", path: "/heatmap" },
  { id: "portfolio", labelKey: "common:nav.portfolio", path: "/portfolio" },
  { id: "dividends", labelKey: "common:nav.dividends", path: "/dividends" },
  { id: "alerts", labelKey: "common:nav.alerts", path: "/alerts" },
] as const;

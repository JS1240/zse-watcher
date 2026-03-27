import type { SubscriptionTier } from "@/types/user";

export interface TierLimits {
  maxWatchlistItems: number;
  maxPortfolios: number;
  maxAlerts: number;
  advancedCharts: boolean;
  technicalIndicators: boolean;
  stockScreener: boolean;
  portfolioAnalytics: boolean;
  dataExport: boolean;
  multiStockComparison: boolean;
}

export const TIER_CONFIG: Record<SubscriptionTier, TierLimits> = {
  free: {
    maxWatchlistItems: 10,
    maxPortfolios: 1,
    maxAlerts: 3,
    advancedCharts: false,
    technicalIndicators: false,
    stockScreener: false,
    portfolioAnalytics: false,
    dataExport: false,
    multiStockComparison: false,
  },
  premium: {
    maxWatchlistItems: Infinity,
    maxPortfolios: Infinity,
    maxAlerts: Infinity,
    advancedCharts: true,
    technicalIndicators: true,
    stockScreener: true,
    portfolioAnalytics: true,
    dataExport: true,
    multiStockComparison: true,
  },
};

export type PremiumFeature = keyof Omit<TierLimits, "maxWatchlistItems" | "maxPortfolios" | "maxAlerts">;

export function hasFeature(tier: SubscriptionTier, feature: PremiumFeature): boolean {
  return TIER_CONFIG[tier][feature] as boolean;
}

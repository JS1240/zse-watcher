export interface PricingPlan {
  id: "free" | "premium";
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: { label: string; included: boolean }[];
  cta: string;
  popular?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    cta: "Current Plan",
    features: [
      { label: "Live stock prices (30s refresh)", included: true },
      { label: "Market overview & CROBEX", included: true },
      { label: "News feed", included: true },
      { label: "Sector heatmap", included: true },
      { label: "Macro indicators", included: true },
      { label: "Area charts", included: true },
      { label: "Watchlist (10 items)", included: true },
      { label: "Portfolio (1)", included: true },
      { label: "Price alerts (3)", included: true },
      { label: "Candlestick charts", included: false },
      { label: "Technical indicators", included: false },
      { label: "Stock screener", included: false },
      { label: "Portfolio analytics", included: false },
      { label: "Data export (CSV)", included: false },
      { label: "Email notifications", included: false },
      { label: "Unlimited watchlists", included: false },
    ],
  },
  {
    id: "premium",
    name: "Premium",
    monthlyPrice: 9.99,
    annualPrice: 99.99,
    cta: "Upgrade Now",
    popular: true,
    features: [
      { label: "Live stock prices (30s refresh)", included: true },
      { label: "Market overview & CROBEX", included: true },
      { label: "News feed", included: true },
      { label: "Sector heatmap", included: true },
      { label: "Macro indicators", included: true },
      { label: "Area charts", included: true },
      { label: "Unlimited watchlists", included: true },
      { label: "Unlimited portfolios", included: true },
      { label: "Unlimited alerts", included: true },
      { label: "Candlestick charts", included: true },
      { label: "Technical indicators (SMA, EMA, RSI)", included: true },
      { label: "Stock screener", included: true },
      { label: "Portfolio analytics & allocation", included: true },
      { label: "Data export (CSV)", included: true },
      { label: "Email notifications", included: true },
      { label: "Priority support", included: true },
    ],
  },
];

// Stripe price IDs (configure in Stripe Dashboard)
export const STRIPE_PRICES = {
  premium_monthly: "price_premium_monthly",
  premium_annual: "price_premium_annual",
} as const;

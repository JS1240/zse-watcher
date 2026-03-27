import { useState } from "react";
import { Crown, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { createCheckoutSession } from "@/features/premium/api/stripe-api";
import { PRICING_PLANS } from "@/features/premium/config/pricing";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  featureContext?: string;
}

export function UpgradeModal({ open, onClose, featureContext }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const premiumPlan = PRICING_PLANS.find((p) => p.id === "premium");

  if (!open) return null;

  const handleUpgrade = async (cycle: "monthly" | "annual") => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const url = await createCheckoutSession(cycle);
      if (url) {
        window.location.href = url;
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-lg border border-primary/30 bg-card p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber/10">
            <Crown className="h-7 w-7 text-amber" />
          </div>

          <h2 className="text-lg font-bold text-foreground">Upgrade to Premium</h2>

          {featureContext && (
            <p className="mt-1 text-xs text-muted-foreground">
              <Zap className="mr-1 inline h-3 w-3 text-amber" />
              Unlock: {featureContext}
            </p>
          )}
        </div>

        {/* Quick feature highlights */}
        <div className="mt-4 space-y-1.5">
          {[
            "Candlestick charts + technical indicators",
            "Stock screener with advanced filters",
            "Portfolio analytics & sector allocation",
            "Unlimited watchlists, portfolios & alerts",
            "CSV data export",
          ].map((feature) => (
            <div key={feature} className="flex items-center gap-2 text-[11px] text-foreground">
              <Zap className="h-3 w-3 shrink-0 text-amber" />
              {feature}
            </div>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="mt-5 space-y-2">
          <Button
            className="w-full"
            onClick={() => handleUpgrade("annual")}
            disabled={loading}
          >
            {loading ? "Redirecting..." : `${premiumPlan?.annualPrice.toFixed(2)} EUR/year (Save 17%)`}
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => handleUpgrade("monthly")}
            disabled={loading}
          >
            {premiumPlan?.monthlyPrice.toFixed(2)} EUR/month
          </Button>
        </div>

        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          Cancel anytime. Powered by Stripe.
        </p>
      </div>
    </div>
  );
}

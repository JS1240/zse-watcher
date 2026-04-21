import { useState } from "react";
import { Crown, X, Check, Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { createCheckoutSession } from "@/features/premium/api/stripe-api";
import { PRICING_PLANS } from "@/features/premium/config/pricing";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  featureContext?: string;
}

export function UpgradeModal({ open, onClose, featureContext }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const [cycle, setCycle] = useState<"monthly" | "annual">("annual");
  const { isAuthenticated } = useAuth();
  const premiumPlan = PRICING_PLANS.find((p) => p.id === "premium");

  if (!open) return null;

  const handleUpgrade = async () => {
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
          className="absolute right-3 top-3 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          aria-label="Close upgrade modal"
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
        <div className="mt-5 space-y-2">
          {[
            { text: "Candlestick charts + technical indicators", included: true },
            { text: "Stock screener with advanced filters", included: true },
            { text: "Portfolio analytics & sector allocation", included: true },
            { text: "Unlimited watchlists, portfolios & alerts", included: true },
            { text: "CSV data export", included: true },
          ].map((feature) => (
            <div key={feature.text} className="flex items-center gap-2.5 text-xs text-foreground">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald/10">
                <Check className="h-2.5 w-2.5 text-emerald" />
              </div>
              {feature.text}
            </div>
          ))}
        </div>

        {/* Toggle */}
        <div className="mt-5 flex items-center justify-center gap-3">
          <span className={cn("text-xs font-medium", cycle === "monthly" ? "text-foreground" : "text-muted-foreground")}>
            Monthly
          </span>
          <button
            onClick={() => setCycle(cycle === "monthly" ? "annual" : "monthly")}
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors",
              cycle === "annual" ? "bg-amber" : "bg-muted"
            )}
            role="switch"
            aria-checked={cycle === "annual"}
          >
            <span
              className={cn(
                "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
                cycle === "annual" ? "translate-x-5" : "translate-x-0.5"
              )}
            />
          </button>
          <span className={cn("text-xs font-medium", cycle === "annual" ? "text-foreground" : "text-muted-foreground")}>
            Annual
            <span className="ml-1.5 rounded-sm bg-emerald/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald">
              Save 17%
            </span>
          </span>
        </div>

        {/* CTA buttons */}
        <div className="mt-4 space-y-2">
          <Button
            className="w-full gap-2"
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? (
              "Redirecting..."
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {cycle === "annual"
                  ? `${premiumPlan?.annualPrice.toFixed(2)} EUR/year`
                  : `${premiumPlan?.monthlyPrice.toFixed(2)} EUR/month`}
              </>
            )}
          </Button>
          {cycle === "annual" && (
            <p className="text-center text-[10px] text-muted-foreground">
              12 months for the price of 10
            </p>
          )}
        </div>

        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          Cancel anytime. Powered by Stripe.
        </p>
      </div>
    </div>
  );
}

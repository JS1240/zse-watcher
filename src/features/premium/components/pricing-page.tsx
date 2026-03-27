import { useState } from "react";
import { Crown, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/features/premium/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { PRICING_PLANS } from "@/features/premium/config/pricing";
import { cn } from "@/lib/utils";
import { createCheckoutSession } from "@/features/premium/api/stripe-api";

type BillingCycle = "monthly" | "annual";

export function PricingPage() {
  const [cycle, setCycle] = useState<BillingCycle>("annual");
  const [loading, setLoading] = useState(false);
  const { isPremium } = useSubscription();
  const { isAuthenticated } = useAuth();

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
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber/10">
          <Crown className="h-6 w-6 text-amber" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Choose Your Plan</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Unlock the full power of ZSE Watcher
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setCycle("monthly")}
          className={cn(
            "rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
            cycle === "monthly"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent",
          )}
        >
          Monthly
        </button>
        <button
          onClick={() => setCycle("annual")}
          className={cn(
            "rounded-sm px-3 py-1.5 text-xs font-medium transition-colors",
            cycle === "annual"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent",
          )}
        >
          Annual
          <span className="ml-1 rounded-sm bg-price-up/20 px-1 py-0.5 text-[9px] text-price-up">
            -17%
          </span>
        </button>
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {PRICING_PLANS.map((plan) => {
          const price = cycle === "monthly" ? plan.monthlyPrice : plan.annualPrice;
          const isCurrentPlan =
            (plan.id === "free" && !isPremium) || (plan.id === "premium" && isPremium);

          return (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-lg border p-5",
                plan.popular
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card",
              )}
            >
              {plan.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  Most Popular
                </div>
              )}

              <h3 className="text-sm font-bold text-foreground">{plan.name}</h3>

              <div className="mt-2 flex items-baseline gap-1">
                {price > 0 ? (
                  <>
                    <span className="font-data text-3xl font-bold text-foreground">
                      {price.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      EUR / {cycle === "monthly" ? "mo" : "yr"}
                    </span>
                  </>
                ) : (
                  <span className="font-data text-3xl font-bold text-foreground">Free</span>
                )}
              </div>

              {cycle === "annual" && plan.annualPrice > 0 && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {(plan.annualPrice / 12).toFixed(2)} EUR/mo billed annually
                </p>
              )}

              <div className="mt-4">
                {isCurrentPlan ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : plan.id === "premium" ? (
                  <Button
                    className="w-full"
                    onClick={handleUpgrade}
                    disabled={loading || !isAuthenticated}
                  >
                    {loading ? "Redirecting..." : plan.cta}
                  </Button>
                ) : null}
              </div>

              {/* Features */}
              <ul className="mt-4 space-y-1.5">
                {plan.features.map((feature) => (
                  <li key={feature.label} className="flex items-center gap-2 text-[11px]">
                    {feature.included ? (
                      <Check className="h-3 w-3 shrink-0 text-price-up" />
                    ) : (
                      <X className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                    )}
                    <span
                      className={cn(
                        feature.included ? "text-foreground" : "text-muted-foreground/60",
                      )}
                    >
                      {feature.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

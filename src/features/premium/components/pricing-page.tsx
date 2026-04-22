import { useState } from "react";
import { Crown, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/features/premium/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { PRICING_PLANS } from "@/features/premium/config/pricing";
import { cn } from "@/lib/utils";
import { createCheckoutSession } from "@/features/premium/api/stripe-api";
import { PricingSkeleton } from "./pricing-skeleton";

type BillingCycle = "monthly" | "annual";

export function PricingPage() {
  const [cycle, setCycle] = useState<BillingCycle>("annual");
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const { isPremium, loading: subLoading } = useSubscription();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Show skeleton while checking subscription status
  if (subLoading || authLoading) {
    return <PricingSkeleton />;
  }

  const handleUpgrade = async () => {
    if (!isAuthenticated) return;
    setUpgradeLoading(true);
    try {
      const url = await createCheckoutSession(cycle);
      if (url) {
        window.location.href = url;
      }
    } finally {
      setUpgradeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center animate-pricing-card">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber/10">
          <Crown className="h-6 w-6 text-amber" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Choose Your Plan</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Unlock the full power of ZSE Watcher
        </p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-2 animate-pricing-card animate-pricing-card-delay-1">
        <div className="relative rounded-full bg-muted p-1">
          <div
            className={cn(
              "absolute top-1 h-[calc(100%-8px)] rounded-full bg-primary transition-all duration-300 ease-out",
              cycle === "monthly" ? "left-1 w-[46%]" : "left-[48%] w-[46%]"
            )}
          />
          <div className="relative flex justify-center">
            <button
              onClick={() => setCycle("monthly")}
              className={cn(
                "z-10 flex-1 rounded-full px-4 py-1.5 text-xs font-medium transition-colors hover:bg-primary/50",
                cycle === "monthly"
                  ? "text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setCycle("annual")}
              className={cn(
                "z-10 flex-1 rounded-full px-4 py-1.5 text-xs font-medium transition-colors hover:bg-primary/50",
                cycle === "annual"
                  ? "text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              Annual
              <span className="ml-1 inline-flex animate-pulse rounded-full bg-price-up/20 px-1.5 py-0.5 text-[9px] font-bold text-price-up">
                -17%
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {PRICING_PLANS.map((plan, index) => {
          const price = cycle === "monthly" ? plan.monthlyPrice : plan.annualPrice;
          const isCurrentPlan =
            (plan.id === "free" && !isPremium) || (plan.id === "premium" && isPremium);

          return (
            <div
              key={plan.id}
              className={cn(
                "relative rounded-lg border p-5 transition-all duration-200 animate-pricing-card",
                index === 0 ? "animate-pricing-card-delay-1" : "animate-pricing-card-delay-2",
                plan.popular
                  ? "border-primary bg-primary/5 hover:-translate-y-0.5 hover:border-primary hover:shadow-lg hover:shadow-primary/10"
                  : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
              )}
            >
              {plan.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 animate-pulse rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)]">
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
                    disabled={upgradeLoading || !isAuthenticated}
                  >
                    {upgradeLoading ? "Redirecting..." : plan.cta}
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

import { useState, useRef, memo } from "react";
import { useTranslation } from "react-i18next";
import { Crown, Check, X, ArrowUp, Keyboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/features/premium/hooks/use-subscription";
import { useAuth } from "@/hooks/use-auth";
import { PRICING_PLANS } from "@/features/premium/config/pricing";
import { cn } from "@/lib/utils";
import { createCheckoutSession } from "@/features/premium/api/stripe-api";
import { PricingSkeleton } from "./pricing-skeleton";

type BillingCycle = "monthly" | "annual";

export const PricingPage = memo(function PricingPage() {
  const { t } = useTranslation("premium");
  const { t: tc } = useTranslation("common");
  const [cycle, setCycle] = useState<BillingCycle>("annual");
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [scrollTop, setScrollTop] = useState(false);
  const pricingRef = useRef<HTMLDivElement>(null);
  const { isPremium, loading: subLoading } = useSubscription();
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Show skeleton while checking subscription status (same scroll container)
  if (subLoading || authLoading) {
    return (
      <div ref={pricingRef} className="overflow-auto max-h-[85vh] p-1">
        <PricingSkeleton />
      </div>
    );
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
    <div 
      ref={pricingRef}
      onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop > 300)}
      className="space-y-6 overflow-auto max-h-[85vh] p-1"
    >
      {/* Header */}
      <div className="text-center animate-pricing-card">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber/10">
          <Crown className="h-6 w-6 text-amber" />
        </div>
        <h2 className="text-lg font-bold text-foreground">{t("pricing.title")}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("pricing.subtitle")}
        </p>
      </div>

      {/* Always-visible keyboard shortcuts hint for discoverability */}
      <div className="flex items-center justify-center gap-4 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-sans text-[8px]">M</kbd>
          <span>{t("pricing.monthlyShort") || "mjesečno"}</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-sans text-[8px]">G</kbd>
          <span>{t("pricing.annualShort") || "godišnje"}</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-sans text-[8px]">↑</kbd>
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-sans text-[8px]">↓</kbd>
          <span>{t("pricing.navigate") || "planovi"}</span>
        </span>
        <span className="flex items-center gap-0.5">
          <Keyboard className="h-2.5 w-2.5" />
          <span>{tc("shortcut.search") || "/ traži"}</span>
        </span>
      </div>

      {/* Billing toggle */}
      <div className="flex flex-col items-center gap-2">
        <div className="relative rounded-full bg-muted p-1" onKeyDown={(e) => {
          if (e.key === "m" || e.key === "M") setCycle("monthly");
          if (e.key === "g" || e.key === "G") setCycle("annual");
        }}>
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
                "z-10 flex-1 rounded-full px-4 py-1.5 text-xs font-medium transition-colors hover:bg-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                cycle === "monthly"
                  ? "text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              {t("pricing.monthly")}
            </button>
            <button
              onClick={() => setCycle("annual")}
              className={cn(
                "z-10 flex-1 rounded-full px-4 py-1.5 text-xs font-medium transition-colors hover:bg-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                cycle === "annual"
                  ? "text-primary-foreground"
                  : "text-muted-foreground",
              )}
            >
              {t("pricing.annual")}
              <span className="ml-1 inline-flex animate-pulse rounded-full bg-price-up/20 px-1.5 py-0.5 text-[9px] font-bold text-price-up">
                {t("pricing.discount")}
              </span>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">M</kbd>
            <span>{t("pricing.monthlyShort") || "mjesečno"}</span>
          </span>
          <span className="text-muted-foreground/40">·</span>
          <span className="flex items-center gap-0.5">
            <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">G</kbd>
            <span>{t("pricing.annualShort") || "godišnje"}</span>
          </span>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {PRICING_PLANS.map((plan, index) => {
          const price = cycle === "monthly" ? plan.monthlyPrice : plan.annualPrice;
          const isCurrentPlan =
            (plan.id === "free" && !isPremium) || (plan.id === "premium" && isPremium);
          const monthlyEquivalent = cycle === "annual" && plan.annualPrice > 0
            ? (plan.annualPrice / 12).toFixed(2)
            : null;

          return (
            <div
              key={plan.id}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                  e.preventDefault();
                  const next = e.currentTarget.nextElementSibling as HTMLElement | null;
                  next?.focus();
                } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                  e.preventDefault();
                  const prev = e.currentTarget.previousElementSibling as HTMLElement | null;
                  prev?.focus();
                }
              }}
              className={cn(
                "relative rounded-lg border p-5 transition-all duration-200 animate-pricing-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                index === 0 ? "animate-pricing-card-delay-1" : "animate-pricing-card-delay-2",
                plan.popular
                  ? "border-primary bg-primary/5 hover:-translate-y-0.5 hover:border-primary hover:shadow-lg hover:shadow-primary/10"
                  : "border-border bg-card hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5",
              )}
            >
              {plan.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 animate-pulse rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)]">
                  {t("pricing.popular")}
                </div>
              )}

              <div className="flex items-start justify-between">
                <h3 className="text-sm font-bold text-foreground">{plan.name}</h3>
                {isCurrentPlan && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
                    {t("pricing.current") || "Vaš plan"}
                  </span>
                )}
              </div>

              <div className="mt-2 flex items-baseline gap-1">
                {price > 0 ? (
                  <>
                    <span className="font-data text-3xl font-bold text-foreground">
                      {price.toFixed(2)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      EUR / {cycle === "monthly" ? t("pricing.perMonth").split("/")[1].trim() : t("pricing.perYear").split("/")[1].trim()}
                    </span>
                  </>
                ) : (
                  <span className="font-data text-3xl font-bold text-foreground">
                    {t("pricing.free")}
                  </span>
                )}
              </div>

              {monthlyEquivalent && (
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {monthlyEquivalent} {t("pricing.perMonthBilled")}
                </p>
              )}

              {cycle === "annual" && plan.id === "premium" && (
                <p className="mt-1 flex items-center gap-1 text-[10px] font-medium text-price-up">
                  <Check className="h-3 w-3" />
                  {t("pricing.savePercent")}
                </p>
              )}

              <div className="mt-4">
                {isCurrentPlan ? (
                  <Button variant="outline" className="w-full" disabled>
                    {t("pricing.currentPlan")}
                  </Button>
                ) : plan.id === "premium" ? (
                  <Button
                    className="w-full"
                    onClick={handleUpgrade}
                    disabled={upgradeLoading || !isAuthenticated}
                  >
                    {upgradeLoading ? t("pricing.redirecting") : t("pricing.upgradeNow")}
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

      {/* Footer note */}
      <div className="flex flex-col items-center gap-1 text-center text-[10px] text-muted-foreground">
        <span>{t("pricing.cancelAnytime")}</span>
        <span className="flex items-center gap-1">
          <span>{t("pricing.secure") || "Sigurno plaćanje putem Stripea"}</span>
        </span>
      </div>

      {/* Scroll to top button */}
      <button
        onClick={() => pricingRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
        className={cn(
          "fixed bottom-6 right-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-200 hover:bg-primary/90",
          scrollTop ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2"
        )}
        aria-label={tc("scrollToTop")}
        title={tc("scrollToTop")}
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </div>
  );
});
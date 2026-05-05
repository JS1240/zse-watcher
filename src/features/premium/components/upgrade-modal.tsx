import { useState, useCallback } from "react";
import { Crown, X, Check, Zap, BarChart3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { createCheckoutSession } from "@/features/premium/api/stripe-api";
import { PRICING_PLANS } from "@/features/premium/config/pricing";
import { cn } from "@/lib/utils";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  featureContext?: string;
}

export function UpgradeModal({ open, onClose, featureContext }: UpgradeModalProps) {
  const { t } = useTranslation("premium");
  const [loading, setLoading] = useState(false);
  const [cycle, setCycle] = useState<"monthly" | "annual">("annual");
  const { isAuthenticated } = useAuth();
  const premiumPlan = PRICING_PLANS.find((p) => p.id === "premium");

  // Keyboard shortcut to toggle billing cycle
  const toggleCycle = useCallback(() => setCycle((c) => (c === "monthly" ? "annual" : "monthly")), []);
  useKeyboardShortcut({ key: "y", handler: toggleCycle, enabled: !!open });

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
          aria-label={t("upgradeModal.close")}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber/10">
            <Crown className="h-7 w-7 text-amber" />
          </div>

          <h2 className="text-lg font-bold text-foreground">{t("upgradeModal.title")}</h2>

          {featureContext && (
            <p className="mt-1 text-xs text-muted-foreground">
              <Zap className="mr-1 inline h-3 w-3 text-amber" />
              {t("upgradeModal.featureUnlocks", { feature: featureContext })}
            </p>
          )}
        </div>

        {/* Quick feature highlights */}
        <div className="mt-5 space-y-2">
          {[
            { text: t("upgradeModal.features.candlestick"), included: true },
            { text: t("upgradeModal.features.screener"), included: true },
            { text: t("upgradeModal.features.analytics"), included: true },
            { text: t("upgradeModal.features.unlimited"), included: true },
            { text: t("upgradeModal.features.export"), included: true },
          ].map((feature) => (
            <div key={feature.text} className="flex items-center gap-2.5 text-xs text-foreground">
              <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald/10">
                <Check className="h-2.5 w-2.5 text-emerald" />
              </div>
              {feature.text}
            </div>
          ))}
        </div>

        {/* Compare Plans button */}
        <button
          onClick={() => window.location.href = "/pricing"}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground transition-all hover:border-primary/40 hover:bg-muted/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BarChart3 className="h-3.5 w-3.5" />
          {t("upgradeModal.comparePlans")}
        </button>

        {/* Toggle */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <span className={cn("text-xs font-medium", cycle === "monthly" ? "text-foreground" : "text-muted-foreground")}>
            {t("upgradeModal.monthly")}
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
            {t("upgradeModal.annual")}
            <span className="ml-1.5 rounded-sm bg-emerald/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald">
              {t("pricing.savePercent")}
            </span>
          </span>
        </div>

        {/* Live price comparison breakdown */}
        <div className={cn(
          "mt-4 rounded-md border px-3 py-3",
          cycle === "annual"
            ? "border-amber-500/20 bg-amber-500/5"
            : "border-border bg-muted/30"
        )}>
          <div className="flex items-center justify-between">
            {/* Monthly breakdown */}
            <div className="flex-1">
              <p className={cn(
                "text-[10px] font-semibold",
                cycle === "monthly" ? "text-foreground" : "text-muted-foreground"
              )}>
                {t("upgradeModal.monthly")}
              </p>
              <p className="mt-0.5 font-data text-lg font-bold text-foreground">
                {premiumPlan?.monthlyPrice.toFixed(2)} EUR
              </p>
              <p className="text-[9px] text-muted-foreground">
                {t("upgradeModal.perMonthDirect") || "po mjesecu"}
              </p>
            </div>

            {/* Divider */}
            <div className="mx-3 flex h-10 flex-col items-center justify-center">
              <div className="h-px w-6 bg-border" />
              <span className="my-1 text-[9px] text-muted-foreground">ili</span>
              <div className="h-px w-6 bg-border" />
            </div>

            {/* Annual breakdown */}
            <div className="flex-1 text-right">
              <p className={cn(
                "text-[10px] font-semibold",
                cycle === "annual" ? "text-foreground" : "text-muted-foreground"
              )}>
                {t("upgradeModal.annual")}
              </p>
              <p className="mt-0.5 font-data text-lg font-bold text-foreground">
                {premiumPlan?.annualPrice.toFixed(2)} EUR
              </p>
              <p className="text-[9px] text-muted-foreground">
                / {t("upgradeModal.perYear") || "godišnje"}
              </p>
              {premiumPlan && premiumPlan.annualPrice > 0 && (
                <p className="mt-0.5 text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                  {t("upgradeModal.saveEur", {
                    amount: ((premiumPlan.monthlyPrice * 12) - premiumPlan.annualPrice).toFixed(2)
                  }) || `Štediš ${((premiumPlan.monthlyPrice * 12) - premiumPlan.annualPrice).toFixed(2)} EUR`}
                </p>
              )}
            </div>
          </div>

          {/* Monthly equivalent bar for annual */}
          {cycle === "annual" && premiumPlan && (
            <div className="mt-3 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                <span>{t("upgradeModal.monthlyEquivalent") || "mjesečni ekvivalent"}</span>
                <span className="font-data font-semibold text-foreground">
                  {(premiumPlan.annualPrice / 12).toFixed(2)} EUR
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 overflow-hidden rounded-full bg-border">
                  <div
                    className="h-1.5 rounded-full bg-amber transition-all duration-300"
                    style={{
                      width: `${Math.round((premiumPlan.annualPrice / 12 / premiumPlan.monthlyPrice) * 100)}%`
                    }}
                  />
                </div>
                <span className="text-[9px] font-medium text-amber">
                  −{Math.round((1 - (premiumPlan.annualPrice / 12 / premiumPlan.monthlyPrice)) * 100)}%
                </span>
              </div>
              <p className="mt-1.5 text-[9px] text-muted-foreground/70">
                {t("upgradeModal.twelveMonthsNote") || "12 mjeseci plaćeno godišnje = 2 mjeseca besplatno"}
              </p>
            </div>
          )}
        </div>

        {/* CTA buttons */}
        <div className="mt-4 space-y-2">
          <Button
            className="w-full"
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? (
              t("upgradeModal.loading")
            ) : (
              <>
                <Crown className="mr-2 h-4 w-4" />
                {cycle === "annual"
                  ? `${premiumPlan?.annualPrice.toFixed(2)} EUR/${t("pricing.perYear").split("/")[1].trim()}`
                  : `${premiumPlan?.monthlyPrice.toFixed(2)} EUR/${t("pricing.perMonth").split("/")[1].trim()}`}
              </>
            )}
          </Button>
          {cycle === "annual" && (
            <p className="text-center text-[10px] text-muted-foreground">
              {t("pricing.twelveMonths")}
            </p>
          )}
        </div>

        <p className="mt-3 text-center text-[10px] text-muted-foreground">
          {t("pricing.cancelAnytime")}
        </p>

        {/* Always-visible keyboard shortcut hint for discoverability */}
        <div className="mt-3 flex items-center justify-center gap-2 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-sans text-[8px]">Y</kbd>
            <span>{t("upgradeModal.toggleCycle") || "mjesečno/godišnje"}</span>
          </span>
          <span className="flex items-center gap-0.5">
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-sans text-[8px]">Esc</kbd>
            <span>{t("upgradeModal.close")}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

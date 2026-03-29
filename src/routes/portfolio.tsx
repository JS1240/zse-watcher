import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { PortfolioDashboard } from "@/features/portfolio/components/portfolio-dashboard";
import { PortfolioAnalytics } from "@/features/portfolio/components/portfolio-analytics";
import { ReceivedDividends } from "@/features/portfolio/components/received-dividends";
import { PremiumGate } from "@/features/premium/components/premium-gate";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/portfolio")({
  component: PortfolioPage,
});

type Tab = "holdings" | "analytics" | "dividends";

function PortfolioPage() {
  const { t } = useTranslation("portfolio");
  const [tab, setTab] = useState<Tab>("holdings");
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-data text-lg font-bold">{t("title")}</h1>
        <div className="flex gap-1">
          {(["holdings", "analytics", "dividends"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-sm px-3 py-1 text-[11px] font-medium capitalize transition-colors",
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {tab === "holdings" ? (
        <PortfolioDashboard isLocal={!isAuthenticated} />
      ) : tab === "dividends" ? (
        <ReceivedDividends />
      ) : (
        <AuthGuard
          fallback={
            <div className="rounded-md border border-border bg-card py-12 text-center">
              <p className="text-xs text-muted-foreground">
                Sign in to access portfolio analytics.
              </p>
            </div>
          }
        >
          <PremiumGate
            feature="portfolioAnalytics"
            fallbackTitle="Portfolio Analytics"
            fallbackDescription="Sector allocation, performance breakdown, and risk metrics. Upgrade to Premium."
          >
            <PortfolioAnalytics />
          </PremiumGate>
        </AuthGuard>
      )}
    </div>
  );
}

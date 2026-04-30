import { useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Keyboard } from "lucide-react";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { PortfolioDashboard } from "@/features/portfolio/components/portfolio-dashboard";
import { PortfolioAnalytics } from "@/features/portfolio/components/portfolio-analytics";
import { ReceivedDividends } from "@/features/portfolio/components/received-dividends";
import { PremiumGate } from "@/features/premium/components/premium-gate";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/portfolio")({
  component: PortfolioPage,
});

type Tab = "holdings" | "analytics" | "dividends";

const TABS: Tab[] = ["holdings", "analytics", "dividends"];

function PortfolioPage() {
  const { t } = useTranslation("portfolio");
  const [tab, setTab] = useState<Tab>("holdings");
  const { isAuthenticated } = useAuth();

  // Keyboard navigation: 1/2/3 to switch tabs
  const switchToTab = useCallback(
    (target: Tab) => {
      setTab(target);
    },
    [],
  );

  useKeyboardShortcut({
    key: "1",
    handler: useCallback(() => switchToTab("holdings"), [switchToTab]),
    enabled: true,
  });
  useKeyboardShortcut({
    key: "2",
    handler: useCallback(() => switchToTab("analytics"), [switchToTab]),
    enabled: true,
  });
  useKeyboardShortcut({
    key: "3",
    handler: useCallback(() => switchToTab("dividends"), [switchToTab]),
    enabled: true,
  });

  // Arrow key navigation between tabs
  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = TABS.indexOf(tab);
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % TABS.length;
        setTab(TABS[nextIndex]);
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + TABS.length) % TABS.length;
        setTab(TABS[prevIndex]);
      }
    },
    [tab],
  );

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-data text-lg font-bold">{t("title")}</h1>
        <div
          role="tablist"
          aria-label="Portfolio sections"
          className="flex gap-1"
          onKeyDown={handleTabKeyDown}
        >
          {TABS.map((t, i) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              aria-controls={`panel-${t}`}
              id={`tab-${t}`}
              onClick={() => setTab(t)}
              className={cn(
                "relative rounded-sm px-3 py-1 text-[11px] font-medium capitalize transition-colors",
                tab === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-muted/60 px-1 py-0.5 font-sans text-[8px] font-normal tabular-nums">
                  {i + 1}
                </kbd>
                {t}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab panels */}
      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="min-h-0 flex-1"
      >
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

      {/* Always-visible keyboard shortcuts hint — consistent with stocks/screener/alerts pattern */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm border border-border/50 bg-muted/30 px-3 py-1.5 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <Keyboard className="h-2.5 w-2.5" />
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">1</kbd>
          <span>{t("shortcut.holdingsTab")}</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">2</kbd>
          <span>{t("shortcut.analyticsTab")}</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">3</kbd>
          <span>{t("shortcut.dividendsTab")}</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">←</kbd>
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">→</kbd>
          <span>{t("shortcut.search")}</span>
        </span>
      </div>
    </div>
  );
}

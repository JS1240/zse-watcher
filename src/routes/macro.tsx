import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Keyboard, ArrowUp } from "lucide-react";
import { MarketOverview } from "@/features/market/components/market-overview";
import { MarketStatus } from "@/features/market/components/market-status";
import { useMacro } from "@/features/market/api/market-queries";
import { useForexRates } from "@/features/market/api/forex-queries";
import { ShortcutsOverlay } from "@/components/layout/shortcuts-overlay";
import { formatPrice } from "@/lib/formatters";
import { ChangeBadge } from "@/components/shared/change-badge";
import { MacroSkeleton } from "@/features/market/components/macro-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/macro")({
  component: MacroPage,
});

function MacroPage() {
  const { t } = useTranslation("macro");
  const { t: tc } = useTranslation("common");
  const { data: macro, isLoading, isError, refetch: refetchMacro } = useMacro();
  const { data: forex, isError: forexError, refetch: refetchForex } = useForexRates();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [scrollTop, setScrollTop] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll to top handler
  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Combined error state - show error if either macro or forex fails
  const hasError = isError || forexError;

  if (hasError) {
    return (
      <div
        ref={contentRef}
        onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop > 200)}
        className="flex h-full flex-col gap-4 overflow-auto p-4"
      >
        <div className="flex items-center justify-between">
          <h1 className="font-data text-lg font-bold">{t("title")}</h1>
          <MarketStatus />
        </div>
        <ErrorState
          title={tc("errors.generic")}
          description={tc("errors.macro")}
          retry={{
            onRetry: () => {
              refetchMacro();
              refetchForex();
            },
            label: tc("errors.tryAgain"),
          }}
        />
        {showShortcuts && <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-data text-lg font-bold">{t("title")}</h1>
        <MarketStatus />
      </div>

      <MarketOverview />

      {/* Detailed index cards */}
      <div className="grid gap-3 md:grid-cols-2">
        {isLoading || !macro ? (
          <MacroSkeleton />
        ) : (
          <>
            <IndexCard
              name={t("indices.crobex")}
              value={macro.crobex.value}
              changePct={macro.crobex.changePct}
              description="Glavni indeks Zagrebacke burze koji prati najlikvidnije dionice"
              primary
            />
            <IndexCard
              name={t("indices.crobex10")}
              value={macro.crobex10.value}
              changePct={macro.crobex10.changePct}
              description="Blue-chip indeks 10 najznacajnijih dionica na ZSE"
            />
            <IndexCard
              name={t("indices.euroStoxx")}
              value={macro.euroStoxx50.value}
              changePct={macro.euroStoxx50.changePct}
              description="Vodeci europski indeks 50 najvecih kompanija eurozone"
            />
            <div className="rounded-md border border-border bg-card p-4 transition-all duration-200 hover:border-primary/20 hover:shadow-md hover:shadow-foreground/5 hover:-translate-y-0.5">
              <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t("forex.title")}
              </h3>
              {forex ? (
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 sm:gap-3">
                  {[
                    { pair: "EUR/USD", value: forex.eurUsd },
                    { pair: "USD/HRK", value: forex.usdHrk },
                    { pair: "EUR/CHF", value: forex.eurChf },
                    { pair: "EUR/GBP", value: forex.eurGbp },
                  ].map(({ pair, value }) => (
                    <div key={pair} className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">{pair}</span>
                      <span className="font-data text-xs font-bold tabular-nums text-foreground">
                        {value.toFixed(4)}
                      </span>
                    </div>
                  ))}
                  <div className="col-span-2 border-t border-border/50 pt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">EUR/HRK</span>
                      <span className="font-data text-xs tabular-nums text-foreground">
                        {forex.eurHrk.toFixed(4)}{" "}
                        <span className="text-[9px] text-muted-foreground">(CNB fixing)</span>
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-4" />)}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Investment factors */}
      <div className="rounded-md border border-border bg-card p-4 transition-all duration-200 hover:border-primary/20">
        <h3 className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">
          {t("factors.title")}
        </h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <FactorItem label={t("factors.gdp")} value="3.2%" trend="up" />
          <FactorItem label={t("factors.inflation")} value="4.1%" trend="neutral" />
          <FactorItem label={t("factors.unemployment")} value="6.3%" trend="down" />
          <FactorItem label={t("factors.interestRate")} value="3.75%" trend="neutral" />
        </div>
      </div>

      {/* Always-visible keyboard shortcuts hint for discoverability */}
      <div className="mt-4 flex items-center justify-center gap-4 rounded-md border border-border bg-card/50 px-3 py-2 text-[10px] text-muted-foreground">
        <button
          onClick={() => setShowShortcuts(true)}
          className="flex items-center gap-1 rounded px-1.5 py-1 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Keyboard className="h-2.5 w-2.5" />
          <span>?</span>
        </button>
        <span>{tc("shortcuts.showAll") || "Svi prečaci"}</span>
      </div>

      {/* Scroll to top button */}
      <button
        onClick={scrollToTop}
        aria-label={tc("scrollToTop")}
        title={tc("scrollToTop")}
        className={cn(
          "fixed bottom-20 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:bottom-6",
          scrollTop ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2"
        )}
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </div>
  );
}

function IndexCard({
  name,
  value,
  changePct,
  description,
  primary,
}: {
  name: string;
  value: number;
  changePct: number;
  description: string;
  primary?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-4 transition-all duration-200",
        primary ? "border-primary/30 bg-primary/5 hover:border-primary/50 hover:shadow-md hover:shadow-primary/5" : "border-border bg-card hover:border-primary/20 hover:shadow-md hover:shadow-foreground/5 hover:-translate-y-0.5",
      )}
    >
      <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground">{name}</h3>
      <div className="mt-2 flex items-baseline gap-3">
        <span className="font-data text-2xl font-bold tabular-nums text-foreground">
          {formatPrice(value)}
        </span>
        <ChangeBadge value={changePct} />
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">{description}</p>
    </div>
  );
}

function FactorItem({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
}) {
  return (
    <div className="text-center transition-transform duration-200 hover:scale-110">
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <div
        className={cn(
          "mt-1 font-data text-sm font-bold tabular-nums",
          trend === "up" && "text-price-up",
          trend === "down" && "text-price-down",
          trend === "neutral" && "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}

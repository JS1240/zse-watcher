import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { MarketOverview } from "@/features/market/components/market-overview";
import { MarketStatus } from "@/features/market/components/market-status";
import { useMacro } from "@/features/market/api/market-queries";
import { useForexRates } from "@/features/market/api/forex-queries";
import { formatPrice } from "@/lib/formatters";
import { Skeleton } from "@/components/ui/skeleton";
import { ChangeBadge } from "@/components/shared/change-badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/macro")({
  component: MacroPage,
});

function MacroPage() {
  const { t } = useTranslation("macro");
  const { data: macro, isLoading } = useMacro();
  const { data: forex } = useForexRates();

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-data text-lg font-bold">{t("title")}</h1>
        <MarketStatus />
      </div>

      <MarketOverview />

      {/* Detailed index cards */}
      <div className="grid gap-3 md:grid-cols-2">
        {isLoading || !macro ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))
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
            <div className="rounded-md border border-border bg-card p-4">
              <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t("forex.title")}
              </h3>
              {forex ? (
                <div className="mt-3 grid grid-cols-2 gap-3">
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
      <div className="rounded-md border border-border bg-card p-4">
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
        "rounded-md border p-4",
        primary ? "border-primary/30 bg-primary/5" : "border-border bg-card",
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
    <div className="text-center">
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

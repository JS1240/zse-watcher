import { useState } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { usePortfolioHoldings, usePortfolio } from "@/features/portfolio/api/portfolio-queries";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { PortfolioChart } from "@/features/portfolio/components/portfolio-chart";
import { PortfolioAnalyticsSkeleton } from "@/features/portfolio/components/portfolio-analytics-skeleton";
import { ChangeBadge } from "@/components/shared/change-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { AnalyticsEmptyIllustration } from "@/components/shared/empty-illustrations";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const SECTOR_COLORS = [
  "hsl(3, 74%, 49%)",    // red
  "hsl(217, 91%, 60%)",  // blue
  "hsl(142, 71%, 45%)",  // green
  "hsl(38, 92%, 50%)",   // amber
  "hsl(280, 67%, 55%)",  // purple
  "hsl(180, 60%, 45%)",  // teal
  "hsl(330, 65%, 55%)",  // pink
  "hsl(60, 70%, 45%)",   // yellow
];

export function PortfolioAnalytics() {
  const { t } = useTranslation("portfolio");
  const { isLoading: isPortfolioLoading } = usePortfolio();
  const holdings = usePortfolioHoldings();
  const { data: stocksResult, isLoading: isStocksLoading } = useStocksLive();
  const stocks = stocksResult?.stocks ?? null;
  const isLoading = isPortfolioLoading || isStocksLoading;

  // Track hovered sector for donut chart tooltip
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);

  const analytics = useMemo(() => {
    if (!holdings.length || !stocks) return null;

    const enriched = holdings.map((h) => {
      const stock = stocks.find((s) => s.ticker === h.ticker);
      const currentPrice = stock?.price ?? h.avgPrice;
      const sector = stock?.sector ?? "N/A";
      const totalValue = h.totalShares * currentPrice;
      const gain = totalValue - h.totalCost;
      const gainPct = h.totalCost > 0 ? (gain / h.totalCost) * 100 : 0;
      return { ...h, currentPrice, sector, totalValue, gain, gainPct, name: stock?.name ?? h.ticker };
    });

    const totalValue = enriched.reduce((s, h) => s + h.totalValue, 0);
    const totalCost = enriched.reduce((s, h) => s + h.totalCost, 0);
    const totalGain = totalValue - totalCost;
    const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    // Sector breakdown
    const sectorMap = new Map<string, number>();
    for (const h of enriched) {
      sectorMap.set(h.sector, (sectorMap.get(h.sector) ?? 0) + h.totalValue);
    }
    const sectors = Array.from(sectorMap.entries())
      .map(([name, value], i) => ({
        name,
        value,
        pct: totalValue > 0 ? (value / totalValue) * 100 : 0,
        color: SECTOR_COLORS[i % SECTOR_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);

    // Best/worst performers
    const sorted = [...enriched].sort((a, b) => b.gainPct - a.gainPct);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    return { enriched, totalValue, totalCost, totalGain, totalGainPct, sectors, best, worst };
  }, [holdings, stocks]);

  if (isLoading) {
    return <PortfolioAnalyticsSkeleton />;
  }

  if (!analytics) {
    return (
      <EmptyState
        icon={<AnalyticsEmptyIllustration className="h-8 w-8" />}
        title={t("analytics.empty")}
        description={t("analytics.emptyDescription")}
        steps={[
          { label: t("quickStart.step1"), description: t("quickStart.step1Desc") ?? "" },
          { label: t("quickStart.step2"), description: t("quickStart.step2Desc") ?? "" },
          { label: t("quickStart.step3"), description: t("quickStart.step3Desc") ?? "" },
        ]}
        variant="action"
        action={{ label: t("analytics.addAction"), onClick: () => document.getElementById("add-position-btn")?.click() }}
        className="rounded-md border border-border"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Performance chart */}
      <div className="rounded-md border border-border bg-card p-4">
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("analytics.performance")}
        </h3>
        <PortfolioChart />
      </div>

      {/* Summary metrics */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <MetricCard label={t("analytics.totalValue")} value={formatCurrency(analytics.totalValue)} />
        <MetricCard
          label={t("analytics.totalReturn")}
          value={formatCurrency(analytics.totalGain)}
          sub={<ChangeBadge value={analytics.totalGainPct} showIcon={false} />}
          color={analytics.totalGain >= 0 ? "up" : "down"}
        />
        <MetricCard
          label={t("analytics.bestPerformer")}
          value={analytics.best?.ticker ?? "-"}
          sub={analytics.best ? <ChangeBadge value={analytics.best.gainPct} showIcon={false} /> : null}
        />
        <MetricCard
          label={t("analytics.worstPerformer")}
          value={analytics.worst?.ticker ?? "-"}
          sub={analytics.worst ? <ChangeBadge value={analytics.worst.gainPct} showIcon={false} /> : null}
        />
      </div>

      {/* Sector allocation */}
      <div className="rounded-md border border-border bg-card p-4">
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("analytics.sectorAllocation")}
        </h3>
        <div className="flex gap-6">
          {/* Donut chart (SVG) */}
          <div className="flex shrink-0 flex-col items-center justify-center">
            <DonutChart 
              sectors={analytics.sectors} 
              size={140} 
              onHover={setHoveredSector}
            />
            {/* Tooltip for hovered sector */}
            {hoveredSector && (
              <div className="mt-2 animate-fade-in rounded bg-card px-2 py-1 text-[10px] font-medium shadow-lg ring-1 ring-border">
                {hoveredSector}
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-col justify-center gap-1.5">
            {analytics.sectors.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                <span className="text-[11px] text-foreground">{s.name}</span>
                <span className="ml-auto font-data text-[10px] tabular-nums text-muted-foreground">
                  {s.pct.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings breakdown */}
      <div className="rounded-md border border-border bg-card p-4">
        <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("analytics.holdingsBreakdown")}
        </h3>
        <div className="space-y-2">
          {analytics.enriched
            .sort((a, b) => b.totalValue - a.totalValue)
            .map((h) => {
              const pct = analytics.totalValue > 0 ? (h.totalValue / analytics.totalValue) * 100 : 0;
              return (
                <div key={h.ticker} className="flex items-center gap-3">
                  <span className="w-20 font-data text-[11px] font-semibold text-foreground">
                    {h.ticker.split("-")[0]}
                  </span>
                  <div className="flex-1">
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${Math.max(pct, 1)}%` }}
                      />
                    </div>
                  </div>
                  <span className="w-12 text-right font-data text-[10px] tabular-nums text-muted-foreground">
                    {pct.toFixed(1)}%
                  </span>
                  <ChangeBadge value={h.gainPct} showIcon={false} className="w-16 justify-end text-[10px]" />
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: React.ReactNode;
  color?: "up" | "down";
}) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-baseline gap-2">
        <span
          className={cn(
            "font-data text-sm font-bold tabular-nums",
            color === "up" && "text-price-up",
            color === "down" && "text-price-down",
            !color && "text-foreground",
          )}
        >
          {value}
        </span>
        {sub}
      </div>
    </div>
  );
}

function DonutChart({ sectors, size, onHover }: { sectors: { name: string; pct: number; color: string }[]; size: number; onHover?: (name: string | null) => void }) {
  const [hoveredArc, setHoveredArc] = useState<string | null>(null);
  const radius = size / 2 - 10;
  const center = size / 2;
  const strokeWidth = 20;

  let cumulativeAngle = -90; // Start from top

  const arcs = sectors.map((sector) => {
    const angle = (sector.pct / 100) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;

    return { d, color: sector.color, key: sector.name };
  });

  const handleArcHover = (name: string | null) => {
    setHoveredArc(name);
    onHover?.(name);
  };

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <filter id="donut-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.3" />
        </filter>
      </defs>
      {arcs.map((arc) => (
        <path
          key={arc.key}
          d={arc.d}
          fill="none"
          stroke={arc.color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={cn(
            "cursor-pointer transition-all duration-150",
            hoveredArc === arc.key ? "filter-[url(#donut-shadow)]" : "opacity-80 hover:opacity-100"
          )}
          onMouseEnter={() => handleArcHover(arc.key)}
          onMouseLeave={() => handleArcHover(null)}
        />
      ))}
    </svg>
  );
}

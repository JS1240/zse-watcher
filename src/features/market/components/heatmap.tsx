import { useMemo, useState, memo, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { useSelectedStock } from "@/hooks/use-selected-stock";
import { HeatmapSkeleton } from "@/features/market/components/heatmap-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { cn } from "@/lib/utils";
import { formatPercent, formatCurrency } from "@/lib/formatters";
import { SectorDrawer } from "@/features/market/components/sector-drawer";
import { HeatmapEmptyIllustration } from "@/components/shared/empty-illustrations";
import { EmptyState } from "@/components/shared/empty-state";

export interface SectorGroup {
  sector: string;
  stocks: { ticker: string; changePct: number; turnover: number }[];
  avgChange: number;
  totalTurnover: number;
}

export function Heatmap() {
  const { data: result, isLoading, isError, refetch } = useStocksLive();
  const stocks = result?.stocks ?? null;
  const { t } = useTranslation("heatmap");
  const { t: tc } = useTranslation("common");
  const { select } = useSelectedStock();
  const [selectedSector, setSelectedSector] = useState<SectorGroup | null>(null);

  const sectors = useMemo(() => {
    if (!stocks) return [];

    const grouped = new Map<string, SectorGroup>();

    for (const stock of stocks) {
      const sector = stock.sector || t("sector.unknown");
      if (!grouped.has(sector)) {
        grouped.set(sector, {
          sector,
          stocks: [],
          avgChange: 0,
          totalTurnover: 0,
        });
      }
      const group = grouped.get(sector)!;
      group.stocks.push({
        ticker: stock.ticker,
        changePct: stock.changePct,
        turnover: stock.turnover,
      });
      group.totalTurnover += stock.turnover;
    }

    for (const group of grouped.values()) {
      group.avgChange =
        group.stocks.reduce((sum, s) => sum + s.changePct, 0) / group.stocks.length;
    }

    return Array.from(grouped.values()).sort(
      (a, b) => b.totalTurnover - a.totalTurnover,
    );
  }, [stocks, t]);

  if (isError) {
    return (
      <ErrorState
        title={tc("errors.generic")}
        description={tc("errors.network")}
        retry={{ onRetry: refetch, label: tc("errors.tryAgain") }}
      />
    );
  }

  if (isLoading) {
    return <HeatmapSkeleton />;
  }

  if (!sectors.length) {
    return (
      <EmptyState
        icon={<HeatmapEmptyIllustration className="h-10 w-10" />}
        title={t("empty.noData")}
        description={tc("errors.noDataDescription") || t("empty.noDataDescription") || "No market data available"}
      />
    );
  }

  const maxTurnover = Math.max(...sectors.map((s) => s.totalTurnover));

  // Tooltip state
  const [tooltip, setTooltip] = useState<{ sector: SectorGroup; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTooltip = useCallback((sector: SectorGroup, e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ sector, x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <div ref={containerRef} className="relative space-y-3">
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}
      >
        {sectors.map((sector) => (
          <SectorCell
            key={sector.sector}
            sector={sector}
            maxTurnover={maxTurnover}
            onSelectTicker={select}
            onSelectSector={() => setSelectedSector(sector)}
            onHover={handleTooltip}
          />
        ))}
      </div>

      {/* Floating tooltip on hover */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 animate-fade-in rounded-md border border-border bg-card px-3 py-2 shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y - 8, minWidth: 160 }}
          role="tooltip"
        >
          <p className="text-[11px] font-semibold text-foreground">{tooltip.sector.sector}</p>
          <div className="mt-1.5 space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-[10px] text-muted-foreground">Prosjek</span>
              <span className={cn(
                "font-data text-[10px] font-bold tabular-nums",
                tooltip.sector.avgChange > 0 ? "text-price-up" : tooltip.sector.avgChange < 0 ? "text-price-down" : "text-muted-foreground"
              )}>{formatPercent(tooltip.sector.avgChange)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[10px] text-muted-foreground">Dionica</span>
              <span className="font-data text-[10px] font-semibold tabular-nums text-foreground">{tooltip.sector.stocks.length}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-[10px] text-muted-foreground">Promet</span>
              <span className="font-data text-[10px] font-semibold tabular-nums text-foreground">{formatCurrency(tooltip.sector.totalTurnover)}</span>
            </div>
          </div>
          <p className="mt-2 text-[9px] text-muted-foreground">Klikni za pregled dionica</p>
        </div>
      )}

      <HeatmapLegend />

      <SectorDrawer
        sector={selectedSector}
        onClose={() => setSelectedSector(null)}
      />
    </div>
  );
}

function HeatmapLegend() {
  const { t } = useTranslation("heatmap");

  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {t("legend.title")}
      </p>
      <div className="flex flex-wrap gap-3" role="list" aria-label={t("legend.title")}>
        <LegendItem
          colorClass="bg-price-up/20 border-price-up/40"
          textClass="text-price-up"
          label={t("legend.strongGain")}
          value="+1%+"
        />
        <LegendItem
          colorClass="bg-price-up/10 border-price-up/20"
          textClass="text-price-up"
          label={t("legend.mildGain")}
          value="0–+1%"
        />
        <LegendItem
          colorClass="bg-card border-border"
          textClass="text-muted-foreground"
          label={t("legend.neutral")}
          value="0%"
        />
        <LegendItem
          colorClass="bg-price-down/10 border-price-down/20"
          textClass="text-price-down"
          label={t("legend.mildLoss")}
          value="0–-1%"
        />
        <LegendItem
          colorClass="bg-price-down/20 border-price-down/40"
          textClass="text-price-down"
          label={t("legend.strongLoss")}
          value="-1%–"
        />
      </div>
    </div>
  );
}

function LegendItem({
  colorClass,
  textClass,
  label,
  value,
}: {
  colorClass: string;
  textClass: string;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-sm px-1.5 py-1 transition-all duration-150 hover:bg-muted/50"
      role="listitem"
    >
      <span
        className={cn(
          "inline-block h-3 w-3 rounded-sm border",
          colorClass,
        )}
        aria-hidden="true"
      />
      <span className={cn("font-data text-[10px] tabular-nums font-semibold", textClass)}>
        {value}
      </span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}

const SectorCell = memo(function SectorCell({
  sector,
  maxTurnover,
  onSelectTicker,
  onSelectSector,
  onHover,
}: {
  sector: SectorGroup;
  maxTurnover: number;
  onSelectTicker: (ticker: string) => void;
  onSelectSector: () => void;
  onHover?: (sector: SectorGroup, e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  const sizeRatio = sector.totalTurnover / maxTurnover;
  const minHeight = 80;
  const maxHeight = 200;
  const height = minHeight + sizeRatio * (maxHeight - minHeight);

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-md border border-border/50 p-2 transition-all duration-150 hover:border-border hover:shadow-md",
        getHeatColor(sector.avgChange),
      )}
      style={{ minHeight: `${height}px` }}
      onMouseEnter={(e) => onHover?.(sector, e)}
      onMouseLeave={() => onHover?.(sector, { clientX: -9999, clientY: -9999 } as React.MouseEvent<HTMLDivElement>)}
    >
      <div className="flex items-center justify-between">
        <button
          onClick={onSelectSector}
          className="text-[10px] cursor-pointer font-semibold uppercase tracking-wider text-foreground hover:text-primary focus-visible:text-primary focus-visible:outline-none"
        >
          {sector.sector}
        </button>
        <span
          className={cn(
            "font-data text-[10px] font-bold tabular-nums",
            sector.avgChange > 0
              ? "text-price-up"
              : sector.avgChange < 0
                ? "text-price-down"
                : "text-muted-foreground",
          )}
        >
          {formatPercent(sector.avgChange)}
        </span>
      </div>
      <div className="flex flex-wrap gap-0.5">
        {sector.stocks.map((stock) => (
          <button
            key={stock.ticker}
            onClick={() => onSelectTicker(stock.ticker)}
            className={cn(
              "rounded-sm px-1 py-0.5 font-data text-[9px] font-medium transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1",
              stock.changePct > 0
                ? "bg-price-up/20 text-price-up focus-visible:ring-price-up"
                : stock.changePct < 0
                  ? "bg-price-down/20 text-price-down focus-visible:ring-price-down"
                  : "bg-muted text-muted-foreground focus-visible:ring-muted-foreground",
            )}
            title={`${stock.ticker}: ${formatPercent(stock.changePct)}`}
            aria-label={`${stock.ticker}, ${formatPercent(stock.changePct)}`}
          >
            {stock.ticker.split("-")[0]}
          </button>
        ))}
      </div>
    </div>
  );
});

function getHeatColor(changePct: number): string {
  if (changePct > 1) return "bg-price-up/10";
  if (changePct > 0) return "bg-price-up/5";
  if (changePct < -1) return "bg-price-down/10";
  if (changePct < 0) return "bg-price-down/5";
  return "bg-card";
}

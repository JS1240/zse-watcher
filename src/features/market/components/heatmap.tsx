import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { useSelectedStock } from "@/hooks/use-selected-stock";
import { HeatmapSkeleton } from "@/features/market/components/heatmap-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/formatters";
import { SectorDrawer } from "@/features/market/components/sector-drawer";

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
      <p className="py-8 text-center text-xs text-muted-foreground">
        {t("empty.noData")}
      </p>
    );
  }

  const maxTurnover = Math.max(...sectors.map((s) => s.totalTurnover));

  return (
    <div className="space-y-3">
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
          />
        ))}
      </div>

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
    <div className="flex items-center gap-1.5" role="listitem">
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

function SectorCell({
  sector,
  maxTurnover,
  onSelectTicker,
  onSelectSector,
}: {
  sector: SectorGroup;
  maxTurnover: number;
  onSelectTicker: (ticker: string) => void;
  onSelectSector: () => void;
}) {
  const sizeRatio = sector.totalTurnover / maxTurnover;
  const minHeight = 80;
  const maxHeight = 200;
  const height = minHeight + sizeRatio * (maxHeight - minHeight);

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-md border border-border/50 p-2 transition-colors hover:border-border",
        getHeatColor(sector.avgChange),
      )}
      style={{ minHeight: `${height}px` }}
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
}

function getHeatColor(changePct: number): string {
  if (changePct > 1) return "bg-price-up/10";
  if (changePct > 0) return "bg-price-up/5";
  if (changePct < -1) return "bg-price-down/10";
  if (changePct < 0) return "bg-price-down/5";
  return "bg-card";
}

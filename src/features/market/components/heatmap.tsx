import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatPercent } from "@/lib/formatters";

interface SectorGroup {
  sector: string;
  stocks: { ticker: string; changePct: number; turnover: number }[];
  avgChange: number;
  totalTurnover: number;
}

export function Heatmap() {
  const { data: stocks, isLoading } = useStocksLive();
  const { t } = useTranslation("common");

  const sectors = useMemo(() => {
    if (!stocks) return [];

    const grouped = new Map<string, SectorGroup>();

    for (const stock of stocks) {
      const sector = stock.sector || "N/A";
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

    // Calculate averages
    for (const group of grouped.values()) {
      group.avgChange =
        group.stocks.reduce((sum, s) => sum + s.changePct, 0) / group.stocks.length;
    }

    return Array.from(grouped.values()).sort(
      (a, b) => b.totalTurnover - a.totalTurnover,
    );
  }, [stocks]);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
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
    <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
      {sectors.map((sector) => (
        <SectorCell
          key={sector.sector}
          sector={sector}
          maxTurnover={maxTurnover}
        />
      ))}
    </div>
  );
}

function SectorCell({
  sector,
  maxTurnover,
}: {
  sector: SectorGroup;
  maxTurnover: number;
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
        <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground">
          {sector.sector}
        </span>
        <span
          className={cn(
            "font-data text-[10px] font-bold tabular-nums",
            sector.avgChange > 0 ? "text-price-up" : sector.avgChange < 0 ? "text-price-down" : "text-muted-foreground",
          )}
        >
          {formatPercent(sector.avgChange)}
        </span>
      </div>
      <div className="flex flex-wrap gap-0.5">
        {sector.stocks.map((stock) => (
          <span
            key={stock.ticker}
            className={cn(
              "rounded-sm px-1 py-0.5 font-data text-[9px] font-medium",
              stock.changePct > 0
                ? "bg-price-up/20 text-price-up"
                : stock.changePct < 0
                  ? "bg-price-down/20 text-price-down"
                  : "bg-muted text-muted-foreground",
            )}
            title={`${stock.ticker}: ${formatPercent(stock.changePct)}`}
          >
            {stock.ticker.split("-")[0]}
          </span>
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

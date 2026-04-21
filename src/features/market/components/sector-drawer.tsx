
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { useSelectedStock } from "@/hooks/use-selected-stock";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { ChangeBadge } from "@/components/shared/change-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice, formatVolume, formatPercent } from "@/lib/formatters";
import type { SectorGroup } from "./heatmap";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { cn } from "@/lib/utils";

interface SectorDrawerProps {
  sector: SectorGroup | null;
  onClose: () => void;
}

export function SectorDrawer({ sector, onClose }: SectorDrawerProps) {
  const { t } = useTranslation("heatmap");
  const { select: selectTicker } = useSelectedStock();
  const { data: result, isLoading: isStocksLoading } = useStocksLive();
  const stocks = result?.stocks ?? null;
  const { setContainerRef } = useFocusTrap({
    active: !!sector,
    onEscape: onClose,
  });

  const sectorStocks = stocks
    ? stocks
        .filter((s) => (s.sector || t("sector.unknown")) === sector?.sector)
        .sort((a, b) => b.turnover - a.turnover)
    : [];

  if (!sector) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div ref={setContainerRef} className="fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-card shadow-xl sm:max-w-[85vw] md:max-w-xl lg:max-w-2xl xl:max-w-[42rem] 2xl:max-w-[48rem]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <h2 className="font-data text-sm font-bold text-foreground">{sector.sector}</h2>
            <p className="text-[10px] text-muted-foreground">
              {sectorStocks.length} stocks · Avg{" "}
              <span
                className={cn(
                  "font-data font-semibold",
                  sector.avgChange > 0 ? "text-price-up" : sector.avgChange < 0 ? "text-price-down" : "text-muted-foreground",
                )}
              >
                {formatPercent(sector.avgChange)}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stocks list */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 text-left font-medium">Ticker</th>
                <th className="px-2 py-2 text-right font-medium">Price</th>
                <th className="px-2 py-2 text-right font-medium">Change</th>
                <th className="hidden px-2 py-2 text-right font-medium lg:table-cell">Turnover</th>
                <th className="hidden px-2 py-2 text-right font-medium lg:table-cell">Volume</th>
              </tr>
            </thead>
            <tbody>
              {isStocksLoading ? (
                // Loading skeleton rows for Croatian investors
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-border/50 last:border-b-0">
                    <td className="px-3 py-2">
                      <div className="flex flex-col items-start gap-1">
                        <Skeleton className="h-3.5 w-12 animate-shimmer" />
                        <Skeleton className="h-2 w-16 animate-shimmer lg:hidden" />
                      </div>
                    </td>
                    <td className="px-2 py-2 text-right">
                      <Skeleton className="ml-auto h-3.5 w-14 animate-shimmer" />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <Skeleton className="ml-auto h-5 w-16 animate-shimmer" />
                    </td>
                    <td className="hidden px-2 py-2 text-right lg:table-cell">
                      <Skeleton className="ml-auto h-3.5 w-20 animate-shimmer" />
                    </td>
                    <td className="hidden px-2 py-2 text-right lg:table-cell">
                      <Skeleton className="ml-auto h-3.5 w-16 animate-shimmer" />
                    </td>
                  </tr>
                ))
              ) : (
                sectorStocks.map((stock) => (
                <tr
                  key={stock.ticker}
                  className="border-b border-border/50 last:border-b-0 hover:bg-accent/50"
                >
                  <td className="px-3 py-2">
                    <button
                      onClick={() => {
                        selectTicker(stock.ticker);
                        onClose();
                      }}
                      className="flex flex-col items-start gap-0.5 text-left"
                    >
                      <span className="font-data text-xs font-semibold text-foreground hover:text-primary">
                        {stock.ticker}
                      </span>
                      <span className="text-[9px] text-muted-foreground lg:hidden">{stock.name}</span>
                    </button>
                  </td>
                  <td className="px-2 py-2 text-right font-data text-xs tabular-nums text-foreground">
                    {formatPrice(stock.price)}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <ChangeBadge value={stock.changePct} showIcon={false} />
                  </td>
                  <td className="hidden px-2 py-2 text-right font-data text-[11px] tabular-nums text-muted-foreground lg:table-cell">
                    {formatVolume(stock.turnover)} EUR
                  </td>
                  <td className="hidden px-2 py-2 text-right font-data text-[11px] tabular-nums text-muted-foreground lg:table-cell">
                    {formatVolume(stock.volume)}
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-4 py-2">
          <p className="text-[10px] text-muted-foreground">
            Click a ticker to open the stock detail drawer
          </p>
        </div>
      </div>
    </>
  );
}

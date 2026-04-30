import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, Activity, TrendingUp } from "lucide-react";
import { PriceDisplay } from "@/components/shared/price-display";
import { ChangeBadge } from "@/components/shared/change-badge";
import { Sparkline } from "@/components/shared/sparkline";
import { getMockPriceHistory } from "@/lib/mock-data";
import { formatVolume, formatCurrency, formatMarketCap } from "@/lib/formatters";
import { usePriceFlash } from "@/hooks/use-price-flash";
import type { StockDetail } from "@/types/stock";
import type { Stock } from "@/types/stock";
import { cn } from "@/lib/utils";

interface StockHeaderProps {
  stock: StockDetail;
  /** Stocks list for price flash detection — pass from parent drawer */
  stocks?: Stock[];
}

interface StockHeaderProps {
  stock: StockDetail;
}

export function StockHeader({ stock, stocks }: StockHeaderProps) {
  const { t } = useTranslation("stocks");

  // Detect price changes for flash animation — only flashes when this ticker's price changes
  const priceFlashMap = usePriceFlash(stocks ?? null);
  const flashDirection = priceFlashMap.get(stock.ticker) ?? null;

  // Generate 1-week mock price history for sparkline (deterministic per ticker)
  const sparklineData = useMemo(() => {
    const history = getMockPriceHistory(stock.ticker, "1W");
    // Sample ~7 points for the mini sparkline (last 7 days of the 1W view)
    const step = Math.max(1, Math.floor(history.length / 7));
    const sampled = history
      .filter((_, i) => i % step === 0)
      .slice(-7)
      .map((p) => p.close);
    return sampled;
  }, [stock.ticker]);

  return (
    <div className="space-y-1">
      {/* Ticker + Name */}
      <div className="flex items-baseline gap-2">
        <span className="font-data text-lg font-bold text-foreground" aria-label={t("header.tickerLabel")}>
          {stock.ticker}
        </span>
        <span className="truncate text-xs text-muted-foreground">{stock.name}</span>
      </div>

      {/* Price + Change + Sparkline */}
      <div className="flex items-baseline gap-3" aria-label={`${t("header.priceLabel")}: ${stock.price} EUR`}>
        <PriceDisplay
          value={stock.price}
          className={cn(
            "text-2xl",
            flashDirection === "up" && "price-flash-up",
            flashDirection === "down" && "price-flash-down"
          )}
        />
        <ChangeBadge value={stock.changePct} />
        {/* Performance sparkline — shows 7-day price trend at a glance */}
        {sparklineData.length >= 2 && (
          <div className="ml-auto flex items-center gap-1.5" title={t("header.sparklineTooltip") || "7-day performance"}>
            <Sparkline data={sparklineData} width={48} height={18} />
            <span
              className={`text-[10px] font-data font-semibold tabular-nums ${
                sparklineData[sparklineData.length - 1] >= sparklineData[0]
                  ? "text-price-up"
                  : "text-price-down"
              }`}
            >
              {(
                ((sparklineData[sparklineData.length - 1] - sparklineData[0]) / sparklineData[0]) *
                100
              ).toFixed(1)}
              %
            </span>
          </div>
        )}
      </div>

      {/* Market context — liquidity and size at a glance */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
        {/* Volume */}
        <span className="flex items-center gap-1" title={t("header.volumeTooltip")}>
          <Activity className="h-3 w-3" />
          <span className="font-data tabular-nums">{formatVolume(stock.volume)}</span>
        </span>
        {/* Turnover */}
        <span className="flex items-center gap-1" title={t("header.turnoverTooltip")}>
          <TrendingUp className="h-3 w-3" />
          <span className="font-data tabular-nums">{formatCurrency(stock.turnover)}</span>
        </span>
        {/* Market Cap */}
        {stock.marketCapM != null && stock.marketCapM > 0 && (
          <span className="flex items-center gap-1 font-medium text-foreground" title={t("header.marketCapTooltip")}>
            {formatMarketCap(stock.marketCapM)}
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
        <span
          className="rounded-sm bg-accent px-1.5 py-0.5 font-medium"
          aria-label={`${t("header.sectorLabel")}: ${stock.sector}`}
        >
          {stock.sector}
        </span>
        <span className="font-data" aria-label={`${t("header.isinLabel")}: ${stock.isin}`}>
          {stock.isin}
        </span>
        {stock.website && (
          <a
            href={stock.website}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("header.openDetail")}
            className="inline-flex items-center gap-1 text-blue hover:underline"
          >
            Website <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>
    </div>
  );
}
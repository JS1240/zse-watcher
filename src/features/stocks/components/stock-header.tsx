import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";
import { PriceDisplay } from "@/components/shared/price-display";
import { ChangeBadge } from "@/components/shared/change-badge";
import type { StockDetail } from "@/types/stock";

interface StockHeaderProps {
  stock: StockDetail;
}

export function StockHeader({ stock }: StockHeaderProps) {
  const { t } = useTranslation("stocks");

  return (
    <div className="space-y-1">
      {/* Ticker + Name */}
      <div className="flex items-baseline gap-2">
        <span className="font-data text-lg font-bold text-foreground" aria-label={t("header.tickerLabel")}>
          {stock.ticker}
        </span>
        <span className="truncate text-xs text-muted-foreground">{stock.name}</span>
      </div>

      {/* Price + Change */}
      <div className="flex items-baseline gap-3" aria-label={`${t("header.priceLabel")}: ${stock.price} EUR`}>
        <PriceDisplay value={stock.price} className="text-2xl" />
        <ChangeBadge value={stock.changePct} />
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

import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { useMovers } from "@/features/market/api/market-queries";
import { useSelectedStock } from "@/hooks/use-selected-stock";
import { ChangeBadge } from "@/components/shared/change-badge";
import { formatPrice } from "@/lib/formatters";
import type { Mover } from "@/types/market";
import { MoversSkeleton } from "./movers-skeleton";

function formatLastUpdated(timestamp: number | undefined): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" });
}

export function MarketMovers() {
  const { data, isLoading, dataUpdatedAt } = useMovers();
  const { t } = useTranslation("stocks");

  if (isLoading || !data) {
    return <MoversSkeleton />;
  }

  return (
    <div className="space-y-2">
      {/* Last updated timestamp */}
      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <Clock className="h-3 w-3" />
        <span>Zadnje ažurirano {formatLastUpdated(dataUpdatedAt)}</span>
      </div>

      <h3 className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <TrendingUp className="h-3.5 w-3.5 text-price-up" />
        {t("movers.gainers")}
      </h3>
      <div className="space-y-0.5">
        {data.gainers.map((m) => (
          <MoverRow key={m.ticker} mover={m} />
        ))}
      </div>

      <h3 className="flex items-center gap-2 text-xs font-semibold text-foreground">
        <TrendingDown className="h-3.5 w-3.5 text-price-down" />
        {t("movers.losers")}
      </h3>
      <div className="space-y-0.5">
        {data.losers.map((m) => (
          <MoverRow key={m.ticker} mover={m} />
        ))}
      </div>
    </div>
  );
}

function MoverRow({ mover }: { mover: Mover }) {
  const select = useSelectedStock((state) => state.select);

  const handleClick = () => {
    select(mover.ticker);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
    >
      <div className="flex flex-col">
        <span className="font-data text-[11px] font-semibold text-foreground">
          {mover.ticker}
        </span>
        <span className="max-w-[120px] truncate text-[10px] text-muted-foreground">
          {mover.name}
        </span>
      </div>
      <div className="flex flex-col items-end">
        <span className="font-data text-[11px] tabular-nums text-foreground">
          {formatPrice(mover.price)}
        </span>
        <ChangeBadge value={mover.changePct} showIcon={false} className="text-[10px]" />
      </div>
    </button>
  );
}

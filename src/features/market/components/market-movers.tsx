import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useMovers } from "@/features/market/api/market-queries";
import { ChangeBadge } from "@/components/shared/change-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/formatters";
import type { Mover } from "@/types/market";

export function MarketMovers() {
  const { data, isLoading } = useMovers();
  const { t } = useTranslation("stocks");

  if (isLoading || !data) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-6 w-32" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
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
  return (
    <div className="flex items-center justify-between rounded-sm px-2 py-1.5 transition-colors hover:bg-accent/50">
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
    </div>
  );
}

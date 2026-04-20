import { useTranslation } from "react-i18next";
import { memo } from "react";
import { TrendingUp, TrendingDown, Clock, Star } from "lucide-react";
import { useMovers } from "@/features/market/api/market-queries";
import { useSelectedStock } from "@/hooks/use-selected-stock";
import { useAuth } from "@/hooks/use-auth";
import { useWatchlistTickers, useAddToWatchlist, useRemoveFromWatchlist } from "@/features/watchlist/api/watchlist-queries";
import { useLocalWatchlist } from "@/features/watchlist/hooks/use-local-watchlist";
import { ChangeBadge } from "@/components/shared/change-badge";
import { ErrorState } from "@/components/shared/error-state";
import { formatPrice } from "@/lib/formatters";
import type { Mover } from "@/types/market";
import { MoversSkeleton } from "./movers-skeleton";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

function formatLastUpdated(timestamp: number | undefined): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  return date.toLocaleTimeString("hr-HR", { hour: "2-digit", minute: "2-digit" });
}

export function MarketMovers() {
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useMovers();
  const { t } = useTranslation("stocks");
  const { t: tc } = useTranslation("common");

  if (isError) {
    return (
      <ErrorState
        title={tc("errors.generic")}
        description={tc("errors.network")}
        retry={{ onRetry: refetch, label: tc("errors.tryAgain") }}
      />
    );
  }

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

const MoverRow = memo(function MoverRow({ mover }: { mover: Mover }) {
  const select = useSelectedStock((state) => state.select);
  const { isAuthenticated } = useAuth();
  const watchlistTickers = useWatchlistTickers();
  const { items: localItems, addItem, removeItem } = useLocalWatchlist();
  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();
  const { t } = useTranslation("watchlist");

  const isWatched = isAuthenticated
    ? watchlistTickers.has(mover.ticker)
    : localItems.some((item) => item.ticker === mover.ticker);

  const handleClick = () => {
    select(mover.ticker);
  };

  const handleWatchlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAuthenticated) {
      if (isWatched) {
        removeMutation.mutate(mover.ticker);
        toast.success(t("toast.removed"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
      } else {
        addMutation.mutate(mover.ticker);
        toast.success(t("toast.added"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
      }
    } else {
      if (isWatched) {
        removeItem(mover.ticker);
        toast.success(t("toast.removed"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
      } else {
        addItem(mover.ticker);
        toast.success(t("toast.added"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
    >
      <div className="flex flex-1 items-center gap-2">
        <button
          type="button"
          onClick={handleWatchlistToggle}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-amber focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title={isWatched ? t("remove") : t("add")}
          aria-label={isWatched ? `${mover.ticker} remove from watchlist` : `${mover.ticker} add to watchlist`}
        >
          <Star className={`h-3.5 w-3.5 ${isWatched ? "fill-amber text-amber" : ""}`} />
        </button>
        <div className="flex flex-col">
          <span className="font-data text-[11px] font-semibold text-foreground">
            {mover.ticker}
          </span>
          <span className="max-w-[100px] truncate text-[10px] text-muted-foreground">
            {mover.name}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className="font-data text-[11px] tabular-nums text-foreground">
          {formatPrice(mover.price)}
        </span>
        <ChangeBadge value={mover.changePct} showIcon={false} className="text-[10px]" />
      </div>
    </button>
  );
});

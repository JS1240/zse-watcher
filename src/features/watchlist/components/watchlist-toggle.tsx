import { Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  useWatchlistTickers,
  useAddToWatchlist,
  useRemoveFromWatchlist,
} from "@/features/watchlist/api/watchlist-queries";
import { useLocalWatchlist } from "@/features/watchlist/hooks/use-local-watchlist";
import { cn } from "@/lib/utils";

interface WatchlistToggleProps {
  ticker: string;
  className?: string;
}

export function WatchlistToggle({ ticker, className }: WatchlistToggleProps) {
  const { isAuthenticated } = useAuth();
  const { items: localItems, addItem, removeItem } = useLocalWatchlist();
  const watchlistTickers = useWatchlistTickers();
  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();

  if (isAuthenticated) {
    return <AuthenticatedToggle
      ticker={ticker}
      watchlistTickers={watchlistTickers}
      addMutation={addMutation}
      removeMutation={removeMutation}
      className={className}
    />;
  }

  // Guests can use local watchlist too
  const localTickers = new Set(localItems.map((i) => i.ticker));
  const isWatched = localTickers.has(ticker);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isWatched) {
      removeItem(ticker);
    } else {
      addItem(ticker);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle(e as unknown as React.MouseEvent);
    }
  };

  return (
    <button
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      aria-label={isWatched ? "Remove from watchlist" : "Add to watchlist"}
      className={cn(
        "rounded-sm p-1 transition-colors hover:bg-accent",
        className,
      )}
      title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
    >
      <Star
        className={cn(
          "h-3.5 w-3.5 transition-colors",
          isWatched
            ? "fill-amber text-amber"
            : "text-muted-foreground hover:text-amber",
        )}
      />
    </button>
  );
}

function AuthenticatedToggle({
  ticker,
  watchlistTickers,
  addMutation,
  removeMutation,
  className,
}: {
  ticker: string;
  watchlistTickers: ReturnType<typeof useWatchlistTickers>;
  addMutation: ReturnType<typeof useAddToWatchlist>;
  removeMutation: ReturnType<typeof useRemoveFromWatchlist>;
  className?: string;
}) {
  const isWatched = watchlistTickers.has(ticker);
  const isPending = addMutation.isPending || removeMutation.isPending;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPending) return;


    if (isWatched) {
      removeMutation.mutate(ticker);
    } else {
      addMutation.mutate(ticker);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "rounded-sm p-1 transition-colors hover:bg-accent",
        className,
      )}
      title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
    >
      <Star
        className={cn(
          "h-3.5 w-3.5 transition-colors",
          isWatched
            ? "fill-amber text-amber"
            : "text-muted-foreground hover:text-amber",
        )}
      />
    </button>
  );
}

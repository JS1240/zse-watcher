import { memo, useMemo, useCallback } from "react";
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

export const WatchlistToggle = memo(function WatchlistToggle({ ticker, className }: WatchlistToggleProps) {
  const { isAuthenticated } = useAuth();
  const { items: localItems, addItem, removeItem } = useLocalWatchlist();
  const watchlistTickers = useWatchlistTickers();
  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();

  // Compute isWatched based on auth state - hooks always called
  const isWatched = useMemo(() => {
    if (isAuthenticated) {
      return watchlistTickers.has(ticker);
    }
    return localItems.some((item) => item.ticker === ticker);
  }, [isAuthenticated, watchlistTickers, localItems, ticker]);

  const isPending = useMemo(() => 
    addMutation.isPending || removeMutation.isPending,
    [addMutation.isPending, removeMutation.isPending]
  );

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPending) return;

    if (isAuthenticated) {
      if (isWatched) {
        removeMutation.mutate(ticker);
      } else {
        addMutation.mutate(ticker);
      }
    } else {
      if (isWatched) {
        removeItem(ticker);
      } else {
        addItem(ticker);
      }
    }
  }, [isAuthenticated, isWatched, isPending, addMutation, removeMutation, addItem, removeItem, ticker]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleToggle(e as unknown as React.MouseEvent);
    }
  }, [handleToggle]);

  return (
    <button
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      disabled={isPending}
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
});

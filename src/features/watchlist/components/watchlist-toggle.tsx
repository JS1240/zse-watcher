import { memo, useMemo, useCallback, useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
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

  // Local loading state for instant localStorage feedback
  const [isAnimating, setIsAnimating] = useState(false);

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

  // Show spinner when mutation is pending (authenticated users)
  const showLoading = isPending && isAuthenticated;

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPending) return;

    // Trigger animation
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);

    // Show toast feedback
    if (isWatched) {
      toast.success(`${ticker} removed from watchlist`);
    } else {
      toast.success(`${ticker} added to watchlist`);
    }

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
      type="button"
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      disabled={isPending}
      aria-label={isWatched ? "Remove from watchlist" : "Add to watchlist"}
      className={cn(
        "rounded-sm p-1.5 transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        isAnimating && "scale-125",
        className,
      )}
      title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
    >
      {showLoading ? (
        <Loader2
          className="h-3.5 w-3.5 animate-spin text-amber"
        />
      ) : (
        <Star
          className={cn(
            "h-3.5 w-3.5 transition-all duration-200",
            isAnimating && "rotate-12",
            isWatched
              ? "fill-amber text-amber"
              : "text-muted-foreground hover:text-amber",
          )}
        />
      )}
    </button>
  );
});

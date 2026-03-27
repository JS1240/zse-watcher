import { Star } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import {
  useWatchlistTickers,
  useAddToWatchlist,
  useRemoveFromWatchlist,
} from "@/features/watchlist/api/watchlist-queries";
import { cn } from "@/lib/utils";

interface WatchlistToggleProps {
  ticker: string;
  className?: string;
}

export function WatchlistToggle({ ticker, className }: WatchlistToggleProps) {
  const { isAuthenticated } = useAuth();
  const watchlistTickers = useWatchlistTickers();
  const addMutation = useAddToWatchlist();
  const removeMutation = useRemoveFromWatchlist();

  if (!isAuthenticated) return null;

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

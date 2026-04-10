import { createFileRoute } from "@tanstack/react-router";
import { WatchlistPage } from "@/features/watchlist/pages/watchlist-page";

export const Route = createFileRoute("/watchlist")({
  component: WatchlistPage,
});

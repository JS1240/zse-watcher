export interface Watchlist {
  id: string;
  userId: string;
  name: string;
  sortOrder: number;
  createdAt: string;
}

export interface WatchlistItem {
  id: string;
  watchlistId: string;
  ticker: string;
  sortOrder: number;
  addedAt: string;
}

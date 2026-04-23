import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/config/supabase";
import { useAuth } from "@/hooks/use-auth";
import { FREE_TIER_LIMITS } from "@/config/constants";
import { createLogger } from "@/lib/logger";
import { toast } from "sonner";

const logger = createLogger("WatchlistQueries");

interface WatchlistItem {
  id: string;
  ticker: string;
  added_at: string;
}

async function fetchWatchlistItems(userId: string): Promise<WatchlistItem[]> {
  // Get the default watchlist
  const { data: watchlists, error: wErr } = await supabase
    .from("watchlists")
    .select("id")
    .eq("user_id", userId)
    .order("sort_order")
    .limit(1);

  if (wErr || !watchlists?.length) {
    logger.warn("No watchlist found", wErr);
    return [];
  }

  const { data: items, error } = await supabase
    .from("watchlist_items")
    .select("id, ticker, added_at")
    .eq("watchlist_id", watchlists[0].id)
    .order("sort_order");

  if (error) {
    logger.error("Failed to fetch watchlist items", error);
    return [];
  }

  return items ?? [];
}

export function useWatchlistItems() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["watchlist", user?.id],
    queryFn: () => fetchWatchlistItems(user!.id),
    enabled: !!user,
  });
}

export function useWatchlistTickers(): Set<string> {
  const { data } = useWatchlistItems();
  return new Set(data?.map((item) => item.ticker) ?? []);
}

export function useAddToWatchlist() {
  const { t } = useTranslation("watchlist");
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (ticker: string) => {
      if (!user) throw new Error("Not authenticated");

      // Check free tier limit
      const current = queryClient.getQueryData<WatchlistItem[]>(["watchlist", user.id]);
      if (current && current.length >= FREE_TIER_LIMITS.MAX_WATCHLIST_ITEMS) {
        throw new Error(`Free tier limit: max ${FREE_TIER_LIMITS.MAX_WATCHLIST_ITEMS} watchlist items`);
      }

      // Get default watchlist
      const { data: watchlists } = await supabase
        .from("watchlists")
        .select("id")
        .eq("user_id", user.id)
        .order("sort_order")
        .limit(1);

      if (!watchlists?.length) throw new Error("No watchlist found");

      const { error } = await supabase
        .from("watchlist_items")
        .insert({ watchlist_id: watchlists[0].id, ticker });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist", user?.id] });
      toast.success(t("toast.added"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("toast.addFailed"));
    },
  });
}

// New function: Clear all items from the watchlist
export function useClearWatchlist() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      // Get default watchlist
      const { data: watchlists } = await supabase
        .from("watchlists")
        .select("id")
        .eq("user_id", user.id)
        .order("sort_order")
        .limit(1);

      if (!watchlists?.length) throw new Error("No watchlist found");

      const { error } = await supabase
        .from("watchlist_items")
        .delete()
        .eq("watchlist_id", watchlists[0].id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });
}

export function useRemoveFromWatchlist() {
  const { t } = useTranslation("watchlist");
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (ticker: string) => {
      if (!user) throw new Error("Not authenticated");

      // Get default watchlist
      const { data: watchlists } = await supabase
        .from("watchlists")
        .select("id")
        .eq("user_id", user.id)
        .order("sort_order")
        .limit(1);

      if (!watchlists?.length) throw new Error("No watchlist found");

      const { error } = await supabase
        .from("watchlist_items")
        .delete()
        .eq("watchlist_id", watchlists[0].id)
        .eq("ticker", ticker);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist", user?.id] });
      toast.success(t("toast.removed"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("toast.removeFailed"));
    },
  });
}

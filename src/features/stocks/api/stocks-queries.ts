import { useQuery } from "@tanstack/react-query";
import { fetchZseStocks } from "@/lib/eodhd-service";
import { REFETCH_INTERVALS } from "@/config/constants";
import type { Stock } from "@/types/stock";
import { createLogger } from "@/lib/logger";
import { setLastUpdatedForSource } from "@/hooks/use-last-updated";

const logger = createLogger("StocksQueries");

// ZSE closes at 16:00 CET. EOD data is final after close.
// Cache aggressively until then; refresh once after typical close time.
// staleTime: 1 hour during trading day (data won't change intraday on free plan anyway)
// refetchInterval: 30s keeps the demo banner responsive in dev
async function fetchStocksLive(): Promise<{ stocks: Stock[]; isMockData: boolean }> {
  const apiKey = import.meta.env.VITE_EODHD_API_KEY as string | undefined;
  const result = await fetchZseStocks(apiKey);

  if (result.errors.length > 0 && !result.isMockData) {
    logger.warn("Partial EODHD failures", { errors: result.errors });
  }

  return { stocks: result.stocks, isMockData: result.isMockData };
}

export function useStocksLive() {
  return useQuery({
    queryKey: ["stocks", "live"],
    queryFn: async () => {
      const result = await fetchStocksLive();
      setLastUpdatedForSource("stocks");
      return result;
    },
    // EOD data doesn't update intraday on free plan — stale after 1 hour
    staleTime: 60 * 60 * 1000,
    refetchInterval: REFETCH_INTERVALS.STOCKS_LIVE,
  });
}

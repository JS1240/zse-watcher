import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { MOCK_STOCKS } from "@/lib/mock-data";
import { REFETCH_INTERVALS } from "@/config/constants";
import type { Stock } from "@/types/stock";
import { createLogger } from "@/lib/logger";

const logger = createLogger("StocksQueries");

async function fetchStocksLive(): Promise<Stock[]> {
  try {
    const data = await apiFetch<{ stocks: Stock[] }>("/stocks/live");
    return data.stocks;
  } catch (error) {
    logger.warn("Using mock stock data", error);
    return MOCK_STOCKS;
  }
}

export function useStocksLive() {
  return useQuery({
    queryKey: ["stocks", "live"],
    queryFn: fetchStocksLive,
    refetchInterval: REFETCH_INTERVALS.STOCKS_LIVE,
  });
}

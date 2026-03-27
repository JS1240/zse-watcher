import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { getMockStockDetail, getMockPriceHistory } from "@/lib/mock-data";
import { REFETCH_INTERVALS, STALE_TIMES } from "@/config/constants";
import type { StockDetail, PricePoint } from "@/types/stock";
import type { ChartRange } from "@/config/constants";
import { createLogger } from "@/lib/logger";

const logger = createLogger("StockDetailQueries");

async function fetchStockDetail(
  ticker: string,
): Promise<{ stock: StockDetail | null; isMockData: boolean }> {
  try {
    const stock = await apiFetch<StockDetail>(`/stock/${ticker}`);
    return { stock, isMockData: false };
  } catch (error) {
    logger.warn(`Using mock detail for ${ticker}`, error);
    return { stock: getMockStockDetail(ticker), isMockData: true };
  }
}

async function fetchStockHistory(
  ticker: string,
  range: ChartRange,
): Promise<PricePoint[]> {
  try {
    const data = await apiFetch<{ history: PricePoint[] }>(
      `/stock/${ticker}/history?range=${range}`,
    );
    return data.history;
  } catch (error) {
    logger.warn(`Using mock history for ${ticker}`, error);
    return getMockPriceHistory(ticker, range);
  }
}

export function useStockDetail(ticker: string | null) {
  return useQuery({
    queryKey: ["stock", ticker, "detail"],
    queryFn: () => fetchStockDetail(ticker!),
    enabled: !!ticker,
    refetchInterval: REFETCH_INTERVALS.STOCK_DETAIL,
    staleTime: STALE_TIMES.STOCK_DETAIL,
  });
}

export type StockDetailResult = Awaited<ReturnType<typeof fetchStockDetail>>;

export function useStockHistory(ticker: string | null, range: ChartRange) {
  return useQuery({
    queryKey: ["stock", ticker, "history", range],
    queryFn: () => fetchStockHistory(ticker!, range),
    enabled: !!ticker,
    refetchInterval: REFETCH_INTERVALS.STOCK_HISTORY,
  });
}

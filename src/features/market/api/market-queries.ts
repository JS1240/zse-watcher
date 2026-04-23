import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { MOCK_MARKET_STATUS, MOCK_MOVERS, MOCK_MACRO } from "@/lib/mock-data";
import { REFETCH_INTERVALS, STALE_TIMES } from "@/config/constants";
import type { MarketStatus, Mover, MacroData } from "@/types/market";
import { createLogger } from "@/lib/logger";
import { setLastUpdatedForSource } from "@/hooks/use-last-updated";

const logger = createLogger("MarketQueries");

async function fetchMarketStatus(): Promise<MarketStatus> {
  try {
    return await apiFetch<MarketStatus>("/market/status");
  } catch (error) {
    logger.warn("Using mock market status", error);
    return MOCK_MARKET_STATUS;
  }
}

async function fetchMovers(): Promise<{ gainers: Mover[]; losers: Mover[] }> {
  try {
    return await apiFetch<{ gainers: Mover[]; losers: Mover[] }>("/movers");
  } catch (error) {
    logger.warn("Using mock movers", error);
    return MOCK_MOVERS;
  }
}

async function fetchMacro(): Promise<MacroData> {
  try {
    return await apiFetch<MacroData>("/macro");
  } catch (error) {
    logger.warn("Using mock macro data", error);
    return MOCK_MACRO;
  }
}

export function useMarketStatus() {
  return useQuery({
    queryKey: ["market", "status"],
    queryFn: async () => {
      const result = await fetchMarketStatus();
      setLastUpdatedForSource("market");
      return result;
    },
    refetchInterval: REFETCH_INTERVALS.MARKET_STATUS,
    staleTime: STALE_TIMES.MARKET_STATUS,
  });
}

export function useMovers() {
  return useQuery({
    queryKey: ["market", "movers"],
    queryFn: async () => {
      const result = await fetchMovers();
      setLastUpdatedForSource("movers");
      return result;
    },
    refetchInterval: REFETCH_INTERVALS.MOVERS,
  });
}

export function useMacro() {
  return useQuery({
    queryKey: ["market", "macro"],
    queryFn: async () => {
      const result = await fetchMacro();
      setLastUpdatedForSource("macro");
      return result;
    },
    refetchInterval: REFETCH_INTERVALS.MACRO,
    staleTime: STALE_TIMES.MACRO,
  });
}

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { MOCK_NEWS } from "@/lib/mock-data";
import { REFETCH_INTERVALS } from "@/config/constants";
import type { NewsArticle } from "@/types/news";
import { createLogger } from "@/lib/logger";
import { setLastUpdatedForSource } from "@/hooks/use-last-updated";

const logger = createLogger("NewsQueries");

async function fetchNews(): Promise<NewsArticle[]> {
  try {
    return await apiFetch<NewsArticle[]>("/news");
  } catch (error) {
    logger.warn("Using mock news data", error);
    return MOCK_NEWS;
  }
}

export function useNews() {
  return useQuery({
    queryKey: ["news"],
    queryFn: async () => {
      const result = await fetchNews();
      setLastUpdatedForSource("news");
      return result;
    },
    refetchInterval: REFETCH_INTERVALS.NEWS,
  });
}

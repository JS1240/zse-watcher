import { useQuery } from "@tanstack/react-query";
import { setLastUpdatedForSource } from "@/hooks/use-last-updated";

export interface ForexRates {
  eurUsd: number;
  eurChf: number;
  eurGbp: number;
  eurHrk: number; // CNB reference rate (fixed)
  usdHrk: number;
  updatedAt: string;
}

const HRK_RATE = 7.5; // EUR/HRK CNB fixing (semi-fixed)

async function fetchForexRates(): Promise<ForexRates> {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=EUR&to=USD,CHF,GBP", {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) throw new Error("forex fetch failed");

    const data = await res.json() as { rates: Record<string, number>; date: string };

    const eurUsd = data.rates["USD"] ?? 1.08;
    const eurChf = data.rates["CHF"] ?? 0.98;
    const eurGbp = data.rates["GBP"] ?? 0.86;

    return {
      eurUsd,
      eurChf,
      eurGbp,
      eurHrk: HRK_RATE,
      usdHrk: HRK_RATE / eurUsd,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    // Return fallback values
    return {
      eurUsd: 1.0825,
      eurChf: 0.9840,
      eurGbp: 0.8580,
      eurHrk: HRK_RATE,
      usdHrk: HRK_RATE / 1.0825,
      updatedAt: new Date().toISOString(),
    };
  }
}

export function useForexRates() {
  return useQuery({
    queryKey: ["forex"],
    queryFn: async () => {
      const result = await fetchForexRates();
      setLastUpdatedForSource("forex");
      return result;
    },
    refetchInterval: 5 * 60 * 1000, // refresh every 5 minutes
    staleTime: 5 * 60 * 1000,
  });
}

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { REFETCH_INTERVALS } from "@/config/constants";
import { createLogger } from "@/lib/logger";

const logger = createLogger("DividendsQueries");

export interface DividendEntry {
  ticker: string;
  name: string;
  exDivDate: string;
  payDate: string;
  amountEur: number;
  yield: number;
}

const MOCK_DIVIDENDS: DividendEntry[] = [
  { ticker: "HT-R-A", name: "HT d.d.", exDivDate: "2026-04-15", payDate: "2026-05-01", amountEur: 1.53, yield: 5.8 },
  { ticker: "ADRS-P-A", name: "Adris grupa d.d.", exDivDate: "2026-05-10", payDate: "2026-05-25", amountEur: 1.43, yield: 3.2 },
  { ticker: "KOEI-R-A", name: "Koncar d.d.", exDivDate: "2026-05-20", payDate: "2026-06-05", amountEur: 3.00, yield: 2.1 },
  { ticker: "PODR-R-A", name: "Podravka d.d.", exDivDate: "2026-06-01", payDate: "2026-06-15", amountEur: 1.20, yield: 2.4 },
  { ticker: "ZABA-R-A", name: "Zagrebacka banka d.d.", exDivDate: "2026-06-10", payDate: "2026-06-25", amountEur: 5.00, yield: 3.5 },
  { ticker: "ERNT-R-A", name: "Ericsson Nikola Tesla d.d.", exDivDate: "2026-06-20", payDate: "2026-07-05", amountEur: 7.50, yield: 5.0 },
  { ticker: "KRAS-R-A", name: "Kras d.d.", exDivDate: "2026-07-01", payDate: "2026-07-15", amountEur: 12.00, yield: 1.9 },
  { ticker: "MAIS-R-A", name: "Maistra d.d.", exDivDate: "2026-07-10", payDate: "2026-07-25", amountEur: 8.00, yield: 2.1 },
];

async function fetchDividends(): Promise<DividendEntry[]> {
  try {
    const data = await apiFetch<DividendEntry[]>("/dividends");
    if (Array.isArray(data) && data.length > 0) return data;
    return MOCK_DIVIDENDS;
  } catch (error) {
    logger.warn("Using mock dividend data", error);
    return MOCK_DIVIDENDS;
  }
}

export function useDividends() {
  return useQuery({
    queryKey: ["dividends"],
    queryFn: fetchDividends,
    refetchInterval: REFETCH_INTERVALS.DIVIDENDS,
  });
}

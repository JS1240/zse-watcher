import { createLogger } from "@/lib/logger";
import { MOCK_STOCKS } from "@/lib/mock-data";
import type { Stock } from "@/types/stock";

const logger = createLogger("EodhdService");

const EODHD_BASE = "https://eodhd.com/api";
const ZSE_MIC = "XZAG";

// ZSE ticker suffix patterns (share types):
// -R-A = Redovni (ordinary shares)
// -P-A = Preferencijalni (preference shares)
function toEodhdTicker(zseTicker: string): string {
  return `${zseTicker.split("-")[0]}.${ZSE_MIC}`;
}

export interface EodhdEodRecord {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjusted_close: number;
  volume: number;
}

async function fetchEodhd<T>(path: string, apiKey: string): Promise<T> {
  const url = `${EODHD_BASE}${path}&api_token=${apiKey}&fmt=json`;
  const response = await fetch(url);

  if (response.status === 429) {
    throw new Error("EODHD_RATE_LIMITED");
  }
  if (response.status === 404) {
    throw new Error("EODHD_NOT_FOUND");
  }
  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown error");
    throw new Error(`EODHD_ERROR_${response.status}: ${text}`);
  }

  return response.json() as Promise<T>;
}

export interface EodhdStock extends Omit<Stock, "changePct" | "turnover" | "dividendYield"> {
  changePct: number;
  turnover: number;
  dividendYield: number | null;
}

async function fetchOneEodhdStock(
  zseTicker: string,
  apiKey: string,
): Promise<EodhdStock> {
  const eodhdTicker = toEodhdTicker(zseTicker);

  // Fetch last 2 days to compute change
  const records = await fetchEodhd<EodhdEodRecord[]>(
    `/eod/${eodhdTicker}?period=2`,
    apiKey,
  );

  if (!records || records.length < 2) {
    throw new Error(`EODHD_INSUFFICIENT_DATA for ${zseTicker}`);
  }

  // Records are newest first
  const [today, yesterday] = records;

  const changePct =
    yesterday.close !== 0
      ? parseFloat((((today.close - yesterday.close) / yesterday.close) * 100).toFixed(2))
      : 0;

  return {
    ticker: zseTicker,
    name: MOCK_STOCKS.find((s) => s.ticker === zseTicker)?.name ?? zseTicker,
    sector: MOCK_STOCKS.find((s) => s.ticker === zseTicker)?.sector ?? "Nepoznato",
    isin: MOCK_STOCKS.find((s) => s.ticker === zseTicker)?.isin ?? "",
    price: today.adjusted_close,
    changePct,
    turnover: today.volume * today.adjusted_close,
    volume: today.volume,
    dividendYield: MOCK_STOCKS.find((s) => s.ticker === zseTicker)?.dividendYield ?? null,
  };
}

export interface EodhdResult {
  stocks: Stock[];
  isMockData: boolean;
  errors: string[];
}

/**
 * Fetch live ZSE stock data from eodhd.com.
 *
 * Falls back gracefully to mock data when:
 * - VITE_EODHD_API_KEY is not set
 * - Network errors occur
 * - API returns errors (rate limits, not found, etc.)
 *
 * For the free plan (20 calls/day), we make one combined request per ticker
 * rather than batching — the free tier limit is the constraint, not latency.
 */
export async function fetchZseStocks(apiKey: string | undefined): Promise<EodhdResult> {
  if (!apiKey) {
    logger.debug("No EODHD_API_KEY set — using mock data");
    return { stocks: MOCK_STOCKS, isMockData: true, errors: [] };
  }

  const tickers = MOCK_STOCKS.map((s) => s.ticker);
  const stocks: Stock[] = [];
  const errors: string[] = [];

  for (const ticker of tickers) {
    try {
      const stock = await fetchOneEodhdStock(ticker, apiKey);
      stocks.push(stock);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(`EODHD fetch failed for ${ticker}: ${msg}`);
      // Fall back to mock for this ticker
      const mock = MOCK_STOCKS.find((s) => s.ticker === ticker);
      if (mock) stocks.push(mock);
      errors.push(`${ticker}: ${msg}`);
    }
  }

  const isMockData = errors.length === tickers.length; // all failed = truly mock
  return { stocks, isMockData, errors };
}

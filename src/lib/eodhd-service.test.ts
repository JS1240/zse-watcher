import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchZseStocks } from "@/lib/eodhd-service";
import * as mockData from "@/lib/mock-data";

// Mock the logger to avoid noise in tests
vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

const MOCK_EOD_TODAY = {
  date: "2026-03-26",
  open: 26.0,
  high: 26.6,
  low: 25.9,
  close: 26.4,
  adjusted_close: 26.4,
  volume: 10200,
};

const MOCK_EOD_YESTERDAY = {
  date: "2026-03-25",
  open: 25.8,
  high: 26.2,
  low: 25.7,
  close: 26.2,
  adjusted_close: 26.2,
  volume: 9800,
};



// Mock fetch for all tickers with sequential responses
type FetchResponse = Partial<Response> & { ok: boolean; status: number; json: () => Promise<unknown> };
function mockAll(responses: FetchResponse[]) {
  let callIndex = 0;
  return vi.spyOn(global, "fetch").mockImplementation(async () => {
    const response = responses[callIndex] ?? { ok: false, status: 999, json: async () => [] };
    callIndex++;
    return response as Response;
  });
}

describe("fetchZseStocks", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns mock data when no API key is provided", async () => {
    const result = await fetchZseStocks(undefined);
    expect(result.isMockData).toBe(true);
    expect(result.stocks).toEqual(mockData.MOCK_STOCKS);
    expect(result.errors).toEqual([]);
  });

  it("returns mock data when API key is empty string", async () => {
    const result = await fetchZseStocks("");
    expect(result.isMockData).toBe(true);
    expect(result.stocks).toEqual(mockData.MOCK_STOCKS);
  });

  it("maps eodhd EOD data to Stock shape — price and changePct", async () => {
    const tickers = mockData.MOCK_STOCKS.map((s) => s.ticker);
    const responses: FetchResponse[] = tickers.map(() => ({
      ok: true,
      status: 200,
      json: async () => [MOCK_EOD_TODAY, MOCK_EOD_YESTERDAY],
    }));
    mockAll(responses);

    const result = await fetchZseStocks("test-api-key");

    const adrs = result.stocks.find((s) => s.ticker === "ADRS-P-A");
    expect(adrs).toBeDefined();
    expect(adrs!.price).toBe(26.4);
    expect(adrs!.volume).toBe(10200);

    const expectedChange = parseFloat(
      (((MOCK_EOD_TODAY.close - MOCK_EOD_YESTERDAY.close) /
        MOCK_EOD_YESTERDAY.close) *
        100
      ).toFixed(2),
    );
    expect(adrs!.changePct).toBe(expectedChange);
    expect(result.isMockData).toBe(false);
    expect(result.errors).toEqual([]);
  });

  it("falls back to mock for a ticker on 404", async () => {
    const tickers = mockData.MOCK_STOCKS.map((s) => s.ticker);
    const responses: FetchResponse[] = tickers.map((_, i) => {
      if (i === 0) return { ok: false, status: 404, json: async () => [] };
      if (i === 1) return { ok: true, status: 200, json: async () => [MOCK_EOD_TODAY, MOCK_EOD_YESTERDAY] };
      return { ok: true, status: 200, json: async () => [MOCK_EOD_TODAY, MOCK_EOD_YESTERDAY] };
    });
    mockAll(responses);

    const result = await fetchZseStocks("test-api-key");

    // ADRS-P-A should use mock data (44.80)
    const adrs = result.stocks.find((s) => s.ticker === "ADRS-P-A");
    expect(adrs).toBeDefined();
    expect(adrs!.price).toBe(44.8);

    // ARNT-R-A should have live data
    const arnt = result.stocks.find((s) => s.ticker === "ARNT-R-A");
    expect(arnt!.price).toBe(26.4);

    // Should record an error for ADRS
    expect(result.errors.some((e) => e.includes("ADRS-P-A"))).toBe(true);
  });

  it("continues with mock fallback on rate limit", async () => {
    const tickers = mockData.MOCK_STOCKS.map((s) => s.ticker);
    const responses: FetchResponse[] = tickers.map((_, i) => {
      if (i === 0) return { ok: false, status: 429, json: async () => [] };
      return { ok: true, status: 200, json: async () => [MOCK_EOD_TODAY, MOCK_EOD_YESTERDAY] };
    });
    mockAll(responses);

    const result = await fetchZseStocks("test-api-key");

    expect(result.stocks.length).toBe(mockData.MOCK_STOCKS.length);
    expect(result.errors.some((e) => e.includes("RATE_LIMITED"))).toBe(true);
    expect(result.isMockData).toBe(false); // not all failed
  });

  it("marks isMockData true only when all tickers fail", async () => {
    const responses: FetchResponse[] = mockData.MOCK_STOCKS.map(() => ({
      ok: false,
      status: 500,
      json: async () => [],
    }));
    mockAll(responses);

    const result = await fetchZseStocks("test-api-key");

    expect(result.isMockData).toBe(true);
    expect(result.stocks).toEqual(mockData.MOCK_STOCKS);
  });

  it("enriches eodhd data with dividendYield from mock", async () => {
    const responses: FetchResponse[] = mockData.MOCK_STOCKS.map(() => ({
      ok: true,
      status: 200,
      json: async () => [MOCK_EOD_TODAY, MOCK_EOD_YESTERDAY],
    }));
    mockAll(responses);

    const result = await fetchZseStocks("test-api-key");

    const ht = result.stocks.find((s) => s.ticker === "HT-R-A");
    expect(ht?.dividendYield).toBe(5.8);
  });

  it("enriches eodhd data with sector and isin from mock", async () => {
    const responses: FetchResponse[] = mockData.MOCK_STOCKS.map(() => ({
      ok: true,
      status: 200,
      json: async () => [MOCK_EOD_TODAY, MOCK_EOD_YESTERDAY],
    }));
    mockAll(responses);

    const result = await fetchZseStocks("test-api-key");

    const ht = result.stocks.find((s) => s.ticker === "HT-R-A");
    expect(ht?.sector).toBe("Telekomunikacije");
    expect(ht?.isin).toBe("HRHTRARA00");
  });
});

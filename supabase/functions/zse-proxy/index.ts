import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
};

// In-memory cache with TTL
const cache = new Map<string, { data: unknown; expiresAt: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry || Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown, ttlMs: number): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

// ZSE REST API client
const ZSE_BASE = "https://rest.zse.hr/web/Bvt9fe2peQ7pwpyYqODM";

async function fetchZSE(path: string): Promise<unknown> {
  const url = `${ZSE_BASE}${path}`;
  const response = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "ZSEWatcher/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(`ZSE API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Handlers
async function handleStocksLive(): Promise<Response> {
  const cacheKey = "stocks:live";
  const cached = getCached<unknown>(cacheKey);
  if (cached) return jsonResponse(cached);

  try {
    const data = await fetchZSE("/json/WebHomeData");
    const homeData = data as Record<string, unknown>;

    // Transform ZSE data to our Stock format
    const securities = (homeData.securities || homeData.Securities || []) as Record<string, unknown>[];
    const stocks = securities.map((s) => ({
      ticker: s.symbol || s.Symbol || "",
      name: s.long_name || s.LongName || s.symbol || "",
      sector: s.sector || s.Sector || "N/A",
      isin: s.isin || s.ISIN || "",
      price: parseFloat(String(s.last_price || s.LastPrice || 0)),
      changePct: parseFloat(String(s.change_prev_close_percentage || s.ChangePrevClosePercentage || 0)),
      turnover: parseFloat(String(s.turnover || s.Turnover || 0)),
      volume: parseInt(String(s.volume || s.Volume || 0), 10),
    }));

    const result = { stocks };
    setCache(cacheKey, result, 15_000);
    return jsonResponse(result);
  } catch (error) {
    console.error("Failed to fetch stocks:", error);
    return jsonResponse({ stocks: [], error: "Failed to fetch live data" }, 502);
  }
}

async function handleMarketStatus(): Promise<Response> {
  const cacheKey = "market:status";
  const cached = getCached<unknown>(cacheKey);
  if (cached) return jsonResponse(cached);

  const now = new Date();
  const hours = now.getUTCHours() + 1; // CET = UTC+1 (simplified)
  const day = now.getUTCDay();
  const isWeekday = day >= 1 && day <= 5;
  const isMarketHours = hours >= 9 && hours < 16;
  const isOpen = isWeekday && isMarketHours;

  const result = {
    isOpen,
    nextOpenAt: null,
    nextCloseAt: null,
  };

  setCache(cacheKey, result, 30_000);
  return jsonResponse(result);
}

async function handleMovers(): Promise<Response> {
  const cacheKey = "market:movers";
  const cached = getCached<unknown>(cacheKey);
  if (cached) return jsonResponse(cached);

  try {
    const data = await fetchZSE("/json/WebHomeData");
    const homeData = data as Record<string, unknown>;

    const securities = (homeData.securities || homeData.Securities || []) as Record<string, unknown>[];
    const sorted = securities
      .map((s) => ({
        ticker: String(s.symbol || s.Symbol || ""),
        name: String(s.long_name || s.LongName || ""),
        price: parseFloat(String(s.last_price || s.LastPrice || 0)),
        changePct: parseFloat(String(s.change_prev_close_percentage || s.ChangePrevClosePercentage || 0)),
      }))
      .filter((s) => s.price > 0)
      .sort((a, b) => b.changePct - a.changePct);

    const result = {
      gainers: sorted.slice(0, 5),
      losers: sorted.slice(-5).reverse(),
    };

    setCache(cacheKey, result, 30_000);
    return jsonResponse(result);
  } catch (error) {
    console.error("Failed to fetch movers:", error);
    return jsonResponse({ gainers: [], losers: [] }, 502);
  }
}

async function handleMacro(): Promise<Response> {
  const cacheKey = "market:macro";
  const cached = getCached<unknown>(cacheKey);
  if (cached) return jsonResponse(cached);

  try {
    const data = await fetchZSE("/json/WebHomeData");
    const homeData = data as Record<string, unknown>;
    const indices = (homeData.indices || homeData.Indices || []) as Record<string, unknown>[];

    const findIndex = (name: string) => {
      const idx = indices.find(
        (i) => String(i.symbol || i.Symbol || "").toUpperCase().includes(name.toUpperCase()),
      );
      return {
        value: parseFloat(String(idx?.last_price || idx?.LastPrice || 0)),
        changePct: parseFloat(String(idx?.change_prev_close_percentage || idx?.ChangePrevClosePercentage || 0)),
      };
    };

    const result = {
      crobex: findIndex("CROBEX"),
      crobex10: findIndex("CROBEX10"),
      euroStoxx50: { value: 0, changePct: 0 },
      eurUsd: 0,
    };

    setCache(cacheKey, result, 300_000);
    return jsonResponse(result);
  } catch (error) {
    console.error("Failed to fetch macro:", error);
    return jsonResponse({
      crobex: { value: 0, changePct: 0 },
      crobex10: { value: 0, changePct: 0 },
      euroStoxx50: { value: 0, changePct: 0 },
      eurUsd: 0,
    }, 502);
  }
}

async function handleNews(): Promise<Response> {
  const cacheKey = "news:general";
  const cached = getCached<unknown>(cacheKey);
  if (cached) return jsonResponse(cached);

  try {
    const data = await fetchZSE("/json/WebNewsDataHomeNews");
    const newsData = data as Record<string, unknown>[];
    const articles = (Array.isArray(newsData) ? newsData : []).slice(0, 20).map((n, i) => ({
      id: String(n.id || n.Id || i),
      title: String(n.title || n.Title || n.headline || ""),
      summary: String(n.summary || n.Summary || n.content || "").slice(0, 200),
      source: "ZSE",
      url: String(n.url || n.Url || `https://zse.hr/news/${i}`),
      publishedAt: String(n.date || n.Date || n.publishedAt || new Date().toISOString()),
      ticker: n.ticker ? String(n.ticker) : null,
      category: "general" as const,
    }));

    setCache(cacheKey, articles, 120_000);
    return jsonResponse(articles);
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return jsonResponse([], 502);
  }
}

async function handleStockDetail(ticker: string): Promise<Response> {
  const cacheKey = `stock:detail:${ticker}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return jsonResponse(cached);

  try {
    // Get base stock data from live feed
    const data = await fetchZSE("/json/WebHomeData");
    const homeData = data as Record<string, unknown>;
    const securities = (homeData.securities || homeData.Securities || []) as Record<string, unknown>[];

    const security = securities.find(
      (s) => String(s.symbol || s.Symbol || "").toUpperCase() === ticker.toUpperCase(),
    );

    if (!security) {
      return jsonResponse({ error: "Stock not found" }, 404);
    }

    const result = {
      ticker: String(security.symbol || security.Symbol || ""),
      name: String(security.long_name || security.LongName || ""),
      sector: String(security.sector || security.Sector || "N/A"),
      isin: String(security.isin || security.ISIN || ""),
      price: parseFloat(String(security.last_price || security.LastPrice || 0)),
      changePct: parseFloat(String(security.change_prev_close_percentage || security.ChangePrevClosePercentage || 0)),
      turnover: parseFloat(String(security.turnover || security.Turnover || 0)),
      volume: parseInt(String(security.volume || security.Volume || 0), 10),
      description: String(security.description || ""),
      founded: String(security.founded || ""),
      marketCapM: parseFloat(String(security.market_cap || 0)) / 1_000_000,
      sharesM: parseFloat(String(security.shares_outstanding || 0)) / 1_000_000,
      peRatio: security.pe_ratio ? parseFloat(String(security.pe_ratio)) : null,
      dividendYield: security.dividend_yield ? parseFloat(String(security.dividend_yield)) : null,
      high52w: parseFloat(String(security.high_52w || security.high52w || 0)),
      low52w: parseFloat(String(security.low_52w || security.low52w || 0)),
      website: String(security.website || ""),
    };

    setCache(cacheKey, result, 30_000);
    return jsonResponse(result);
  } catch (error) {
    console.error(`Failed to fetch stock detail for ${ticker}:`, error);
    return jsonResponse({ error: "Failed to fetch stock detail" }, 502);
  }
}

async function handleStockHistory(ticker: string, range: string): Promise<Response> {
  const cacheKey = `stock:history:${ticker}:${range}`;
  const cached = getCached<unknown>(cacheKey);
  if (cached) return jsonResponse(cached);

  try {
    // ZSE history endpoint - the exact URL pattern may vary
    // For now, return simplified data from the home data
    const data = await fetchZSE("/json/WebHomeData");
    const homeData = data as Record<string, unknown>;
    const securities = (homeData.securities || homeData.Securities || []) as Record<string, unknown>[];

    const security = securities.find(
      (s) => String(s.symbol || s.Symbol || "").toUpperCase() === ticker.toUpperCase(),
    );

    if (!security) {
      return jsonResponse({ history: [] }, 404);
    }

    // Generate basic history from available data points
    // Real implementation would call ZSE chart data endpoint
    const currentPrice = parseFloat(String(security.last_price || security.LastPrice || 0));
    const result = {
      history: [
        {
          time: new Date().toISOString().slice(0, 10),
          open: currentPrice,
          high: currentPrice * 1.005,
          low: currentPrice * 0.995,
          close: currentPrice,
          volume: parseInt(String(security.volume || security.Volume || 0), 10),
        },
      ],
    };

    setCache(cacheKey, result, 300_000);
    return jsonResponse(result);
  } catch (error) {
    console.error(`Failed to fetch history for ${ticker}:`, error);
    return jsonResponse({ history: [] }, 502);
  }
}

async function handleDividends(): Promise<Response> {
  const cacheKey = "dividends";
  const cached = getCached<unknown>(cacheKey);
  if (cached) return jsonResponse(cached);

  // Dividends data may need a different endpoint or scraping
  // Return empty for now with proper structure
  const result: unknown[] = [];
  setCache(cacheKey, result, 300_000);
  return jsonResponse(result);
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/zse-proxy/, "");

  try {
    switch (true) {
      case path === "/stocks/live":
        return await handleStocksLive();
      case path === "/market/status":
        return await handleMarketStatus();
      case path === "/movers":
        return await handleMovers();
      case path === "/macro":
        return await handleMacro();
      case path === "/news":
        return await handleNews();
      case path === "/news/trading":
        return await handleNews(); // Reuse for now
      case path === "/dividends":
        return await handleDividends();
      case path.startsWith("/stock/") && path.endsWith("/history"): {
        const parts = path.split("/");
        const ticker = parts[2];
        const range = url.searchParams.get("range") || "1M";
        return await handleStockHistory(ticker, range);
      }
      case path.startsWith("/stock/"): {
        const ticker = path.split("/")[2];
        return await handleStockDetail(ticker);
      }
      default:
        return jsonResponse({ error: "Not found" }, 404);
    }
  } catch (error) {
    console.error("Handler error:", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});

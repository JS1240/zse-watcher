import type { Stock, StockDetail, PricePoint } from "@/types/stock";
import type { MarketStatus, Mover, MacroData } from "@/types/market";
import type { NewsArticle } from "@/types/news";

export const MOCK_STOCKS: Stock[] = [
  { ticker: "ADRS-P-A", name: "Adris grupa d.d.", sector: "Turizam", isin: "HRADRSPPA0", price: 44.80, changePct: 1.36, turnover: 125340, volume: 2800, dividendYield: 3.2 },
  { ticker: "ARNT-R-A", name: "Arena Hospitality Group d.d.", sector: "Turizam", isin: "HRARNTRAR7", price: 33.00, changePct: -0.60, turnover: 49500, volume: 1500, dividendYield: null },
  { ticker: "ATGR-R-A", name: "Atlantic Grupa d.d.", sector: "Hrana", isin: "HRATGRRA00", price: 156.00, changePct: 0.65, turnover: 312000, volume: 2000, dividendYield: 1.8 },
  { ticker: "ATPL-R-A", name: "Atlantska plovidba d.d.", sector: "Transport", isin: "HRATPLRA07", price: 38.50, changePct: -1.28, turnover: 77000, volume: 2000, dividendYield: null },
  { ticker: "DDJH-R-A", name: "DD Holding d.d.", sector: "Financije", isin: "HRDDJHRA00", price: 310.00, changePct: 2.31, turnover: 620000, volume: 2000, dividendYield: 0.9 },
  { ticker: "DLKV-R-A", name: "Dalekovod d.d.", sector: "Industrija", isin: "HRDLKVRA00", price: 2.24, changePct: -2.18, turnover: 4480, volume: 2000, dividendYield: null },
  { ticker: "ERNT-R-A", name: "Ericsson Nikola Tesla d.d.", sector: "Tehnologija", isin: "HRERNTRAB6", price: 150.00, changePct: 0.00, turnover: 150000, volume: 1000, dividendYield: 4.1 },
  { ticker: "HT-R-A", name: "HT d.d.", sector: "Telekomunikacije", isin: "HRHTRARA00", price: 26.40, changePct: 0.76, turnover: 264000, volume: 10000, dividendYield: 5.8 },
  { ticker: "INGR-R-A", name: "Ingra d.d.", sector: "Graditeljstvo", isin: "HRINGRRA00", price: 0.64, changePct: 3.23, turnover: 3200, volume: 5000, dividendYield: null },
  { ticker: "KOEI-R-A", name: "Koncar - Elektroindustrija d.d.", sector: "Industrija", isin: "HRKOEIRA00", price: 142.00, changePct: 1.43, turnover: 710000, volume: 5000, dividendYield: 2.1 },
  { ticker: "KRAS-R-A", name: "Kras d.d.", sector: "Hrana", isin: "HRKRASRA00", price: 620.00, changePct: -0.48, turnover: 186000, volume: 300, dividendYield: null },
  { ticker: "MAIS-R-A", name: "Maistra d.d.", sector: "Turizam", isin: "HRMAISRA00", price: 380.00, changePct: 0.53, turnover: 380000, volume: 1000, dividendYield: null },
  { ticker: "OPTE-R-A", name: "OT-Optima Telekom d.d.", sector: "Telekomunikacije", isin: "HROPTERA00", price: 0.42, changePct: -4.55, turnover: 2100, volume: 5000, dividendYield: null },
  { ticker: "PODR-R-A", name: "Podravka d.d.", sector: "Hrana", isin: "HRPODRRA00", price: 50.00, changePct: 0.40, turnover: 250000, volume: 5000, dividendYield: 2.5 },
  { ticker: "RIVP-R-A", name: "Valamar Riviera d.d.", sector: "Turizam", isin: "HRRIVPRA00", price: 4.08, changePct: -1.45, turnover: 40800, volume: 10000, dividendYield: null },
  { ticker: "SPAN-R-A", name: "Span d.d.", sector: "Tehnologija", isin: "HRSPANRA00", price: 21.00, changePct: 2.44, turnover: 105000, volume: 5000, dividendYield: null },
  { ticker: "ULPL-R-A", name: "Uljanik plovidba d.d.", sector: "Transport", isin: "HRULPLRA00", price: 15.60, changePct: -0.64, turnover: 15600, volume: 1000, dividendYield: null },
  { ticker: "ZABA-R-A", name: "Zagrebacka banka d.d.", sector: "Financije", isin: "HRZABARA00", price: 142.80, changePct: 0.28, turnover: 714000, volume: 5000, dividendYield: null },
];

export const MOCK_MARKET_STATUS: MarketStatus = {
  isOpen: true,
  nextOpenAt: null,
  nextCloseAt: "2026-03-26T16:00:00+01:00",
};

export const MOCK_MOVERS: { gainers: Mover[]; losers: Mover[] } = {
  gainers: [
    { ticker: "INGR-R-A", name: "Ingra d.d.", price: 0.64, changePct: 3.23 },
    { ticker: "SPAN-R-A", name: "Span d.d.", price: 21.00, changePct: 2.44 },
    { ticker: "DDJH-R-A", name: "DD Holding d.d.", price: 310.00, changePct: 2.31 },
    { ticker: "KOEI-R-A", name: "Koncar d.d.", price: 142.00, changePct: 1.43 },
    { ticker: "ADRS-P-A", name: "Adris grupa d.d.", price: 44.80, changePct: 1.36 },
  ],
  losers: [
    { ticker: "OPTE-R-A", name: "OT-Optima Telekom", price: 0.42, changePct: -4.55 },
    { ticker: "DLKV-R-A", name: "Dalekovod d.d.", price: 2.24, changePct: -2.18 },
    { ticker: "RIVP-R-A", name: "Valamar Riviera", price: 4.08, changePct: -1.45 },
    { ticker: "ATPL-R-A", name: "Atlantska plovidba", price: 38.50, changePct: -1.28 },
    { ticker: "ULPL-R-A", name: "Uljanik plovidba", price: 15.60, changePct: -0.64 },
  ],
};

export const MOCK_MACRO: MacroData = {
  crobex: { value: 2847.32, changePct: 0.45 },
  crobex10: { value: 1623.18, changePct: 0.32 },
  euroStoxx50: { value: 5067.45, changePct: -0.12 },
  eurUsd: 1.0842,
};

export const MOCK_NEWS: NewsArticle[] = [
  {
    id: "1",
    title: "CROBEX indeks porast od 0.45% na zatvaranju",
    summary: "Hrvatski burzovni indeks CROBEX zavrsio je danas s rastom od 0.45 posto, potaknut jakim rezultatima u sektoru turizma.",
    source: "ZSE",
    url: "https://zse.hr",
    publishedAt: new Date().toISOString(),
    ticker: null,
    category: "general",
  },
  {
    id: "2",
    title: "Koncar objavio rezultate za Q4 2025",
    summary: "Koncar - Elektroindustrija objavila je rast prihoda od 12% u cetvrtom kvartalu 2025. godine.",
    source: "ZSE",
    url: "https://zse.hr",
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    ticker: "KOEI-R-A",
    category: "trading",
  },
  {
    id: "3",
    title: "Adris grupa planira novu akviziciju",
    summary: "Adris grupa d.d. najavila je potencijalni interes za akvizicijom u sektoru zdravstva.",
    source: "ZSE",
    url: "https://zse.hr",
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    ticker: "ADRS-P-A",
    category: "general",
  },
  {
    id: "4",
    title: "Valamar Riviera - sezona 2026 izgledi",
    summary: "Valamar Riviera objavio je pozitivne prognoze za turisticku sezonu 2026, ocekujuci rast prihoda od 8%.",
    source: "ZSE",
    url: "https://zse.hr",
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    ticker: "RIVP-R-A",
    category: "trading",
  },
];

const STOCK_DETAILS_MAP: Record<string, Omit<StockDetail, keyof Stock>> = {
  "ADRS-P-A": {
    description: "Adris grupa d.d. je diversificirana holdinska kompanija sa sjedistem u Rovinju. Aktivna je u turizmu, osiguranju, prehrambenoj industriji i duhanskoj industriji.",
    founded: "2003",
    marketCapM: 4480,
    sharesM: 100,
    peRatio: 12.5,
    high52w: 48.60,
    low52w: 38.20,
    website: "https://www.adris.hr",
  },
  "KOEI-R-A": {
    description: "Koncar - Elektroindustrija d.d. je vodeca hrvatska elektrotehnicka kompanija. Proizvodi transformatore, generatore, elektricna vozila i energetsku opremu.",
    founded: "1921",
    marketCapM: 3550,
    sharesM: 25,
    peRatio: 15.8,
    high52w: 158.00,
    low52w: 112.00,
    website: "https://www.koncar.hr",
  },
  "HT-R-A": {
    description: "HT d.d. (Hrvatski Telekom) je vodeci telekomunikacijski operator u Hrvatskoj. Pruza fiksne, mobilne, internetske i TV usluge.",
    founded: "1999",
    marketCapM: 2150,
    sharesM: 81.5,
    peRatio: 11.2,
    high52w: 28.80,
    low52w: 22.10,
    website: "https://www.t.ht.hr",
  },
};

const DEFAULT_DETAIL: Omit<StockDetail, keyof Stock> = {
  description: "Kompanija listana na Zagrebackoj burzi.",
  founded: "2000",
  marketCapM: 500,
  sharesM: 10,
  peRatio: null,
  high52w: 0,
  low52w: 0,
  website: "https://zse.hr",
};

export function getMockStockDetail(ticker: string): StockDetail | null {
  const stock = MOCK_STOCKS.find((s) => s.ticker === ticker);
  if (!stock) return null;

  const detail = STOCK_DETAILS_MAP[ticker] ?? DEFAULT_DETAIL;
  return {
    ...stock,
    ...detail,
    high52w: detail.high52w || stock.price * 1.15,
    low52w: detail.low52w || stock.price * 0.75,
  };
}

export function getMockPriceHistory(ticker: string, range: string): PricePoint[] {
  const stock = MOCK_STOCKS.find((s) => s.ticker === ticker);
  if (!stock) return [];

  const basePrice = stock.price;
  const now = Date.now();
  let points: number;
  let intervalMs: number;

  switch (range) {
    case "1D":
      points = 78; // 6.5h of trading at 5min intervals
      intervalMs = 5 * 60 * 1000;
      break;
    case "1W":
      points = 5 * 13; // 5 days, ~13 points each
      intervalMs = 30 * 60 * 1000;
      break;
    case "1M":
      points = 22; // trading days
      intervalMs = 24 * 60 * 60 * 1000;
      break;
    case "3M":
      points = 65;
      intervalMs = 24 * 60 * 60 * 1000;
      break;
    case "6M":
      points = 130;
      intervalMs = 24 * 60 * 60 * 1000;
      break;
    case "1Y":
      points = 252;
      intervalMs = 24 * 60 * 60 * 1000;
      break;
    default:
      points = 22;
      intervalMs = 24 * 60 * 60 * 1000;
  }

  // Generate deterministic pseudo-random walk based on ticker hash
  let seed = 0;
  for (let i = 0; i < ticker.length; i++) {
    seed = ((seed << 5) - seed + ticker.charCodeAt(i)) | 0;
  }

  const seededRandom = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const history: PricePoint[] = [];
  let price = basePrice * (1 - stock.changePct / 100); // start from previous price

  for (let i = 0; i < points; i++) {
    const change = (seededRandom() - 0.48) * basePrice * 0.02;
    price = Math.max(price + change, basePrice * 0.5);
    const high = price * (1 + seededRandom() * 0.01);
    const low = price * (1 - seededRandom() * 0.01);
    const open = price + (seededRandom() - 0.5) * basePrice * 0.005;
    const volume = Math.floor(500 + seededRandom() * 5000);
    const time = new Date(now - (points - i) * intervalMs);

    history.push({
      time: time.toISOString().slice(0, 10),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(price.toFixed(2)),
      volume,
    });
  }

  // Ensure last point matches current price
  if (history.length > 0) {
    history[history.length - 1].close = basePrice;
  }

  return history;
}

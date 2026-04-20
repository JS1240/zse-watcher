import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, within, fireEvent, act } from "@testing-library/react";
import { renderWithProviders } from "@/test-utils";
import { StockTable } from "@/features/stocks/components/stock-table";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { useSubscription } from "@/features/premium/hooks/use-subscription";
import { useSelectedStock } from "@/hooks/use-selected-stock";
import { useWatchlistTickers, useAddToWatchlist, useRemoveFromWatchlist } from "@/features/watchlist/api/watchlist-queries";
import { exportToCsv } from "@/lib/export";
import type { Stock } from "@/types/stock";

vi.mock("@/features/stocks/api/stocks-queries");
vi.mock("@/features/premium/hooks/use-subscription");
vi.mock("@/hooks/use-selected-stock");
vi.mock("@/features/watchlist/api/watchlist-queries");
vi.mock("@/lib/export", () => ({ exportToCsv: vi.fn() }));

const MOCK_STOCKS: Stock[] = [
  { ticker: "ADRS-P-A", name: "Adris grupa d.d.", sector: "Turizam", isin: "HRADRSPPA0", price: 44.80, changePct: 1.36, turnover: 125340, volume: 2800, dividendYield: 3.2 },
  { ticker: "ARNT-R-A", name: "Arena Hospitality Group d.d.", sector: "Turizam", isin: "HRARNTRAR7", price: 33.00, changePct: -0.60, turnover: 49500, volume: 1500, dividendYield: null },
  { ticker: "HT-R-A", name: "HT d.d.", sector: "Telekomunikacije", isin: "HRHTRARA00", price: 26.40, changePct: 0.76, turnover: 264000, volume: 10000, dividendYield: 5.8 },
  { ticker: "OPTE-R-A", name: "OT-Optima Telekom d.d.", sector: "Telekomunikacije", isin: "HROPTERA00", price: 0.42, changePct: -4.55, turnover: 2100, volume: 5000, dividendYield: null },
];

const mockUseStocksLive = vi.mocked(useStocksLive);
const mockUseSubscription = vi.mocked(useSubscription);
const mockUseSelectedStock = vi.mocked(useSelectedStock);
const mockUseWatchlistTickers = vi.mocked(useWatchlistTickers);
const mockUseAddToWatchlist = vi.mocked(useAddToWatchlist);
const mockUseRemoveFromWatchlist = vi.mocked(useRemoveFromWatchlist);

function setupMocks() {
  mockUseStocksLive.mockReturnValue({
    data: { stocks: MOCK_STOCKS, isMockData: false },
    isLoading: false,
  } as ReturnType<typeof useStocksLive>);

  mockUseSubscription.mockReturnValue({
    canAccess: vi.fn(() => true),
  } as unknown as ReturnType<typeof useSubscription>);

  mockUseSelectedStock.mockReturnValue({
    selectedTicker: null,
    select: vi.fn(),
    clear: vi.fn(),
  } as unknown as ReturnType<typeof useSelectedStock>);

  mockUseWatchlistTickers.mockReturnValue(new Set<string>());
  mockUseAddToWatchlist.mockReturnValue({ isPending: false, mutate: vi.fn() } as unknown as ReturnType<typeof useAddToWatchlist>);
  mockUseRemoveFromWatchlist.mockReturnValue({ isPending: false, mutate: vi.fn() } as unknown as ReturnType<typeof useRemoveFromWatchlist>);
}

// Helper to get the search input (there's only one textbox in StockTable)
function getSearchInput() {
  return screen.getByRole("textbox");
}

describe("StockTable", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    setupMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("rendering", () => {
    it("renders stock rows for each stock", () => {
      renderWithProviders(<StockTable />);

      expect(screen.getByText("ADRS-P-A")).toBeInTheDocument();
      expect(screen.getByText("ARNT-R-A")).toBeInTheDocument();
      expect(screen.getByText("HT-R-A")).toBeInTheDocument();
      expect(screen.getByText("OPTE-R-A")).toBeInTheDocument();
    });

    it("renders company names", () => {
      renderWithProviders(<StockTable />);

      expect(screen.getByText("Adris grupa d.d.")).toBeInTheDocument();
      expect(screen.getByText("Arena Hospitality Group d.d.")).toBeInTheDocument();
      expect(screen.getByText("HT d.d.")).toBeInTheDocument();
    });

    it("shows count footer", () => {
      renderWithProviders(<StockTable />);

      expect(screen.getByText(/4 \/ 4 stocks/i)).toBeInTheDocument();
    });

    it("shows empty state when no stocks match filter", () => {
      renderWithProviders(<StockTable />);

      const searchInput = getSearchInput();
      fireEvent.change(searchInput, { target: { value: "NONEXISTENT" } });

      // Flush React effects (schedules the debounce setTimeout), then advance timers
      act(() => { vi.runAllTimers(); });

      expect(screen.getByText(/Nijedna dionica ne odgovara trenutnim filterima/i)).toBeInTheDocument();
    });

    it("renders skeleton while loading", () => {
      mockUseStocksLive.mockReturnValue({
        data: undefined,
        isLoading: true,
      } as ReturnType<typeof useStocksLive>);

      const { container } = renderWithProviders(<StockTable />);

      expect(container.querySelector("[class*='animate']")).toBeInTheDocument();
    });
  });

  describe("search filtering", () => {
    it("filters stocks by ticker", async () => {
      renderWithProviders(<StockTable />);

      const searchInput = getSearchInput();
      fireEvent.change(searchInput, { target: { value: "ADRS" } });
      act(() => { vi.runAllTimers(); });

      expect(screen.getByText("ADRS-P-A")).toBeInTheDocument();
      expect(screen.queryByText("ARNT-R-A")).not.toBeInTheDocument();
    });

    it("filters stocks by company name", async () => {
      renderWithProviders(<StockTable />);

      const searchInput = getSearchInput();
      fireEvent.change(searchInput, { target: { value: "Arena" } });
      act(() => { vi.runAllTimers(); });

      expect(screen.getByText("ARNT-R-A")).toBeInTheDocument();
      expect(screen.queryByText("ADRS-P-A")).not.toBeInTheDocument();
    });

    it("filters stocks by ISIN", async () => {
      renderWithProviders(<StockTable />);

      const searchInput = getSearchInput();
      fireEvent.change(searchInput, { target: { value: "HRADRSPPA0" } });
      act(() => { vi.runAllTimers(); });

      expect(screen.getByText("ADRS-P-A")).toBeInTheDocument();
      expect(screen.queryByText("HT-R-A")).not.toBeInTheDocument();
    });
  });

  describe("sorting", () => {
    it("sorts by change percentage descending by default", () => {
      renderWithProviders(<StockTable />);
      act(() => { vi.runAllTimers(); });

      // tr elements are role=button; each stock row has 4 children (watchlist btn, name td, price td, change td)
      // Stock rows are at indices 0, 4, 8, 12 (every 4th row starting at 0)
      const table = screen.getByRole("table");
      const rowgroups = within(table).getAllByRole("rowgroup");
      const tbodyRows = within(rowgroups[1]).getAllByRole("button");

      // Extract ticker from every 4th row (stock rows only)
      const stockRows = [0, 1, 2, 3].map((i) => tbodyRows[i * 4]);
      const tickers = stockRows.map((row) => {
        return row.querySelector("td")?.textContent ?? "";
      });

      // Default: changePct desc → most positive first (ADRS +1.36% → OPTE -4.55%)
      const changeOrder = ["ADRS-P-A", "HT-R-A", "ARNT-R-A", "OPTE-R-A"];
      expect(tickers.map((t) => t.trim())).toEqual(changeOrder);
    });

    it("toggles sort direction when clicking the same column", () => {
      renderWithProviders(<StockTable />);
      act(() => { vi.runAllTimers(); });

      const columnheaders = screen.getAllByRole("columnheader");
      // Promjena is at index 6 based on test data
      const promjenaBtn = columnheaders[6];
      expect(promjenaBtn).toBeTruthy();

      act(() => {
        fireEvent.click(promjenaBtn);
        vi.runAllTimers();
      });

      const table = screen.getByRole("table");
      const rowgroups = within(table).getAllByRole("rowgroup");
      const tbodyRows = within(rowgroups[1]).getAllByRole("button");
      const stockRows = [0, 1, 2, 3].map((i) => tbodyRows[i * 4]);
      const tickers = stockRows.map((row) => row.querySelector("td")?.textContent ?? "");
      const ascOrder = ["OPTE-R-A", "ARNT-R-A", "HT-R-A", "ADRS-P-A"];
      expect(tickers.map((t) => t.trim())).toEqual(ascOrder);
    });

    it("sorts ascending by ticker when switching to ticker column", () => {
      renderWithProviders(<StockTable />);
      act(() => { vi.runAllTimers(); });

      const columnheaders = screen.getAllByRole("columnheader");
      // Oznaka is at index 1 based on test data
      const oznakaBtn = columnheaders[1];
      expect(oznakaBtn).toBeTruthy();

      act(() => {
        fireEvent.click(oznakaBtn);
        vi.runAllTimers();
      });

      const table = screen.getByRole("table");
      const rowgroups = within(table).getAllByRole("rowgroup");
      const tbodyRows = within(rowgroups[1]).getAllByRole("button");
      const firstRow = tbodyRows[0];
      expect(firstRow?.querySelector("td")?.textContent?.trim()).toBe("ADRS-P-A");
    });
  });

  describe("stock row selection", () => {
    it("calls select when clicking a row", () => {
      const selectMock = vi.fn();
      mockUseSelectedStock.mockReturnValue({
        selectedTicker: null,
        select: selectMock,
        clear: vi.fn(),
      } as unknown as ReturnType<typeof useSelectedStock>);

      renderWithProviders(<StockTable />);

      const row = screen.getByRole("button", { name: /adris grupa d\.d\./i });
      fireEvent.click(row);

      expect(selectMock).toHaveBeenCalledWith("ADRS-P-A");
    });

    it("applies border-l-primary class to selected row", () => {
      mockUseSelectedStock.mockReturnValue({
        selectedTicker: "HT-R-A",
        select: vi.fn(),
        clear: vi.fn(),
      } as unknown as ReturnType<typeof useSelectedStock>);

      renderWithProviders(<StockTable />);

      const selectedRow = screen.getByRole("button", { name: /ht d\.d\./i });
      expect(selectedRow).toHaveClass("border-l-primary");
    });
  });

  describe("export", () => {
    it("does not show export button when user lacks dataExport permission", () => {
      mockUseSubscription.mockReturnValue({
        canAccess: vi.fn(() => false),
      } as unknown as ReturnType<typeof useSubscription>);

      renderWithProviders(<StockTable />);

      expect(screen.queryByRole("button", { name: /export/i })).not.toBeInTheDocument();
    });

    it("shows export button when user has dataExport permission", () => {
      mockUseSubscription.mockReturnValue({
        canAccess: vi.fn(() => true),
      } as unknown as ReturnType<typeof useSubscription>);

      renderWithProviders(<StockTable />);

      expect(screen.getByRole("button", { name: /export/i })).toBeInTheDocument();
    });

    it("calls exportToCsv with all stocks", () => {
      renderWithProviders(<StockTable />);

      const exportBtn = screen.getByRole("button", { name: /export/i });
      fireEvent.click(exportBtn);

      // exportToCsv(filename, headers, rows) — verify filename is date-stamped and rows contain all 4 tickers
      expect(exportToCsv).toHaveBeenCalledWith(
        expect.stringMatching(/^zse-stocks-\d{4}-\d{2}-\d{2}$/),
        ["Ticker", "Name", "Sector", "Price", "Change %", "Volume", "Turnover"],
        expect.arrayContaining([
          expect.arrayContaining(["ADRS-P-A"]),
          expect.arrayContaining(["HT-R-A"]),
          expect.arrayContaining(["ARNT-R-A"]),
          expect.arrayContaining(["OPTE-R-A"]),
        ]),
      );
    });
  });
});
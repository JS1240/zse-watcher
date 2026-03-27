import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { screen, within, fireEvent, act } from "@testing-library/react";
import { renderWithProviders } from "@/test-utils";
import { StockTable } from "@/features/stocks/components/stock-table";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { useSubscription } from "@/features/premium/hooks/use-subscription";
import { useSelectedStock } from "@/hooks/use-selected-stock";
import { useWatchlistTickers } from "@/features/watchlist/api/watchlist-queries";
import { exportToCsv } from "@/lib/export";
import type { Stock } from "@/types/stock";

vi.mock("@/features/stocks/api/stocks-queries");
vi.mock("@/features/premium/hooks/use-subscription");
vi.mock("@/hooks/use-selected-stock");
vi.mock("@/features/watchlist/api/watchlist-queries");
vi.mock("@/lib/export", () => ({ exportToCsv: vi.fn() }));

const MOCK_STOCKS: Stock[] = [
  { ticker: "ADRS-P-A", name: "Adris grupa d.d.", sector: "Turizam", isin: "HRADRSPPA0", price: 44.80, changePct: 1.36, turnover: 125340, volume: 2800 },
  { ticker: "ARNT-R-A", name: "Arena Hospitality Group d.d.", sector: "Turizam", isin: "HRARNTRAR7", price: 33.00, changePct: -0.60, turnover: 49500, volume: 1500 },
  { ticker: "HT-R-A", name: "HT d.d.", sector: "Telekomunikacije", isin: "HRHTRARA00", price: 26.40, changePct: 0.76, turnover: 264000, volume: 10000 },
  { ticker: "OPTE-R-A", name: "OT-Optima Telekom d.d.", sector: "Telekomunikacije", isin: "HROPTERA00", price: 0.42, changePct: -4.55, turnover: 2100, volume: 5000 },
];

const mockUseStocksLive = vi.mocked(useStocksLive);
const mockUseSubscription = vi.mocked(useSubscription);
const mockUseSelectedStock = vi.mocked(useSelectedStock);
const mockUseWatchlistTickers = vi.mocked(useWatchlistTickers);

function setupMocks() {
  mockUseStocksLive.mockReturnValue({
    data: MOCK_STOCKS,
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

      const searchInput = screen.getByPlaceholderText(/oznaka.*naziv/i);
      fireEvent.change(searchInput, { target: { value: "NONEXISTENT" } });

      // Flush React effects (schedules the debounce setTimeout), then advance timers
      act(() => { vi.runAllTimers(); });

      expect(screen.getByText(/no stocks found/i)).toBeInTheDocument();
    });

    it("renders skeleton while loading", () => {
      mockUseStocksLive.mockReturnValue({
        data: undefined,
        isLoading: true,
      } as unknown as ReturnType<typeof useStocksLive>);

      const { container } = renderWithProviders(<StockTable />);

      expect(container.querySelector("[class*='animate']")).toBeInTheDocument();
    });
  });

  describe("search filtering", () => {
    it("filters stocks by ticker", async () => {
      renderWithProviders(<StockTable />);

      const searchInput = screen.getByPlaceholderText(/oznaka.*naziv/i);
      fireEvent.change(searchInput, { target: { value: "ADRS" } });
      act(() => { vi.runAllTimers(); });

      expect(screen.getByText("ADRS-P-A")).toBeInTheDocument();
      expect(screen.queryByText("ARNT-R-A")).not.toBeInTheDocument();
    });

    it("filters stocks by company name", async () => {
      renderWithProviders(<StockTable />);

      const searchInput = screen.getByPlaceholderText(/oznaka.*naziv/i);
      fireEvent.change(searchInput, { target: { value: "Arena" } });
      act(() => { vi.runAllTimers(); });

      expect(screen.getByText("ARNT-R-A")).toBeInTheDocument();
      expect(screen.queryByText("ADRS-P-A")).not.toBeInTheDocument();
    });

    it("filters stocks by ISIN", async () => {
      renderWithProviders(<StockTable />);

      const searchInput = screen.getByPlaceholderText(/oznaka.*naziv/i);
      fireEvent.change(searchInput, { target: { value: "HRADRSPPA0" } });
      act(() => { vi.runAllTimers(); });

      expect(screen.getByText("ADRS-P-A")).toBeInTheDocument();
      expect(screen.queryByText("HT-R-A")).not.toBeInTheDocument();
    });
  });

  describe("sorting", () => {
    it("sorts by change percentage descending by default", () => {
      renderWithProviders(<StockTable />);

      const rows = screen.getAllByRole("row").filter(
        (r) => r.querySelector("[class*='font-data']"),
      );

      const tickers = rows.map((r) => {
        const cells = within(r).getAllByRole("cell");
        return cells[0]?.textContent ?? "";
      });

      // Default: changePct desc → most positive first (ADRS +1.36% → OPTE -4.55%)
      const changeOrder = ["ADRS-P-A", "HT-R-A", "ARNT-R-A", "OPTE-R-A"];
      expect(tickers.slice(0, 4).map((t) => t.trim())).toEqual(changeOrder);
    });

    it("toggles sort direction when clicking the same column", () => {
      renderWithProviders(<StockTable />);

      const changeButton = screen.getByRole("button", { name: /promjena/i });
      fireEvent.click(changeButton);
      act(() => { vi.runAllTimers(); });

      const rows = screen.getAllByRole("row").filter(
        (r) => r.querySelector("[class*='font-data']"),
      );

      const tickers = rows.map((r) => {
        const cells = within(r).getAllByRole("cell");
        return cells[0]?.textContent ?? "";
      });

      // Toggle to changePct asc → most negative first (OPTE -4.55% → ADRS +1.36%)
      const ascOrder = ["OPTE-R-A", "ARNT-R-A", "HT-R-A", "ADRS-P-A"];
      expect(tickers.slice(0, 4).map((t) => t.trim())).toEqual(ascOrder);
    });

    it("sorts ascending by ticker when switching to ticker column", () => {
      renderWithProviders(<StockTable />);

      const tickerButton = screen.getByRole("button", { name: /oznaka/i });
      fireEvent.click(tickerButton);
      vi.advanceTimersByTime(10);

      const rows = screen.getAllByRole("row").filter(
        (r) => r.querySelector("[class*='font-data']"),
      );

      const firstTicker = rows[0]?.querySelector("[class*='font-data']")?.textContent ?? "";
      expect(firstTicker.trim()).toBe("ADRS-P-A");
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

      const row = screen.getByRole("row", { name: /adris grupa/i });
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

      const selectedRow = screen.getByRole("row", { name: /ht d\.d\./i });
      expect(selectedRow).toHaveClass("border-l-primary");
    });
  });

  describe("export", () => {
    it("does not show export button when user lacks dataExport permission", () => {
      mockUseSubscription.mockReturnValue({
        canAccess: vi.fn(() => false),
      } as unknown as ReturnType<typeof useSubscription>);

      renderWithProviders(<StockTable />);

      expect(screen.queryByTitle("Export CSV")).not.toBeInTheDocument();
    });

    it("shows export button when user has dataExport permission", () => {
      renderWithProviders(<StockTable />);

      expect(screen.getByTitle("Export CSV")).toBeInTheDocument();
    });

    it("calls exportToCsv with all stocks", () => {
      renderWithProviders(<StockTable />);

      const exportBtn = screen.getByTitle("Export CSV");
      fireEvent.click(exportBtn);

      expect(exportToCsv).toHaveBeenCalledOnce();
      const [filename, headers, rows] = (exportToCsv as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(filename).toMatch(/^zse-stocks-\d{4}-\d{2}-\d{2}$/);
      expect(headers).toEqual(["Ticker", "Name", "Sector", "Price", "Change %", "Volume", "Turnover"]);
      expect(rows.length).toBe(4);
    });
  });
});

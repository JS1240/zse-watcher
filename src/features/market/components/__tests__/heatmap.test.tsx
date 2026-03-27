import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Heatmap } from "@/features/market/components/heatmap";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import i18n from "@/config/i18n";
import type { Stock } from "@/types/stock";

const mockStocks: Stock[] = [
  { ticker: "RIVP-ZAG", name: "Rijeka", price: 4.2, changePct: 1.5, volume: 12000, turnover: 50000, sector: "Finance", changeAbs: 0.06, lastUpdated: "", isin: "HRRIVP0001", dividendYield: 4.2 },
  { ticker: "ARNT-ZAG", name: "Arnt", price: 3.1, changePct: -0.8, volume: 8000, turnover: 24000, sector: "Finance", changeAbs: -0.025, lastUpdated: "", isin: "HRARNT0001", dividendYield: 3.1 },
  { ticker: "HPB-ZAG", name: "HPB", price: 80.0, changePct: 0.2, volume: 500, turnover: 40000, sector: "Banking", changeAbs: 0.16, lastUpdated: "", isin: "HRHPB00001", dividendYield: null },
];

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>{ui}</I18nextProvider>
    </QueryClientProvider>,
  );

describe("Heatmap", () => {
  it("renders sector cells", async () => {
    const useStocksLive = await import("@/features/stocks/api/stocks-queries");
    vi.spyOn(useStocksLive, "useStocksLive").mockReturnValue({
      data: { stocks: mockStocks, isMockData: false },
      isLoading: false,
    } as ReturnType<typeof useStocksLive.useStocksLive>);

    renderWithProviders(<Heatmap />);

    expect(await screen.findByText("Finance")).toBeInTheDocument();
    expect(await screen.findByText("Banking")).toBeInTheDocument();
  });

  it("calls select when clicking a ticker", async () => {
    const useStocksLive = await import("@/features/stocks/api/stocks-queries");
    vi.spyOn(useStocksLive, "useStocksLive").mockReturnValue({
      data: { stocks: mockStocks, isMockData: false },
      isLoading: false,
    } as ReturnType<typeof useStocksLive.useStocksLive>);

    const select = vi.fn();
    const useSelectedStock = await import("@/hooks/use-selected-stock");
    vi.spyOn(useSelectedStock, "useSelectedStock").mockReturnValue({
      selectedTicker: null,
      select,
      clear: vi.fn(),
    } as ReturnType<typeof useSelectedStock.useSelectedStock>);

    renderWithProviders(<Heatmap />);

    const tickerButton = await screen.findByRole("button", { name: /RIVP-ZAG/i });
    fireEvent.click(tickerButton);

    expect(select).toHaveBeenCalledWith("RIVP-ZAG");
  });
});

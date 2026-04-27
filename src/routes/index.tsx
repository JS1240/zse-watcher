import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useCallback } from "react";
import { Newspaper, Download } from "lucide-react";
import { MarketOverview } from "@/features/market/components/market-overview";
import { MarketStatus } from "@/features/market/components/market-status";
import { MarketMovers } from "@/features/market/components/market-movers";
import { StockTable } from "@/features/stocks/components/stock-table";
import { NewsFeed } from "@/features/news/components/news-feed";
import { LiveDataIndicator } from "@/components/shared/live-data-indicator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportToCsv } from "@/lib/export";

export const Route = createFileRoute("/")({
  component: StocksPage,
});

function StocksPage() {
  const { t } = useTranslation("common");
  const { data: stocksResult, dataUpdatedAt, isFetching } = useStocksLive();

  // CSV export handler - exports all stocks with fundamentals for Croatian retail investors
  const handleExportCsv = useCallback(() => {
    const stocks = stocksResult?.stocks;
    if (!stocks || stocks.length === 0) return;

    const headers = ["Ticker", "Name", "Sector", "Price (EUR)", "Change (%)", "Volume", "Turnover (EUR)", "Dividend Yield (%)", "P/E Ratio", "Market Cap (MEUR)"];
    const rows = stocks.map((s) => [
      s.ticker,
      s.name,
      s.sector,
      s.price.toFixed(2),
      s.changePct.toFixed(2),
      s.volume.toString(),
      s.turnover.toFixed(2),
      s.dividendYield ? s.dividendYield.toFixed(2) : "",
      s.peRatio ? s.peRatio.toFixed(2) : "",
      s.marketCapM ? s.marketCapM.toFixed(1) : "",
    ]);
    exportToCsv(`zse-stocks-${new Date().toISOString().split("T")[0]}`, headers, rows);
    toast.success(t("toast.exported") || "Exported to CSV", { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
  }, [stocksResult, t]);

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex flex-1 flex-col gap-3 overflow-auto p-4">
        {/* Market status + overview */}
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-data text-lg font-bold">{t("nav.stocks")}</h1>
          <div className="flex items-center gap-2">
            {stocksResult?.stocks && stocksResult.stocks.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportCsv}
                title={t("exportCsv") || "Export to CSV"}
              >
                <Download className="h-3.5 w-3.5" />
                CSV
              </Button>
            )}
            <MarketStatus />
          </div>
        </div>
        <MarketOverview />

        {/* Always-visible keyboard shortcuts hint — consistent with watchlist/screener/alerts pattern */}
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-sm border border-border/50 bg-muted/30 px-3 py-1.5 text-[9px] text-muted-foreground">
          <LiveDataIndicator updatedAt={dataUpdatedAt ?? 0} isFetching={isFetching} />
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Enter</kbd>
              <span>{t("shortcut.details") || "detalji"}</span>
            </span>
            <span className="hidden items-center gap-1 xs:flex">
              <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">S</kbd>
              <span>{t("shortcut.watch") || "praćenje"}</span>
            </span>
            <span className="hidden items-center gap-1 sm:flex">
              <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">A</kbd>
              <span>{t("shortcut.alert") || "alarm"}</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">/</kbd>
              <span>{t("shortcut.search") || "traži"}</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">?</kbd>
              <span>{t("shortcut.shortcuts") || "prečaci"}</span>
            </span>
          </div>
        </div>

        {/* Stock table */}
        <StockTable />
      </div>

      {/* Right sidebar: Movers + News */}
      <aside className="hidden w-72 shrink-0 flex-col border-l border-border xl:flex">
        <ScrollArea className="flex-1">
          <div className="space-y-4 p-3">
            <MarketMovers />
            <div className="h-px bg-border" />
            <div>
              <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
                <Newspaper className="h-3.5 w-3.5 text-muted-foreground" />
                News
              </h3>
              <NewsFeed />
            </div>
          </div>
        </ScrollArea>
      </aside>
    </div>
  );
}

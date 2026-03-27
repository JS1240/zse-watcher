import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Newspaper } from "lucide-react";
import { MarketOverview } from "@/features/market/components/market-overview";
import { MarketStatus } from "@/features/market/components/market-status";
import { MarketMovers } from "@/features/market/components/market-movers";
import { StockTable } from "@/features/stocks/components/stock-table";
import { StockDetailDrawer } from "@/features/stocks/components/stock-detail-drawer";
import { NewsFeed } from "@/features/news/components/news-feed";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSelectedStock } from "@/hooks/use-selected-stock";

export const Route = createFileRoute("/")({
  component: StocksPage,
});

function StocksPage() {
  const { t } = useTranslation("common");
  const { selectedTicker, clear } = useSelectedStock();

  return (
    <div className="flex h-full">
      {/* Main content */}
      <div className="flex flex-1 flex-col gap-3 overflow-auto p-4">
        {/* Market status + overview */}
        <div className="flex items-center justify-between">
          <h1 className="font-data text-lg font-bold">{t("nav.stocks")}</h1>
          <MarketStatus />
        </div>
        <MarketOverview />

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

      {/* Stock detail drawer */}
      <StockDetailDrawer ticker={selectedTicker} onClose={clear} />
    </div>
  );
}

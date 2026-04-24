import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Newspaper } from "lucide-react";
import { MarketOverview } from "@/features/market/components/market-overview";
import { MarketStatus } from "@/features/market/components/market-status";
import { MarketMovers } from "@/features/market/components/market-movers";
import { StockTable } from "@/features/stocks/components/stock-table";
import { NewsFeed } from "@/features/news/components/news-feed";
import { LiveDataIndicator } from "@/components/shared/live-data-indicator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";

export const Route = createFileRoute("/")({
  component: StocksPage,
});

function StocksPage() {
  const { t } = useTranslation("common");
  const { dataUpdatedAt, isFetching } = useStocksLive();

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

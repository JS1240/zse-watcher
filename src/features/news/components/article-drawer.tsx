
import { useState, useMemo } from "react";
import { X, ExternalLink, Keyboard, ArrowUp as ScrollTop, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { NewsArticle } from "@/types/news";
import { formatDate, formatTime, formatPrice } from "@/lib/formatters";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useSelectedStock } from "@/hooks/use-selected-stock";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";

interface ArticleDrawerProps {
  article: NewsArticle | null;
  onClose: () => void;
}

export function ArticleDrawer({ article, onClose }: ArticleDrawerProps) {
  const { t } = useTranslation("news");
  const { t: tc } = useTranslation("common");
  const { setContainerRef } = useFocusTrap({
    active: !!article,
    onEscape: onClose,
  });
  const { select } = useSelectedStock();
  const { data: stocksResult } = useStocksLive();
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Stock price map for clickable ticker price context
  const stockPriceMap = useMemo(() => {
    if (!stocksResult?.stocks) return new Map<string, number>();
    const map = new Map<string, number>();
    stocksResult.stocks.forEach((s) => map.set(s.ticker, s.price ?? 0));
    return map;
  }, [stocksResult]);

  const handleSelectTicker = (ticker: string) => {
    select(ticker);
  };

  const handleCopyTicker = async (e: React.MouseEvent, ticker: string) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(ticker);
    toast.success(`${ticker} ${tc("toast.copied") || "kopirano"}`);
  };

  const scrollToTop = () => {
    document.getElementById("article-drawer-body")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!article) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={setContainerRef}
        className="fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-card shadow-xl sm:max-w-xl animate-slide-in"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded-sm bg-muted px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
              {article.category}
            </span>
            {article.ticker && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectTicker(article.ticker!);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    handleCopyTicker(e, article.ticker!);
                  }}
                  className="flex items-center gap-1 rounded-sm bg-primary/10 px-1.5 py-0.5 font-data text-[10px] font-semibold text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  title={tc("toast.copiedTarget", { value: article.ticker }) || `${article.ticker} — click for stock details`}
                >
                  {article.ticker}
                  {stockPriceMap.get(article.ticker) != null && (
                    <span className="font-data text-[9px] font-medium text-muted-foreground">
                      {formatPrice(stockPriceMap.get(article.ticker)!)}
                    </span>
                  )}
                </button>
                {stockPriceMap.get(article.ticker) != null && (
                  <TrendingUp className="h-3 w-3 text-muted-foreground/50" />
                )}
              </>
            )}
            {/* Estimated read time badge — helps Croatian investors gauge article length at a glance */}
            {article.readTimeMinutes > 0 && (
              <span className="flex items-center gap-1 rounded-sm bg-accent/70 px-1.5 py-0.5 text-[10px] text-foreground">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {article.readTimeMinutes} min
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1 text-[10px] text-muted-foreground md:flex">
              <Keyboard className="h-3 w-3" />
              Esc
            </span>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-sm px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ExternalLink className="h-3 w-3" />
              ZSE.hr
            </a>
            <button
              onClick={onClose}
              className="rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close article"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          id="article-drawer-body"
          onScroll={(e) => setShowScrollTop((e.target as HTMLDivElement).scrollTop > 200)}
          className="flex-1 overflow-auto p-4 relative"
        >
          {/* Scroll-to-top floating button — appears after scrolling for Croatian investors reading long articles */}
          {showScrollTop && (
            <button
              onClick={scrollToTop}
              aria-label="Scroll to top"
              className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-all hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ScrollTop className="h-3.5 w-3.5" />
            </button>
          )}
          <h2 className="mb-3 font-data text-base font-bold leading-snug text-foreground">
            {article.title}
          </h2>

          <div className="mb-4 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="font-medium text-foreground/70">{article.source}</span>
            <span className="text-muted-foreground/40">·</span>
            <span>{formatDate(article.publishedAt)}</span>
            <span className="text-muted-foreground/40">·</span>
            <span>{formatTime(article.publishedAt)}</span>
          </div>

          {/* Lead paragraph — styled as article opening for Croatian retail investors */}
          {article.summary && (
            <p className="text-xs leading-relaxed text-foreground/80">
              {article.summary}
            </p>
          )}

          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 flex items-center justify-center gap-2 rounded-md border border-border bg-accent/50 px-4 py-2.5 text-xs font-medium text-foreground hover:bg-accent"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Read full article on ZSE.hr
          </a>
        </div>

        {/* Always-visible keyboard shortcuts hint — matching portfolio/stocks/alert drawer pattern */}
        <div className="flex items-center justify-between border-t border-border/50 bg-muted/30 px-4 py-1.5 text-[9px] text-muted-foreground">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Esc</kbd>
              <span>{t("shortcut.close") || "zatvori"}</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="flex items-center gap-1">
              <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Enter</kbd>
              <span>{t("shortcut.readFull") || "citaj cijeli"}</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

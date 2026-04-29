
import { useState } from "react";
import { X, ExternalLink, Keyboard, ArrowUp as ScrollTop } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { NewsArticle } from "@/types/news";
import { formatDate, formatTime } from "@/lib/formatters";
import { useFocusTrap } from "@/hooks/use-focus-trap";

interface ArticleDrawerProps {
  article: NewsArticle | null;
  onClose: () => void;
}

export function ArticleDrawer({ article, onClose }: ArticleDrawerProps) {
  const { t } = useTranslation("news");
  const { setContainerRef } = useFocusTrap({
    active: !!article,
    onEscape: onClose,
  });
  const [showScrollTop, setShowScrollTop] = useState(false);

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
              <span className="rounded-sm bg-primary/10 px-1.5 py-0.5 font-data text-[10px] font-semibold text-primary">
                {article.ticker}
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
          <h2 className="mb-2 font-data text-base font-bold leading-snug text-foreground">
            {article.title}
          </h2>

          <div className="mb-4 flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{article.source}</span>
            <span>·</span>
            <span>{formatDate(article.publishedAt)}</span>
            <span>·</span>
            <span>{formatTime(article.publishedAt)}</span>
          </div>

          {article.summary && (
            <p className="text-xs leading-relaxed text-foreground/90">
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

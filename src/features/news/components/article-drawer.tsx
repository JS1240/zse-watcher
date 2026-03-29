import { useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import type { NewsArticle } from "@/types/news";
import { formatDate, formatTime } from "@/lib/formatters";

interface ArticleDrawerProps {
  article: NewsArticle | null;
  onClose: () => void;
}

export function ArticleDrawer({ article, onClose }: ArticleDrawerProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  if (!article) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-card shadow-xl sm:max-w-xl">
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
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-sm px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
              ZSE.hr
            </a>
            <button
              onClick={onClose}
              className="rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4">
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
      </div>
    </>
  );
}

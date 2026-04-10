import { useState } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, Newspaper } from "lucide-react";
import { useNews } from "@/features/news/api/news-queries";
import { ArticleDrawer } from "@/features/news/components/article-drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatTime } from "@/lib/formatters";
import { EmptyState } from "@/components/shared/empty-state";
import type { NewsArticle } from "@/types/news";

interface NewsFeedProps {
  ticker?: string;
  category?: "general" | "trading";
  limit?: number;
}

export function NewsFeed({ ticker, category, limit }: NewsFeedProps) {
  const { data: articles, isLoading } = useNews();
  const { t } = useTranslation("common");
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  const filtered = useMemo(() => {
    if (!articles) return [];
    let result = articles;

    if (ticker) {
      result = result.filter((a) => a.ticker === ticker);
    }
    if (category) {
      result = result.filter((a) => a.category === category);
    }
    if (limit) {
      result = result.slice(0, limit);
    }

    return result;
  }, [articles, ticker, category, limit]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  if (!filtered.length) {
    return (
      <div className="py-4">
        <EmptyState
          icon={<Newspaper className="h-8 w-8" />}
          title={t("empty.noData")}
          description={t("empty.noDataDescription")}
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {filtered.map((article) => (
          <button
            key={article.id}
            onClick={() => setSelectedArticle(article)}
            className="group flex w-full items-start justify-between gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent/50"
          >
            <div className="min-w-0 flex-1">
              <h4 className="line-clamp-2 text-xs font-medium text-foreground group-hover:text-primary">
                {article.title}
              </h4>
              {article.summary && (
                <p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground">
                  {article.summary}
                </p>
              )}
              <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                {article.ticker && (
                  <span className="rounded-sm bg-accent px-1 py-0.5 font-data font-medium">
                    {article.ticker}
                  </span>
                )}
                <span>{formatDate(article.publishedAt)}</span>
                <span>{formatTime(article.publishedAt)}</span>
                <span className="rounded-sm bg-muted px-1 py-0.5 text-[9px] uppercase">
                  {article.category}
                </span>
              </div>
            </div>
            <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 flex-none text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>

      <ArticleDrawer
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </>
  );
}

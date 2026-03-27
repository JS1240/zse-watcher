import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";
import { useNews } from "@/features/news/api/news-queries";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatTime } from "@/lib/formatters";

interface NewsFeedProps {
  ticker?: string;
  category?: "general" | "trading";
  limit?: number;
}

export function NewsFeed({ ticker, category, limit }: NewsFeedProps) {
  const { data: articles, isLoading } = useNews();
  const { t } = useTranslation("common");

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
      <p className="py-4 text-center text-xs text-muted-foreground">
        {t("empty.noData")}
      </p>
    );
  }

  return (
    <div className="space-y-1">
      {filtered.map((article) => (
        <a
          key={article.id}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group block rounded-md px-2 py-2 transition-colors hover:bg-accent/50"
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="line-clamp-2 text-xs font-medium text-foreground group-hover:text-primary">
              {article.title}
            </h4>
            <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
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
        </a>
      ))}
    </div>
  );
}

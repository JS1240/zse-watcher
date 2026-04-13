import { useState } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, Newspaper, Search } from "lucide-react";
import { useNews } from "@/features/news/api/news-queries";
import { ArticleDrawer } from "@/features/news/components/article-drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { formatDate, formatTime } from "@/lib/formatters";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import type { NewsArticle } from "@/types/news";
import { useDebounce } from "@/hooks/use-debounce";

interface NewsFeedProps {
  ticker?: string;
  category?: "general" | "trading";
  limit?: number;
}

export function NewsFeed({ ticker, category, limit }: NewsFeedProps) {
  const { data: articles, isLoading, isError, refetch } = useNews();
  const { t } = useTranslation("common");
  const { t: tn } = useTranslation("news");
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 200);

  const filtered = useMemo(() => {
    if (!articles) return [];
    let result = articles;

    if (ticker) {
      result = result.filter((a) => a.ticker === ticker);
    }
    if (category) {
      result = result.filter((a) => a.category === category);
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.ticker && a.ticker.toLowerCase().includes(q)),
      );
    }
    if (limit && !debouncedSearch) {
      result = result.slice(0, limit);
    }

    return result;
  }, [articles, ticker, category, limit, debouncedSearch]);

  // Only show search when not limited (inline usage)
  const showSearch = !limit && articles && articles.length > 0;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    );
  }

  // Results count
  const totalCount = articles?.length ?? 0;
  const filteredCount = filtered.length;

  if (isError) {
    return (
      <ErrorState
        title={t("errors.generic")}
        description={t("errors.network")}
        retry={{ onRetry: refetch, label: t("errors.tryAgain") }}
      />
    );
  }

  if (!filtered.length) {
    return (
      <div className="space-y-3">
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={t("actions.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        )}
        {totalCount > 0 ? (
          <EmptyState
            icon={<Search className="h-8 w-8" />}
            title={t("empty.noResults")}
            description={t("empty.noResultsDescription")}
            action={{ label: t("empty.clearFilters"), onClick: () => setSearch("") }}
          />
        ) : (
          <EmptyState
            icon={<Newspaper className="h-8 w-8" />}
            title={tn("empty") || t("empty.noData")}
            description={tn("emptyDescription") || t("empty.noDataDescription")}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-1">
        {showSearch && (
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={t("actions.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        )}

        {/* Results count */}
        {totalCount > 0 && (
          <div className="text-[10px] text-muted-foreground">
            {filteredCount} {filteredCount === 1 ? " vijest" : " vijesti"}
            {debouncedSearch && totalCount !== filteredCount && ` / ${totalCount}`}
          </div>
        )}

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

import { useState } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, Newspaper, Search, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { useNews } from "@/features/news/api/news-queries";
import { ArticleDrawer } from "@/features/news/components/article-drawer";
import { NewsSkeleton } from "@/features/news/components/news-skeleton";
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
  const [sortField, setSortField] = useState<"date" | "ticker">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const debouncedSearch = useDebounce(search, 200);

  // Toggle sort handler
  const handleSort = (field: "date" | "ticker") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "ticker" ? "asc" : "desc");
    }
  };

  // Sort header component
  function SortHeader({ field, label }: { field: "date" | "ticker"; label: string }) {
    const isActive = sortField === field;
    const direction = isActive ? sortDir : null;
    return (
      <button
        onClick={() => handleSort(field)}
        className="flex items-center gap-1 text-[10px] font-medium transition-colors hover:text-foreground"
        aria-sort={isActive ? (direction === "asc" ? "ascending" : "descending") : "none"}
      >
        <span>{label}</span>
        {direction === "asc" ? (
          <ArrowUp className="h-3 w-3 shrink-0" />
        ) : direction === "desc" ? (
          <ArrowDown className="h-3 w-3 shrink-0" />
        ) : (
          <ArrowUpDown className="h-3 w-3 shrink-0 text-muted-foreground/40" />
        )}
      </button>
    );
  }

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

    // Apply sorting
    result = [...result].sort((a, b) => {
      if (sortField === "ticker") {
        const aTicker = a.ticker ?? "";
        const bTicker = b.ticker ?? "";
        return sortDir === "asc"
          ? aTicker.localeCompare(bTicker)
          : bTicker.localeCompare(aTicker);
      }
      // Date sorting (newest first by default)
      const aDate = new Date(a.publishedAt).getTime();
      const bDate = new Date(b.publishedAt).getTime();
      return sortDir === "asc" ? aDate - bDate : bDate - aDate;
    });

    return result;
  }, [articles, ticker, category, limit, debouncedSearch, sortField, sortDir]);

  // Only show search when not limited (inline usage)
  const showSearch = !limit && articles && articles.length > 0;

  if (isLoading) {
    return <NewsSkeleton />;
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
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={t("actions.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <SortHeader field="date" label={t("sort.date") || "Datum"} />
              <SortHeader field="ticker" label={t("sort.ticker") || "Dionica"} />
            </div>
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
        {/* Search + Sort controls */}
        {showSearch && (
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={t("actions.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex items-center gap-2">
              <SortHeader field="date" label={t("sort.date") || "Datum"} />
              <SortHeader field="ticker" label={t("sort.ticker") || "Dionica"} />
            </div>
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

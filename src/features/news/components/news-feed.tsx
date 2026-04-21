import { useState, useCallback, memo, useRef } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ExternalLink, Newspaper, Search, ArrowUp, ArrowDown, ArrowUpDown, Download, Keyboard, X, ArrowUp as ScrollTop, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useNews } from "@/features/news/api/news-queries";
import { ArticleDrawer } from "@/features/news/components/article-drawer";
import { NewsSkeleton } from "@/features/news/components/news-skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime } from "@/lib/formatters";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { exportToCsv } from "@/lib/export";
import { cn } from "@/lib/utils";
import type { NewsArticle } from "@/types/news";
import { useDebounce } from "@/hooks/use-debounce";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";

interface NewsFeedProps {
  ticker?: string;
  category?: "general" | "trading";
  limit?: number;
}

// Compact category filter chip component — similar to watchlist change filters
function CategoryChip({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-8 items-center gap-1 rounded-full px-2.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
      }`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </button>
  );
}

export function NewsFeed({ ticker, category, limit }: NewsFeedProps) {
  const { data: articles, isLoading, isError, refetch } = useNews();
  const { t } = useTranslation("common");
  const { t: tn } = useTranslation("news");
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [sortField, setSortField] = useState<"date" | "ticker">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  // Internal category filter state (when not set by prop)
  const [categoryFilter, setCategoryFilter] = useState<"all" | "general" | "trading">("all");
  const effectiveCategory = category ?? categoryFilter;
  const debouncedSearch = useDebounce(search, 200);

  // Keyboard shortcut to focus search
  const searchInputRef = useRef<HTMLInputElement>(null);
  const focusSearch = useCallback(() => searchInputRef.current?.focus(), []);
  useKeyboardShortcut({ key: "/", handler: focusSearch, enabled: !searchFocused });

  // Toggle sort handler - memoized to prevent re-renders
  const handleSort = useCallback((field: "date" | "ticker") => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir(field === "ticker" ? "asc" : "desc");
    }
  }, [sortField]);

  // Sort header component - memoized to prevent re-renders of sort controls
  const SortHeader = memo(function SortHeader({ field, label }: { field: "date" | "ticker"; label: string }) {
    const isActive = sortField === field;
    const direction = isActive ? sortDir : null;
    const sortDirection = isActive ? (direction === "asc" ? "ascending" : "descending") : "none";

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleSort(field);
      }
    };

    return (
      <button
        onClick={() => handleSort(field)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        className="flex items-center gap-1 text-[10px] font-medium transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-sort={sortDirection}
        aria-label={`${label}: ${sortDirection === "none" ? "unsorted" : sortDirection}, click to sort`}
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
  });

  const filtered = useMemo(() => {
    if (!articles) return [];
    let result = articles;

    if (ticker) {
      result = result.filter((a) => a.ticker === ticker);
    }
    if (effectiveCategory && effectiveCategory !== "all") {
      result = result.filter((a) => a.category === effectiveCategory);
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
  }, [articles, ticker, effectiveCategory, limit, debouncedSearch, sortField, sortDir]);

  // Only show search/export when not limited (inline usage)
  const showSearch = !limit && articles && articles.length > 0;

  // CSV export handler - memoized to prevent re-renders
  const handleExport = useCallback(() => {
    if (!filtered.length) return;
    const headers = ["Date", "Time", "Ticker", "Title", "Summary", "Source", "Category"];
    const rows = filtered.map((a) => [
      formatDate(a.publishedAt),
      formatTime(a.publishedAt),
      a.ticker || "",
      a.title,
      a.summary || "",
      a.source,
      a.category,
    ]);
    exportToCsv(`zse-news-${new Date().toISOString().split("T")[0]}`, headers, rows);
    toast.success(t("toast.exported"));
  }, [filtered, t]);

  // Article click handler - memoized
  const handleArticleClick = useCallback((article: NewsArticle) => {
    setSelectedArticle(article);
  }, []);

  // Clear search handler
  const handleClearSearch = useCallback(() => setSearch(""), []);

  // Scroll to top state
  const [scrollTop, setScrollTop] = useState(false);
  const newsFeedRef = useRef<HTMLDivElement>(null);

  // Memoized article item to prevent re-renders on sort/search state changes
  const ArticleItem = memo(function ArticleItem({
    article,
    onClick,
  }: {
    article: NewsArticle;
    onClick: (article: NewsArticle) => void;
  }) {
    return (
      <button
        onClick={() => onClick(article)}
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
          <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
            {article.ticker && (
              <span className="rounded-sm bg-accent px-1 py-0.5 font-data font-medium text-foreground">
                {article.ticker}
              </span>
            )}
            <span>{formatDate(article.publishedAt)}</span>
            <span>{formatTime(article.publishedAt)}</span>
            <span
              className={cn(
                "rounded-sm px-1.5 py-0.5 text-[9px] uppercase font-semibold tracking-wide",
                article.category === "trading"
                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                  : "bg-slate-500/20 text-slate-600 dark:text-slate-400"
              )}
            >
              {article.category === "trading" ? "TRGOVANJE" : "VIJESTI"}
            </span>
          </div>
        </div>
        <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 flex-none text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    );
  });

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
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[160px]">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder={t("actions.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="pl-8 pr-14"
              />
              {!search && (
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                  <Keyboard className="h-2.5 w-2.5" />
                  /
                </span>
              )}
              {search && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  title={t("actions.clear")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {!limit && (
              <div className="flex items-center gap-1">
                <CategoryChip
                  active={categoryFilter === "all"}
                  onClick={() => setCategoryFilter("all")}
                  label={tn("filter.all") || "Sve"}
                  icon={Newspaper}
                />
                <CategoryChip
                  active={categoryFilter === "general"}
                  onClick={() => setCategoryFilter("general")}
                  label={tn("filter.general") || "Generalne"}
                  icon={Newspaper}
                />
                <CategoryChip
                  active={categoryFilter === "trading"}
                  onClick={() => setCategoryFilter("trading")}
                  label={tn("filter.trading") || "Trgovanje"}
                  icon={TrendingUp}
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <SortHeader field="date" label={t("sort.date") || "Datum"} />
              <SortHeader field="ticker" label={t("sort.ticker") || "Dionica"} />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                disabled={!filtered.length}
                title={t("exportCsv") || "Export CSV"}
              >
                <Download className="h-3.5 w-3.5" />
                CSV
              </Button>
            </div>
          </div>
        )}
        {totalCount > 0 ? (
          <EmptyState
            icon={<Search className="h-8 w-8" />}
            title={t("empty.noResults")}
            description={t("empty.noResultsDescription")}
            action={{ label: t("empty.clearFilters"), onClick: handleClearSearch }}
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
                ref={searchInputRef}
                placeholder={t("actions.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="pl-8 pr-14"
              />
              {!search && (
                <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                  <Keyboard className="h-2.5 w-2.5" />
                  /
                </span>
              )}
              {search && (
                <button
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  title={t("actions.clear")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <SortHeader field="date" label={t("sort.date") || "Datum"} />
              <SortHeader field="ticker" label={t("sort.ticker") || "Dionica"} />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExport}
                disabled={!filtered.length}
                title={t("exportCsv") || "Export CSV"}
              >
                <Download className="h-3.5 w-3.5" />
                CSV
              </Button>
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

        <div
          ref={newsFeedRef}
          onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop > 200)}
          className="space-y-1 max-h-[calc(100vh-280px)] overflow-y-auto pr-1"
        >
          {filtered.map((article) => (
            <ArticleItem
              key={article.id}
              article={article}
              onClick={handleArticleClick}
            />
          ))}
        </div>

        {/* Scroll to top button */}
        <button
          onClick={() => newsFeedRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
          className={cn(
            "fixed bottom-6 right-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-200 hover:bg-primary/90",
            scrollTop ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2"
          )}
          aria-label="Povratak na vrh"
          title="Povratak na vrh"
        >
          <ScrollTop className="h-4 w-4" />
        </button>
      </div>

      <ArticleDrawer
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </>
  );
}

import { useTranslation } from "react-i18next";
import { Filter, Keyboard, Search, Bookmark } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ScreenerSkeletonProps {
  className?: string;
}

export function ScreenerSkeleton({ className }: ScreenerSkeletonProps) {
  const { t } = useTranslation("stocks");
  const ROW_COUNT = 8;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search bar skeleton — mirrors StockScreener search bar when stockCount > 0 */}
      <div className="mb-2 flex items-center justify-between">
        <div className="relative flex-1 max-w-xs">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
            <Search className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <Skeleton className="animate-shimmer h-9 w-full rounded-md pl-8" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="animate-shimmer h-6 w-16 rounded-md" />
          <Skeleton className="animate-shimmer h-6 w-20 rounded-md" />
        </div>
      </div>

      {/* Filter bar skeleton — mirrors StockScreener filter bar with presets + collapse toggle */}
      <div className="rounded-md border border-border bg-card p-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <Skeleton className="animate-shimmer h-3 w-16" />
          </div>
          {/* Preset chips skeleton + collapse toggle */}
          <div className="flex items-center gap-2">
            <Skeleton className="animate-shimmer h-3 w-12 rounded-full" />
            <Skeleton className="animate-shimmer h-3 w-16 rounded-full" />
            <Skeleton className="animate-shimmer h-3 w-14 rounded-full" />
            <Bookmark className="h-3 w-3 text-muted-foreground" />
            <Skeleton className="animate-shimmer h-3 w-12 rounded-sm bg-accent/70" />
            <div className="ml-2 flex items-center gap-1">
              <Skeleton className="animate-shimmer h-3 w-3 rounded" />
              <Skeleton className="animate-shimmer h-3 w-8" />
            </div>
          </div>
        </div>

        {/* Active filter chips skeleton row — mirrors ScreenerFilterChips */}
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <Skeleton className="animate-shimmer h-5 w-24 rounded-full" />
          <Skeleton className="animate-shimmer h-5 w-32 rounded-full" />
          <Skeleton className="animate-shimmer h-5 w-28 rounded-full" />
        </div>

        {/* Filter inputs grid skeleton */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="animate-shimmer h-2.5 w-12" />
              <Skeleton className="animate-shimmer h-7 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Results bar skeleton — mirrors StockScreener results bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="animate-shimmer h-3 w-32" />
          <Skeleton className="animate-shimmer h-4 w-12 rounded-full" />
        </div>
        {/* Sort controls skeleton */}
        <div className="flex items-center gap-1">
          <Skeleton className="animate-shimmer h-6 w-14 rounded-md" />
          <Skeleton className="animate-shimmer h-6 w-14 rounded-md" />
          <Skeleton className="animate-shimmer h-6 w-16 rounded-md" />
          <Skeleton className="animate-shimmer h-6 w-12 rounded-md" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="py-2 pl-3 pr-1 text-left font-medium">{t("table.ticker")}</th>
              <th className="px-1 py-2 text-left font-medium">
                <div className="flex items-center gap-1">
                  <Skeleton className="animate-shimmer h-2.5 w-10" />
                  <Skeleton className="animate-shimmer h-3 w-3 rounded" />
                </div>
              </th>
              <th className="px-1 py-2 text-left font-medium">
                <Skeleton className="animate-shimmer h-2.5 w-10" />
              </th>
              <th className="px-1 py-2 text-right font-medium">
                <div className="flex items-center justify-end gap-1">
                  <Skeleton className="animate-shimmer h-2.5 w-10" />
                  <Skeleton className="animate-shimmer h-3 w-3 rounded" />
                </div>
              </th>
              <th className="px-1 py-2 text-right font-medium">
                <div className="flex items-center justify-end gap-1">
                  <Skeleton className="animate-shimmer h-2.5 w-10" />
                  <Skeleton className="animate-shimmer h-3 w-3 rounded" />
                </div>
              </th>
              <th className="hidden px-1 py-2 text-right font-medium lg:table-cell">
                <div className="flex items-center justify-end gap-1">
                  <Skeleton className="animate-shimmer h-2.5 w-12" />
                  <Skeleton className="animate-shimmer h-3 w-3 rounded" />
                </div>
              </th>
              <th className="hidden px-1 py-2 text-right font-medium lg:table-cell">
                <Skeleton className="animate-shimmer ml-auto h-2.5 w-12" />
              </th>
              <th className="hidden px-1 py-2 text-right font-medium lg:table-cell">
                <div className="flex items-center justify-end gap-1">
                  <Skeleton className="animate-shimmer h-2.5 w-10" />
                  <Skeleton className="animate-shimmer h-3 w-3 rounded" />
                </div>
              </th>
              <th className="hidden px-3 py-2 text-center font-medium xl:table-cell">
                <Skeleton className="animate-shimmer mx-auto h-2.5 w-8" />
              </th>
              <th className="hidden px-3 py-2 text-center font-medium 2xl:table-cell">
                <Skeleton className="animate-shimmer mx-auto h-2.5 w-8" />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROW_COUNT }).map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-border/50 last:border-b-0"
              >
                {/* Ticker */}
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1">
                    <Skeleton className="animate-shimmer h-3.5 w-10" />
                    <Skeleton className="animate-shimmer h-3.5 w-8 rounded" />
                  </div>
                </td>
                {/* Name */}
                <td className="px-1 py-2">
                  <Skeleton className="animate-shimmer h-3 w-28" />
                </td>
                {/* Sector */}
                <td className="px-1 py-2">
                  <Skeleton className="animate-shimmer h-4 w-16 rounded-sm" />
                </td>
                {/* Price */}
                <td className="px-1 py-2 text-right">
                  <div className="flex justify-end">
                    <Skeleton className="animate-shimmer h-3 w-14" />
                  </div>
                </td>
                {/* Change */}
                <td className="px-1 py-2 text-right">
                  <div className="flex justify-end">
                    <Skeleton className="animate-shimmer h-4 w-12 rounded-sm" />
                  </div>
                </td>
                {/* Turnover (lg) */}
                <td className="hidden px-1 py-2 text-right lg:table-cell">
                  <Skeleton className="animate-shimmer ml-auto h-3 w-20" />
                </td>
                {/* Dividend Yield (lg) */}
                <td className="hidden px-1 py-2 text-right lg:table-cell">
                  <Skeleton className="animate-shimmer ml-auto h-3 w-10" />
                </td>
                {/* Volume (lg) */}
                <td className="hidden px-1 py-2 text-right lg:table-cell">
                  <Skeleton className="animate-shimmer ml-auto h-3 w-14" />
                </td>
                {/* Trend sparkline (xl) */}
                <td className="hidden px-3 py-2 text-center xl:table-cell">
                  <Skeleton className="animate-shimmer mx-auto h-[18px] w-[50px]" />
                </td>
                {/* P/E (2xl) */}
                <td className="hidden px-3 py-2 text-right 2xl:table-cell">
                  <Skeleton className="animate-shimmer mx-auto h-3 w-10" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Scroll-to-top button skeleton — mirrors actual scroll-to-top button position */}
        <div className="absolute bottom-4 right-4 flex h-8 w-8 items-center justify-center rounded-full">
          <Skeleton className="animate-shimmer h-8 w-8 rounded-full opacity-50" />
        </div>
      </div>

      {/* Always-visible keyboard shortcuts hint for discoverability — mirrors actual component */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm border border-border/50 bg-muted/30 px-3 py-1.5 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <Keyboard className="h-2.5 w-2.5" />
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">/</kbd>
          <span>traži</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Enter</kbd>
          <span>detalji</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Esc</kbd>
          <span>poništi</span>
        </span>
      </div>
    </div>
  );
}

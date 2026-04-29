import { useTranslation } from "react-i18next";
import { Filter, Keyboard } from "lucide-react";
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
      {/* Filter bar skeleton */}
      <div className="rounded-md border border-border bg-card p-3">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <Skeleton className="animate-shimmer h-3 w-16" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="animate-shimmer h-6 w-20 rounded-md" />
            <Skeleton className="animate-shimmer h-6 w-16 rounded-md" />
          </div>
        </div>
        {/* Filter inputs skeleton */}
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="animate-shimmer h-2.5 w-12" />
              <Skeleton className="animate-shimmer h-7 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Results bar skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="animate-shimmer h-3 w-32" />
        <Skeleton className="animate-shimmer h-6 w-16 rounded-md" />
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
                  <Skeleton className="animate-shimmer h-3.5 w-10" />
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Always-visible keyboard shortcuts hint for discoverability */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm border border-border/50 bg-muted/30 px-3 py-1.5 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <Keyboard className="h-2.5 w-2.5" />
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">\u2318K</kbd>
          <span>izbornik</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">?</kbd>
          <span>pre\u010daci</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Esc</kbd>
          <span>natrag</span>
        </span>
      </div>
    </div>
  );
}

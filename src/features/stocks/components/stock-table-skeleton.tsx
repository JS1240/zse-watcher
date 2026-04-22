import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StockTableSkeletonProps {
  className?: string;
}

/**
 * Polished loading skeleton for StockTable
 * Shows full layout matching live component:
 * - Search bar + LiveDataIndicator + CSV button
 * - Filter chips row (gainers/losers/unchanged + sector dropdown)
 * - Table with all headers + skeleton rows
 * - Results count + keyboard shortcuts hint
 */
export function StockTableSkeleton({ className }: StockTableSkeletonProps) {
  const { t } = useTranslation("stocks");

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search bar row */}
      <div className="flex items-center gap-2">
        {/* Search input skeleton */}
        <div className="relative flex-1">
          <Skeleton className="h-9 w-full rounded-md animate-shimmer" />
        </div>
        {/* LiveDataIndicator skeleton */}
        <Skeleton className="h-7 w-20 rounded-full animate-shimmer" />
        {/* CSV button skeleton */}
        <Skeleton className="h-8 w-14 rounded-md animate-shimmer" />
      </div>

      {/* Filter chips row */}
      <div className="flex gap-1.5 flex-wrap">
        <Skeleton className="h-11 w-16 rounded-full animate-shimmer" />
        <Skeleton className="h-11 w-20 rounded-full animate-shimmer" />
        <Skeleton className="h-11 w-20 rounded-full animate-shimmer" />
        <Skeleton className="h-11 w-28 rounded-full animate-shimmer" />
        <Skeleton className="h-11 w-28 rounded-full animate-shimmer" />
      </div>

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="w-28 px-3 py-2 text-left font-medium">{t("table.ticker")}</th>
              <th className="hidden px-3 py-2 text-left font-medium md:table-cell">{t("table.name")}</th>
              <th className="px-3 py-2 text-right font-medium">{t("table.price")}</th>
              <th className="px-3 py-2 text-right font-medium">{t("table.change")}</th>
              <th className="hidden px-3 py-2 text-right font-medium lg:table-cell">{t("table.volume")}</th>
              <th className="hidden px-3 py-2 text-right font-medium lg:table-cell">{t("table.turnover")}</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 15 }).map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-border/50 last:border-b-0"
              >
                {/* Ticker + Name */}
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-10 animate-shimmer" />
                    <Skeleton className="h-3 w-16 animate-shimmer hidden md:inline-block" />
                  </div>
                </td>
                {/* Name (md+) */}
                <td className="hidden px-3 py-2 md:table-cell">
                  <Skeleton className="h-3 w-24 animate-shimmer" />
                </td>
                {/* Price */}
                <td className="px-3 py-2 text-right">
                  <Skeleton className="ml-auto h-3 w-14 animate-shimmer" />
                </td>
                {/* Change */}
                <td className="px-3 py-2 text-right">
                  <Skeleton className="ml-auto h-4 w-12 rounded-sm animate-shimmer" />
                </td>
                {/* Volume (lg+) */}
                <td className="hidden px-3 py-2 text-right lg:table-cell">
                  <Skeleton className="ml-auto h-3 w-16 animate-shimmer" />
                </td>
                {/* Turnover (lg+) */}
                <td className="hidden px-3 py-2 text-right lg:table-cell">
                  <Skeleton className="ml-auto h-3 w-20 animate-shimmer" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer: results count + shortcuts hint skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20 animate-shimmer" />
        <div className="flex gap-2">
          <Skeleton className="h-3 w-16 animate-shimmer" />
          <Skeleton className="h-3 w-12 animate-shimmer" />
          <Skeleton className="h-3 w-14 animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
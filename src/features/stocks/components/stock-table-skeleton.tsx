import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Keyboard } from "lucide-react";

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

  // Column count per breakpoint — must match live stock-row.tsx:
  // sm:  Ticker | Price | Change | Sparkline | Volume
  // lg:  Ticker | Name | Price | Change | Sparkline | Volume | Turnover
  // xl+: Ticker | Name | Price | Change | Sparkline | Volume | Turnover | Div.Yield | P/E | M.Cap
  // → skeleton shows sm columns (most visible) with xl+ additions for wide screens

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
        {/* Results count badge */}
        <Skeleton className="h-5 w-10 rounded-full animate-shimmer" />
        {/* CSV button skeleton */}
        <Skeleton className="h-8 w-14 rounded-md animate-shimmer" />
      </div>

      {/* Filter chips row */}
      <div className="flex gap-1.5 flex-wrap">
        <Skeleton className="h-11 w-16 rounded-full animate-shimmer" />
        <Skeleton className="h-11 w-20 rounded-full animate-shimmer" />
        <Skeleton className="h-11 w-20 rounded-full animate-shimmer" />
        <Skeleton className="h-11 w-20 rounded-full animate-shimmer" />
        <Skeleton className="h-11 w-28 rounded-full animate-shimmer" />
        <Skeleton className="h-11 w-28 rounded-full animate-shimmer" />
      </div>

      {/* Table skeleton — mirrors live stock-row.tsx columns:
           sm:  Ticker | Price | Change | Sparkline | Volume
           lg+: Ticker | Name  | Price | Change | Sparkline | Volume | Turnover
           xl+: adds Dividend Yield | P/E | Market Cap */}
      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-sm uppercase tracking-wider text-muted-foreground">
              <th className="w-32 px-3 py-3 text-left font-medium">{t("table.ticker")}</th>
              <th className="hidden px-3 py-3 text-left font-medium md:table-cell">{t("table.name")}</th>
              <th className="px-3 py-3 text-right font-medium">{t("table.price")}</th>
              <th className="px-3 py-3 text-right font-medium">{t("table.change")}</th>
              <th className="w-16 px-2 py-3 text-center font-medium">{t("table.trend") || "Trend"}</th>
              <th className="hidden px-3 py-3 text-right font-medium lg:table-cell">{t("table.volume")}</th>
              <th className="hidden px-3 py-3 text-right font-medium lg:table-cell">{t("table.turnover")}</th>
              <th className="hidden px-3 py-3 text-right font-medium xl:table-cell">{t("table.dividendYield") || "Div.%"}</th>
              <th className="hidden px-3 py-3 text-right font-medium xl:table-cell">{t("table.pe") || "P/E"}</th>
              <th className="hidden px-3 py-3 text-right font-medium xl:table-cell">{t("table.marketCap") || "M.Cap"}</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 15 }).map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-border/50 last:border-b-0"
              >
                {/* Ticker + Name */}
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    {/* Star toggle placeholder */}
                    <Skeleton className="h-4 w-4 rounded-sm animate-shimmer" />
                    <Skeleton className="h-4 w-12 animate-shimmer" />
                    <Skeleton className="h-4 w-16 animate-shimmer hidden md:inline-block" />
                  </div>
                </td>
                {/* Name (md+) */}
                <td className="hidden px-3 py-3 md:table-cell">
                  <Skeleton className="h-4 w-28 animate-shimmer" />
                </td>
                {/* Price */}
                <td className="px-3 py-3 text-right">
                  <Skeleton className="ml-auto h-4 w-16 animate-shimmer" />
                </td>
                {/* Change */}
                <td className="px-3 py-3 text-right">
                  <div className="ml-auto flex items-center justify-end gap-1">
                    <Skeleton className="h-5 w-14 rounded-sm animate-shimmer" />
                  </div>
                </td>
                {/* Sparkline (Trend) — matches stock-row.tsx w-16 column */}
                <td className="w-16 px-2 py-3 text-center">
                  <Skeleton className="mx-auto h-[18px] w-[44px] animate-shimmer" />
                </td>
                {/* Volume (lg+) */}
                <td className="hidden px-3 py-3 text-right lg:table-cell">
                  <Skeleton className="ml-auto h-4 w-16 animate-shimmer" />
                </td>
                {/* Turnover (lg+) */}
                <td className="hidden px-3 py-3 text-right lg:table-cell">
                  <Skeleton className="ml-auto h-4 w-20 animate-shimmer" />
                </td>
                {/* Dividend Yield (xl+) */}
                <td className="hidden px-3 py-3 text-right xl:table-cell">
                  <Skeleton className="ml-auto h-4 w-12 animate-shimmer" />
                </td>
                {/* P/E Ratio (xl+) */}
                <td className="hidden px-3 py-3 text-right xl:table-cell">
                  <Skeleton className="ml-auto h-4 w-10 animate-shimmer" />
                </td>
                {/* Market Cap (xl+) */}
                <td className="hidden px-3 py-3 text-right xl:table-cell">
                  <Skeleton className="ml-auto h-4 w-14 animate-shimmer" />
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
      {/* Always-visible keyboard shortcuts hint — matches main stocks table pattern */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm border border-border/50 bg-muted/30 px-3 py-1.5 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <Keyboard className="h-2.5 w-2.5" />
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Enter</kbd>
          <span>detalji</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">W</kbd>
          <span>prati</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">↑↓</kbd>
          <span>navigiraj</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">/</kbd>
          <span>pretraži</span>
        </span>
      </div>
    </div>
  );
}

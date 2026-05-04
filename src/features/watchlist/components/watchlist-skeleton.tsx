import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { Keyboard } from "lucide-react";
import { cn } from "@/lib/utils";

interface WatchlistSkeletonProps {
  className?: string;
  rows?: number;
}

/**
 * Loading skeleton for the watchlist table.
 * Mirrors the actual WatchlistTable column structure so loading
 * state looks like the real UI — including Trend/Sparkline column.
 */
export function WatchlistSkeleton({ className, rows = 5 }: WatchlistSkeletonProps) {
  const { t } = useTranslation("watchlist");

  return (
    <div className={cn("overflow-x-auto rounded-md border border-border [-webkit-overflow-scrolling:touch] [scrollbar-gutter:stable]", className)}>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="px-3 py-2 text-left font-medium">{t("table.ticker")}</th>
            <th className="hidden px-3 py-2 text-left font-medium md:table-cell">
              {t("table.name")}
            </th>
            <th className="hidden px-3 py-2 text-left font-medium lg:table-cell">
              {t("table.sector") || "Sector"}
            </th>
            <th className="px-3 py-2 text-right font-medium">
              {t("table.price")}
            </th>
            <th className="px-3 py-2 text-right font-medium">
              {t("table.change")}
            </th>
            {/* Trend column — mirrors actual table's sparkline column */}
            <th className="w-16 px-2 py-2 text-center font-medium">
              {t("table.trend") || "Trend"}
            </th>
            <th className="hidden px-3 py-2 text-right font-medium lg:table-cell">
              {t("table.volume")}
            </th>
            <th className="hidden px-3 py-2 text-right font-medium lg:table-cell">
              {t("table.turnover")}
            </th>
            <th className="hidden px-3 py-2 text-right font-medium xl:table-cell">
              {t("table.dividendYield") || "Div. Yield"}
            </th>
            <th className="hidden px-3 py-2 text-right font-medium xl:table-cell">
              {t("table.peRatio") || "P/E"}
            </th>
            <th className="hidden px-3 py-2 text-right font-medium 2xl:table-cell">
              {t("table.marketCap") || "Mkt Cap"}
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-border/50 last:border-b-0">
              {/* Star + Ticker */}
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <Skeleton className="h-3.5 w-3.5 rounded animate-shimmer" />
                  <Skeleton className="h-3.5 w-10 animate-shimmer" />
                </div>
              </td>
              {/* Name */}
              <td className="hidden px-3 py-2 md:table-cell">
                <Skeleton className="h-3 w-28 animate-shimmer" />
              </td>
              {/* Sector */}
              <td className="hidden px-3 py-2 lg:table-cell">
                <Skeleton className="h-3 w-16 animate-shimmer" />
              </td>
              {/* Price */}
              <td className="px-3 py-2 text-right">
                <Skeleton className="ml-auto h-3.5 w-14 animate-shimmer" />
              </td>
              {/* Change */}
              <td className="px-3 py-2 text-right">
                <Skeleton className="ml-auto h-4 w-12 rounded-sm animate-shimmer" />
              </td>
              {/* Trend — mini sparkline placeholder matching the 44x18 SVG in actual component */}
              <td className="px-2 py-2 text-center">
                <div className="mx-auto flex justify-center">
                  <Skeleton className="h-[18px] w-[44px] animate-shimmer rounded-sm" />
                </div>
              </td>
              {/* Volume */}
              <td className="hidden px-3 py-2 text-right lg:table-cell">
                <Skeleton className="ml-auto h-3 w-16 animate-shimmer" />
              </td>
              {/* Turnover */}
              <td className="hidden px-3 py-2 text-right lg:table-cell">
                <Skeleton className="ml-auto h-3 w-20 animate-shimmer" />
              </td>
              {/* Dividend Yield */}
              <td className="hidden px-3 py-2 text-right xl:table-cell">
                <Skeleton className="ml-auto h-3 w-10 animate-shimmer" />
              </td>
              {/* P/E Ratio */}
              <td className="hidden px-3 py-2 text-right xl:table-cell">
                <Skeleton className="ml-auto h-3 w-8 animate-shimmer" />
              </td>
              {/* Market Cap */}
              <td className="hidden px-3 py-2 text-right 2xl:table-cell">
                <Skeleton className="ml-auto h-3 w-12 animate-shimmer" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Always-visible keyboard shortcuts hint — matches stock/portfolio/heatmap pattern */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/50 bg-muted/30 px-3 py-1.5 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <Keyboard className="h-2.5 w-2.5" />
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">↑↓</kbd>
          <span>navigiraj</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Enter</kbd>
          <span>otvori</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">/</kbd>
          <span>pretraži</span>
        </span>
      </div>
    </div>
  );
}
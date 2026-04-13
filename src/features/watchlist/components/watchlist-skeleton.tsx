import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface WatchlistSkeletonProps {
  className?: string;
  rows?: number;
}

export function WatchlistSkeleton({ className, rows = 5 }: WatchlistSkeletonProps) {
  const { t } = useTranslation("watchlist");

  return (
    <div className={cn("overflow-hidden rounded-md border border-border", className)}>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground">
            <th className="px-3 py-2 text-left font-medium">{t("table.ticker")}</th>
            <th className="hidden px-3 py-2 text-left font-medium md:table-cell">
              {t("table.name")}
            </th>
            <th className="px-3 py-2 text-right font-medium">
              {t("table.price")}
            </th>
            <th className="px-3 py-2 text-right font-medium">
              {t("table.change")}
            </th>
            <th className="hidden px-3 py-2 text-right font-medium lg:table-cell">
              {t("table.volume")}
            </th>
            <th className="hidden px-3 py-2 text-right font-medium lg:table-cell">
              {t("table.turnover")}
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
              {/* Price */}
              <td className="px-3 py-2 text-right">
                <Skeleton className="ml-auto h-3.5 w-14 animate-shimmer" />
              </td>
              {/* Change */}
              <td className="px-3 py-2 text-right">
                <Skeleton className="ml-auto h-4 w-12 rounded-sm animate-shimmer" />
              </td>
              {/* Volume */}
              <td className="hidden px-3 py-2 text-right lg:table-cell">
                <Skeleton className="ml-auto h-3 w-16 animate-shimmer" />
              </td>
              {/* Turnover */}
              <td className="hidden px-3 py-2 text-right lg:table-cell">
                <Skeleton className="ml-auto h-3 w-20 animate-shimmer" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

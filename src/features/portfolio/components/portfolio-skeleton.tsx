import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Keyboard } from "lucide-react";

interface PortfolioSkeletonProps {
  className?: string;
}

export function PortfolioSkeleton({ className }: PortfolioSkeletonProps) {
  const { t } = useTranslation("portfolio");
  const ROW_COUNT = 5;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Summary cards skeleton */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="rounded-md border border-border bg-card p-3">
          <Skeleton className="h-2 w-16" />
          <Skeleton className="mt-2 h-6 w-24" />
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <Skeleton className="h-2 w-16" />
          <Skeleton className="mt-2 h-6 w-24" />
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <Skeleton className="h-2 w-16" />
          <Skeleton className="mt-2 h-6 w-12" />
        </div>
      </div>

      {/* Search + Action buttons skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
        <Skeleton className="h-8 w-28 rounded-md" />
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      {/* Filter chips skeleton */}
      <div className="flex gap-1.5">
        <Skeleton className="h-7 w-14 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>

      {/* Holdings table skeleton */}
      <div className="overflow-hidden rounded-md border border-border">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground">
              <th className="px-3 py-2 text-left font-medium">{t("fields.ticker")}</th>
              <th className="px-3 py-2 text-right font-medium">{t("fields.shares")}</th>
              <th className="px-3 py-2 text-right font-medium">{t("fields.avgPrice")}</th>
              <th className="px-3 py-2 text-right font-medium">{t("fields.currentPrice")}</th>
              <th className="hidden px-3 py-2 text-right font-medium md:table-cell">{t("fields.value")}</th>
              <th className="px-3 py-2 text-right font-medium">{t("fields.gain")}</th>
              <th className="hidden px-3 py-2 text-right font-medium xl:table-cell">{t("fields.trend")}</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: ROW_COUNT }).map((_, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-border/50 last:border-b-0"
              >
                {/* Ticker + Name */}
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3.5 w-10" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </td>
                {/* Shares */}
                <td className="px-3 py-2 text-right">
                  <Skeleton className="ml-auto h-3 w-12" />
                </td>
                {/* Avg Price */}
                <td className="px-3 py-2 text-right">
                  <Skeleton className="ml-auto h-3 w-14" />
                </td>
                {/* Current Price */}
                <td className="px-3 py-2 text-right">
                  <Skeleton className="ml-auto h-3 w-14" />
                </td>
                {/* Value (md+) */}
                <td className="hidden px-3 py-2 text-right md:table-cell">
                  <Skeleton className="ml-auto h-3 w-20" />
                </td>
                {/* Gain */}
                <td className="px-3 py-2 text-right">
                  <Skeleton className="ml-auto h-4 w-16 rounded-sm" />
                </td>
                <td className="hidden px-3 py-2 text-right xl:table-cell">
                  <Skeleton className="ml-auto h-[18px] w-[50px] rounded" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Always-visible keyboard shortcuts hint — matches main portfolio page pattern */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm border border-border/50 bg-muted/30 px-3 py-1.5 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <Keyboard className="h-2.5 w-2.5" />
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Enter</kbd>
          <span>detalji</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">N</kbd>
          <span>nova pozicija</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">/</kbd>
          <span>pretraži</span>
        </span>
      </div>
    </div>
  );
}

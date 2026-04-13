import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays } from "lucide-react";
import { useDividends } from "@/features/dividends/api/dividends-queries";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { formatDate, formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export function DividendsCalendar() {
  const { data: dividends, isLoading, isError, refetch } = useDividends();
  const { t } = useTranslation("common");

  // Group by month
  const grouped = useMemo(() => {
    if (!dividends) return [];

    const months = new Map<string, typeof dividends>();

    for (const d of dividends) {
      const monthKey = d.exDivDate.slice(0, 7); // YYYY-MM
      if (!months.has(monthKey)) {
        months.set(monthKey, []);
      }
      months.get(monthKey)!.push(d);
    }

    return Array.from(months.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, items]) => ({
        month,
        label: new Date(month + "-01").toLocaleDateString("hr-HR", {
          year: "numeric",
          month: "long",
        }),
        items: items.sort((a, b) => a.exDivDate.localeCompare(b.exDivDate)),
      }));
  }, [dividends]);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title={t("errors.generic")}
        description={t("errors.network")}
        retry={{ onRetry: refetch, label: t("errors.tryAgain") }}
      />
    );
  }

  if (!grouped.length) {
    return (
      <div className="rounded-md border border-border bg-card">
        <EmptyState
          icon={<CalendarDays className="h-5 w-5" />}
          title={t("empty.noData")}
          description={t("empty.noDataDescription")}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped.map((group) => (
        <div key={group.month}>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {group.label}
          </h3>
          <div className="space-y-1">
            {group.items.map((d) => {
              const isPast = new Date(d.exDivDate) < new Date();
              return (
                <div
                  key={`${d.ticker}-${d.exDivDate}`}
                  className={cn(
                    "flex items-center justify-between rounded-md border border-border bg-card px-3 py-2.5",
                    isPast && "opacity-50",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                      <CalendarDays className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-data text-xs font-semibold text-foreground">
                          {d.ticker}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span>Ex-div: {formatDate(d.exDivDate)}</span>
                        <span>Pay: {formatDate(d.payDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div>
                      <div className="font-data text-xs font-medium tabular-nums text-foreground">
                        {formatCurrency(d.amountEur)}
                      </div>
                      <Badge variant="success" className="text-[9px]">
                        {d.yield.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

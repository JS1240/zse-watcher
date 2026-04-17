import { Skeleton } from "@/components/ui/skeleton";

/**
 * Polished loading skeleton for StockTable
 * Shows search bar + table structure matching the live component layout
 */
export function StockTableSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {/* Search bar skeleton - matches search bar height */}
      <Skeleton className="h-8 w-full" />
      {/* Table rows skeleton - 12 rows like original */}
      <div className="space-y-1">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    </div>
  );
}
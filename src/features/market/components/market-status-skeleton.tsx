import { Skeleton } from "@/components/ui/skeleton";

/**
 * Polished loading state for the market status indicator.
 * Matches the exact layout: pulsing dot + "CLOSED"/"OPEN" label + phase text.
 * Shown while useMarketStatus() fetches — Croatian retail investors see a
 * structured skeleton rather than the unloaded state jumping to "closed".
 */
export function MarketStatusSkeleton() {
  return (
    <div className="flex flex-col gap-0.5" role="status" aria-label="Učitavam status tržišta">
      <div className="flex items-center gap-2">
        {/* Pulsing dot placeholder — mimics the phase indicator */}
        <Skeleton className="h-2 w-2 rounded-full" />
        <Skeleton className="h-2.5 w-16 rounded" />
      </div>
      {/* Phase label placeholder */}
      <Skeleton className="h-2 w-24 rounded" />
    </div>
  );
}
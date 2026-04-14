import { Skeleton } from "@/components/ui/skeleton";

/** Polished loading skeleton for Macro page */
export function MacroSkeleton() {
  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>

      <Skeleton className="h-10 w-full" />

      {/* Index cards grid */}
      <div className="grid gap-3 md:grid-cols-2">
        <IndexCardSkeleton primary />
        <IndexCardSkeleton />
        <IndexCardSkeleton />
        <ForexCardSkeleton />
      </div>

      {/* Investment factors */}
      <div className="rounded-md border border-border bg-card p-4">
        <Skeleton className="h-3 w-32 mb-3" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <FactorSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function IndexCardSkeleton({ primary }: { primary?: boolean }) {
  return (
    <div
      className={`rounded-md border p-4 ${
        primary ? "border-primary/30 bg-primary/5" : "border-border bg-card"
      }`}
    >
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
}

function ForexCardSkeleton() {
  return (
    <div className="rounded-md border border-border bg-card p-4">
      <Skeleton className="h-3 w-16 mb-3" />
      <div className="mt-3 grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-14" />
          </div>
        ))}
        <div className="col-span-2 border-t border-border/50 pt-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FactorSkeleton() {
  return (
    <div className="text-center">
      <Skeleton className="h-3 w-16 mx-auto" />
      <Skeleton className="h-4 w-12 mx-auto mt-1" />
    </div>
  );
}
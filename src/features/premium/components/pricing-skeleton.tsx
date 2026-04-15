import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PricingSkeletonProps {
  className?: string;
}

export function PricingSkeleton({ className }: PricingSkeletonProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header skeleton */}
      <div className="text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Skeleton className="h-6 w-6 rounded-full" />
        </div>
        <Skeleton className="mx-auto mt-2 h-6 w-32 animate-shimmer" />
        <Skeleton className="mx-auto mt-2 h-4 w-48 animate-shimmer" />
      </div>

      {/* Billing toggle skeleton */}
      <div className="flex items-center justify-center gap-2">
        <Skeleton className="h-8 w-20 rounded-sm animate-shimmer" />
        <Skeleton className="h-8 w-20 rounded-sm animate-shimmer" />
      </div>

      {/* Plan cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "relative rounded-lg border border-border bg-card p-5",
              index === 1 && "border-primary/50 bg-primary/5",
            )}
          >
            {/* Most Popular badge skeleton */}
            {index === 1 && (
              <Skeleton className="absolute -top-2.5 left-1/2 h-5 w-24 -translate-x-1/2 rounded-full animate-shimmer" />
            )}

            {/* Plan name */}
            <Skeleton className="h-5 w-16 animate-shimmer" />

            {/* Price */}
            <div className="mt-2 flex items-baseline gap-1">
              <Skeleton className="h-8 w-20 animate-shimmer" />
              <Skeleton className="h-4 w-12 animate-shimmer" />
            </div>

            {/* Annual billed text */}
            <Skeleton className="mt-2 h-3 w-24 animate-shimmer" />

            {/* CTA button */}
            <Skeleton className="mt-4 h-10 w-full rounded-md animate-shimmer" />

            {/* Features list */}
            <div className="mt-4 space-y-2">
              {Array.from({ length: 8 }).map((_, featIndex) => (
                <div key={featIndex} className="flex items-center gap-2">
                  <Skeleton className="h-3 w-3 shrink-0 rounded-full" />
                  <Skeleton className="h-3 w-32 animate-shimmer" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
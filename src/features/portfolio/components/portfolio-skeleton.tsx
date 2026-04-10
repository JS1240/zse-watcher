import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PortfolioSkeletonProps {
  className?: string;
}

export function PortfolioSkeleton({ className }: PortfolioSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Local indicator skeleton */}
      <Skeleton className="h-6 w-48" />

      {/* Summary cards skeleton */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Skeleton className="h-16 rounded-md border border-border" />
        <Skeleton className="h-16 rounded-md border border-border" />
        <Skeleton className="h-16 rounded-md border border-border" />
      </div>

      {/* Add button skeleton */}
      <div className="flex justify-end">
        <Skeleton className="h-8 w-28 rounded-md" />
      </div>

      {/* Holdings table skeleton */}
      <Skeleton className="h-48 w-full rounded-md border border-border" />
    </div>
  );
}

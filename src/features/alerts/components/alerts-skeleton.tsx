import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface AlertsSkeletonProps {
  className?: string;
  rows?: number;
}

export function AlertsSkeleton({ className, rows = 5 }: AlertsSkeletonProps) {
  const { t } = useTranslation("alerts");

  return (
    <div className={cn("space-y-1", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2"
        >
          {/* Left: Ticker + Condition Badge */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-12 animate-shimmer" />
            <Skeleton className="h-5 w-20 rounded-full animate-shimmer" />
          </div>

          {/* Center: Target value */}
          <div className="hidden flex-1 md:block">
            <Skeleton className="ml-auto h-4 w-16 animate-shimmer" />
          </div>

          {/* Right: Status + Actions */}
          <div className="flex items-center gap-2">
            {/* Status indicator */}
            <Skeleton className="h-2 w-2 rounded-full animate-shimmer" />
            {/* Action buttons */}
            <Skeleton className="h-6 w-6 rounded animate-shimmer" />
            <Skeleton className="h-6 w-6 rounded animate-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface SettingsSkeletonProps {
  className?: string;
}

export function SettingsSkeleton({ className }: SettingsSkeletonProps) {
  return (
    <div className={cn("flex h-full flex-col gap-4 overflow-auto p-4", className)}>
      {/* Page title */}
      <Skeleton className="h-7 w-32 animate-shimmer" />

      {/* Account section */}
      <div className="rounded-md border border-border bg-card p-4">
        <Skeleton className="mb-3 h-3 w-16 animate-shimmer" />
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-12 animate-shimmer" />
            <Skeleton className="h-3 w-40 animate-shimmer" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-3 w-8 animate-shimmer" />
            <Skeleton className="h-3 w-12 animate-shimmer" />
          </div>
        </div>
      </div>

      {/* Theme section */}
      <div className="rounded-md border border-border bg-card p-4">
        <Skeleton className="mb-3 h-3 w-10 animate-shimmer" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1 animate-shimmer" />
          <Skeleton className="h-9 flex-1 animate-shimmer" />
          <Skeleton className="h-9 flex-1 animate-shimmer" />
        </div>
      </div>

      {/* Language section */}
      <div className="rounded-md border border-border bg-card p-4">
        <Skeleton className="mb-3 h-3 w-16 animate-shimmer" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1 animate-shimmer" />
          <Skeleton className="h-9 flex-1 animate-shimmer" />
        </div>
      </div>

      <div className="h-px w-full bg-border" />

      {/* Keyboard shortcuts section */}
      <div className="rounded-md border border-border bg-card p-4">
        <Skeleton className="mb-3 h-3 w-24 animate-shimmer" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-sm bg-muted/50 px-2 py-1.5">
              <Skeleton className="h-3 w-24 animate-shimmer" />
              <Skeleton className="h-3 w-8 animate-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
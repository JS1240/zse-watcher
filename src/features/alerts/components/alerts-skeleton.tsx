import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Keyboard } from "lucide-react";

interface AlertsSkeletonProps {
  className?: string;
  rows?: number;
}

export function AlertsSkeleton({ className, rows = 5 }: AlertsSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Filter bar skeleton */}
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-9 flex-1 min-w-[180px] rounded-md animate-shimmer" />
        <div className="flex gap-1">
          <Skeleton className="h-11 w-16 rounded-full animate-shimmer" />
          <Skeleton className="h-11 w-20 rounded-full animate-shimmer" />
          <Skeleton className="h-11 w-20 rounded-full animate-shimmer" />
          <Skeleton className="h-11 w-20 rounded-full animate-shimmer" />
        </div>
        <Skeleton className="h-8 w-16 rounded-md animate-shimmer" />
        <Skeleton className="h-8 w-12 rounded-md animate-shimmer" />
      </div>

      {/* Results count skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16 animate-shimmer" />
        <div className="flex gap-2">
          <Skeleton className="h-3 w-14 animate-shimmer" />
          <Skeleton className="h-3 w-12 animate-shimmer" />
          <Skeleton className="h-3 w-14 animate-shimmer" />
          <Skeleton className="h-3 w-12 animate-shimmer" />
          <Skeleton className="h-3 w-10 animate-shimmer" />
          <Skeleton className="h-3 w-12 animate-shimmer" />
        </div>
      </div>

      {/* Alert rows skeleton */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-md border border-border bg-card px-3 py-2.5"
        >
          {/* Left: Bell icon + Ticker + Condition Badge */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-9 rounded-md animate-shimmer" />
            <Skeleton className="h-3.5 w-12 animate-shimmer" />
            <Skeleton className="h-5 w-20 rounded-full animate-shimmer" />
          </div>

          {/* Center: Target value + current price + distance */}
          <div className="hidden flex-1 md:flex items-center gap-3">
            <Skeleton className="h-3.5 w-16 animate-shimmer" />
            <Skeleton className="h-3 w-10 animate-shimmer" />
            <Skeleton className="h-4 w-12 rounded-sm animate-shimmer" />
          </div>

          {/* Right: Status + Actions */}
          <div className="flex items-center gap-1">
            <Skeleton className="h-3 w-8 animate-shimmer" />
            <Skeleton className="h-8 w-8 rounded-md animate-shimmer" />
            <Skeleton className="h-8 w-8 rounded-md animate-shimmer" />
            <Skeleton className="h-8 w-8 rounded-md animate-shimmer" />
            <Skeleton className="h-8 w-8 rounded-md animate-shimmer" />
            <Skeleton className="h-11 w-11 rounded-md animate-shimmer" />
          </div>
        </div>
      ))}

      {/* Always-visible keyboard shortcuts hint — matches main alerts dashboard pattern */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm border border-border/50 bg-muted/30 px-3 py-1.5 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <Keyboard className="h-2.5 w-2.5" />
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">N</kbd>
          <span>novi alarm</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">↑↓</kbd>
          <span>navigiraj</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Enter</kbd>
          <span>aktiviraj/pauziraj</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">E</kbd>
          <span>uredi</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">D</kbd>
          <span>kopiraj</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Del</kbd>
          <span>obri\u0161i</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Esc</kbd>
          <span>poni\u0161ti</span>
        </span>
      </div>
    </div>
  );
}
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Keyboard } from "lucide-react";

interface SettingsSkeletonProps {
  className?: string;
}

export function SettingsSkeleton({ className }: SettingsSkeletonProps) {
  return (
    <div className={cn("flex h-full flex-col gap-4 overflow-auto p-4", className)}>
      {/* Page title */}
      <Skeleton className="h-7 w-32" />

      {/* Account section */}
      <div className="rounded-md border border-border bg-card p-4">
        <Skeleton className="mb-3 h-3 w-16" />
        <div className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-40" />
          </div>
          <div className="flex justify-between">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>

      {/* Theme section */}
      <div className="rounded-md border border-border bg-card p-4">
        <Skeleton className="mb-3 h-3 w-10" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </div>

      {/* Language section */}
      <div className="rounded-md border border-border bg-card p-4">
        <Skeleton className="mb-3 h-3 w-16" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </div>

      <div className="h-px w-full bg-border" />

      {/* Keyboard shortcuts section */}
      <div className="rounded-md border border-border bg-card p-4">
        <Skeleton className="mb-3 h-3 w-24" />
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-sm bg-muted/50 px-2 py-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>
      </div>

      {/* Always-visible keyboard shortcuts hint — matches main settings page pattern */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-sm border border-border/50 bg-muted/30 px-3 py-1.5 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-0.5">
          <Keyboard className="h-2.5 w-2.5" />
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Cmd+K</kbd>
          <span>izbornik</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">?</kbd>
          <span>prečaci</span>
        </span>
        <span className="flex items-center gap-0.5">
          <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">T</kbd>
          <span>tema</span>
        </span>
      </div>
    </div>
  );
}

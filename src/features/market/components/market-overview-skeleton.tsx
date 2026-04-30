import { Activity, TrendingUp, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Keyboard } from "lucide-react";

interface MarketOverviewSkeletonProps {
  className?: string;
}

export function MarketOverviewSkeleton({ className }: MarketOverviewSkeletonProps) {
  return (
    <div className={cn("space-y-2", className ?? "")}>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <OverviewCardSkeleton
          icon={Activity}
          label="CROBEX"
          accent
        />
        <OverviewCardSkeleton
          icon={Activity}
          label="CROBEX10"
        />
        <OverviewCardSkeleton
          icon={TrendingUp}
          label="EURO STOXX 50"
        />
        <OverviewCardSkeleton
          icon={DollarSign}
          label="EUR/USD"
        />
      </div>

      {/* Always-visible keyboard shortcuts hint — matches main market overview pattern */}
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

interface OverviewCardSkeletonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  accent?: boolean;
}

function OverviewCardSkeleton({ icon: Icon, label, accent }: OverviewCardSkeletonProps) {
  return (
    <div className={cn("rounded-md border p-3", accent ? "border-primary/30 bg-primary/5" : "border-border bg-card")}>
      <div className="flex items-center gap-2">
        <Icon className={cn("h-3.5 w-3.5", accent ? "text-primary" : "text-muted-foreground")} />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <Skeleton className="h-7 w-20 animate-shimmer" />
        <Skeleton className="h-5 w-12 animate-shimmer" />
      </div>
    </div>
  );
}

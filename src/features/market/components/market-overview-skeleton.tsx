import { Activity, TrendingUp, DollarSign } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface MarketOverviewSkeletonProps {
  className?: string;
}

export function MarketOverviewSkeleton({ className }: MarketOverviewSkeletonProps) {
  return (
    <div className={`grid grid-cols-2 gap-2 lg:grid-cols-4 ${className ?? ""}`}>
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
  );
}

interface OverviewCardSkeletonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  accent?: boolean;
}

function OverviewCardSkeleton({ icon: Icon, label, accent }: OverviewCardSkeletonProps) {
  return (
    <div className={`rounded-md border p-3 ${accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${accent ? "text-primary" : "text-muted-foreground"}`} />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <Skeleton className="h-7 w-20" />
        <Skeleton className="h-5 w-12" />
      </div>
    </div>
  );
}
import { useTranslation } from "react-i18next";
import { Activity, TrendingUp, DollarSign } from "lucide-react";
import { useMacro } from "@/features/market/api/market-queries";
import { ChangeBadge } from "@/components/shared/change-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPrice } from "@/lib/formatters";

export function MarketOverview() {
  const { data: macro, isLoading } = useMacro();
  const { t } = useTranslation("macro");

  if (isLoading || !macro) {
    return (
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <OverviewCard
        icon={Activity}
        label={t("indices.crobex")}
        value={formatPrice(macro.crobex.value)}
        changePct={macro.crobex.changePct}
        accent
      />
      <OverviewCard
        icon={Activity}
        label={t("indices.crobex10")}
        value={formatPrice(macro.crobex10.value)}
        changePct={macro.crobex10.changePct}
      />
      <OverviewCard
        icon={TrendingUp}
        label={t("indices.euroStoxx")}
        value={formatPrice(macro.euroStoxx50.value)}
        changePct={macro.euroStoxx50.changePct}
      />
      <OverviewCard
        icon={DollarSign}
        label="EUR/USD"
        value={macro.eurUsd.toFixed(4)}
        changePct={0}
      />
    </div>
  );
}

interface OverviewCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  changePct: number;
  accent?: boolean;
}

function OverviewCard({ icon: Icon, label, value, changePct, accent }: OverviewCardProps) {
  return (
    <div className={`rounded-md border p-3 ${accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-3.5 w-3.5 ${accent ? "text-primary" : "text-muted-foreground"}`} />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="font-data text-lg font-bold tabular-nums text-foreground">
          {value}
        </span>
        <ChangeBadge value={changePct} showIcon={false} />
      </div>
    </div>
  );
}

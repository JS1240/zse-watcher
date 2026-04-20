import { useTranslation } from "react-i18next";
import { Activity, TrendingUp, DollarSign } from "lucide-react";
import { useMacro } from "@/features/market/api/market-queries";
import { ChangeBadge } from "@/components/shared/change-badge";
import { ErrorState } from "@/components/shared/error-state";
import { formatPrice } from "@/lib/formatters";
import { MarketOverviewSkeleton } from "./market-overview-skeleton";
import { LiveDataIndicator } from "@/components/shared/live-data-indicator";

export function MarketOverview() {
  const { data: macro, isLoading, isError, refetch, dataUpdatedAt, isFetching } = useMacro();
  const { t } = useTranslation("macro");
  const { t: tc } = useTranslation("common");

  if (isError) {
    return (
      <ErrorState
        title={tc("errors.generic")}
        description={tc("errors.network")}
        retry={{ onRetry: refetch, label: tc("errors.tryAgain") }}
      />
    );
  }

  if (isLoading || !macro) {
    return <MarketOverviewSkeleton />;
  }

  return (
    <div className="space-y-2">
      {/* Live data freshness indicator */}
      <LiveDataIndicator updatedAt={dataUpdatedAt} isFetching={isFetching} />

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
  const { i18n } = useTranslation("common");
  const isCroatian = i18n.language === "hr";

  // Accessible label for screen readers - Croatian investors
  const changeLabel = changePct > 0
    ? isCroatian ? `porast ${Math.abs(changePct).toFixed(2)}%` : `up ${Math.abs(changePct).toFixed(2)}%`
    : changePct < 0
      ? isCroatian ? `pad ${Math.abs(changePct).toFixed(2)}%` : `down ${Math.abs(changePct).toFixed(2)}%`
      : isCroatian ? "nema promjene" : "no change";

  return (
    <div
      className={`rounded-md border p-3 ${accent ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}
      role="group"
      aria-label={`${label}: ${value}, ${changeLabel}`}
    >
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

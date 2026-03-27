import { Bell } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

import { useAuth } from "@/hooks/use-auth";
import { useTriggeredAlerts, useActiveAlertCount } from "@/features/alerts/api/alerts-queries";
import { formatPrice, formatDate } from "@/lib/formatters";
import type { AlertCondition } from "@/types/alert";

export function NotificationCenter() {
  const { t } = useTranslation("alerts");
  const { isAuthenticated } = useAuth();
  const triggeredAlerts = useTriggeredAlerts();
  const activeCount = useActiveAlertCount();

  if (!isAuthenticated) return null;

  const hasNotifications = triggeredAlerts.length > 0;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button className="relative rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
          <Bell className="h-3.5 w-3.5" />
          {hasNotifications && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white">
              {triggeredAlerts.length}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-72 rounded-md border border-border bg-popover p-0 shadow-lg"
        >
          <div className="border-b border-border px-3 py-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("notification.title")}
            </h3>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {triggeredAlerts.length > 0 ? (
              triggeredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="border-b border-border/50 px-3 py-2 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-data text-[11px] font-semibold text-foreground">
                      {alert.ticker}
                    </span>
                    <span className="text-[10px] text-amber">
                      {t("status.triggered")}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {formatConditionText(alert.condition, alert.targetValue, t)}
                  </p>
                  {alert.triggeredAt && (
                    <p className="text-[9px] text-muted-foreground/70">
                      {formatDate(alert.triggeredAt)}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <div className="px-3 py-6 text-center text-[10px] text-muted-foreground">
                {activeCount > 0
                  ? t("notification.active", { count: activeCount })
                  : t("notification.none")}
              </div>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function formatConditionText(
  condition: AlertCondition,
  targetValue: number,
  t: TFunction<"alerts">,
): string {
  switch (condition) {
    case "above":
      return t("notification.priceAbove", { value: formatPrice(targetValue) });
    case "below":
      return t("notification.priceBelow", { value: formatPrice(targetValue) });
    case "percent_change_up":
      return t("notification.upBy", { value: targetValue });
    case "percent_change_down":
      return t("notification.downBy", { value: targetValue });
    default:
      return String(targetValue);
  }
}

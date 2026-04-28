import { Bell, ArrowRight, CheckCheck, X, Play, Pause } from "lucide-react";
import * as Popover from "@radix-ui/react-popover";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { useTriggeredAlerts, useActiveAlertCount, useToggleAlert } from "@/features/alerts/api/alerts-queries";
import { useLocalAlerts } from "@/features/alerts/hooks/use-local-alerts";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { formatPrice, formatRelativeTime } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { AlertCondition } from "@/types/alert";

export function NotificationCenter() {
  const { t } = useTranslation("alerts");
  const { isAuthenticated } = useAuth();
  const { alerts: localAlerts, toggleAlert: toggleLocalAlert } = useLocalAlerts();
  const remoteTriggeredAlerts = useTriggeredAlerts();
  const remoteActiveCount = useActiveAlertCount();
  const toggleRemoteAlert = useToggleAlert();
  const { data: stocksResult } = useStocksLive();
  const navigate = useNavigate();

  // Stock price map for context
  const stockPriceMap = useMemo(() => {
    if (!stocksResult?.stocks) return new Map<string, number>();
    const map = new Map<string, number>();
    stocksResult.stocks.forEach((s) => map.set(s.ticker, s.price ?? 0));
    return map;
  }, [stocksResult]);

  // Combine local and remote triggered alerts, sort newest first
  const localTriggeredAlerts = localAlerts.filter((a) => a.isTriggered);
  const allTriggeredAlerts = useMemo(() => {
    const combined = [...localTriggeredAlerts, ...remoteTriggeredAlerts];
    return combined.sort((a, b) => {
      const aTime = a.triggeredAt ? new Date(a.triggeredAt).getTime() : 0;
      const bTime = b.triggeredAt ? new Date(b.triggeredAt).getTime() : 0;
      return bTime - aTime; // newest first
    });
  }, [localTriggeredAlerts, remoteTriggeredAlerts]);

  const hasLocalAlerts = localAlerts.length > 0;
  const totalActiveCount = (hasLocalAlerts ? localAlerts.filter((a) => a.isActive).length : 0) + (isAuthenticated ? remoteActiveCount : 0);

  // Track which notifications have been "read" (dismissed from bell)
  const [readIds, setReadIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("zse-notification-read");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Persist read state
  useEffect(() => {
    try {
      localStorage.setItem("zse-notification-read", JSON.stringify([...readIds]));
    } catch {
      // Ignore
    }
  }, [readIds]);

  // Mark all as read
  const markAllRead = useCallback(() => {
    const newRead = new Set(readIds);
    allTriggeredAlerts.forEach((a) => newRead.add(a.id));
    setReadIds(newRead);
    toast.success(t("notification.markedAllRead") || "All notifications marked as read");
  }, [readIds, allTriggeredAlerts, t]);

  // Mark single as read (dismiss)
  const markRead = useCallback((id: string) => {
    setReadIds((prev) => new Set([...prev, id]));
  }, []);

  // Navigate to alerts page filtered by triggered
  const handleViewAllTriggered = () => {
    navigate({ to: "/alerts", search: { status: "triggered" } });
  };

  // Toggle alert active state (pause/resume)
  const handleToggleAlert = useCallback(async (alert: { id: string; isActive: boolean }) => {
    if (alert.id.startsWith("local-")) {
      const localAlert = localAlerts.find((a) => a.id === alert.id);
      if (localAlert) {
        toggleLocalAlert(alert.id);
        toast.success(localAlert.isActive ? t("toast.paused") : t("toast.activated"), { icon: <CheckCheck className="h-4 w-4 text-emerald-500" /> });
      }
    } else {
      await toggleRemoteAlert.mutateAsync({ alertId: alert.id, isActive: !alert.isActive });
      toast.success(alert.isActive ? t("toast.paused") : t("toast.activated"), { icon: <CheckCheck className="h-4 w-4 text-emerald-500" /> });
    }
    // Refresh the triggered alerts list
    markRead(alert.id);
  }, [localAlerts, toggleLocalAlert, toggleRemoteAlert, t, markRead]);

  const unreadCount = allTriggeredAlerts.filter((a) => !readIds.has(a.id)).length;

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          className="relative rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={t("notification.title")}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              (e.target as HTMLButtonElement).click();
            }
          }}
        >
          <Bell className="h-3.5 w-3.5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 animate-notification-pulse items-center justify-center rounded-full bg-destructive text-[8px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-80 rounded-md border border-border bg-popover p-0 shadow-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("notification.title")}
            </h3>
            <div className="flex items-center gap-1">
              {allTriggeredAlerts.length > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-0.5 text-[9px] text-muted-foreground transition-colors hover:text-foreground"
                  title={t("notification.markAllRead") || "Mark all as read"}
                >
                  <CheckCheck className="h-3 w-3" />
                </button>
              )}
              {allTriggeredAlerts.length > 0 && (
                <button
                  onClick={handleViewAllTriggered}
                  className="flex items-center gap-0.5 text-[9px] text-primary transition-colors hover:text-primary/80"
                >
                  {t("notification.viewAll") || "View all"}
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {allTriggeredAlerts.length > 0 ? (
              <div className="py-1">
                {allTriggeredAlerts.map((alert) => {
                  const isRead = readIds.has(alert.id);
                  const currentPrice = stockPriceMap.get(alert.ticker);
                  return (
                    <div
                      key={alert.id}
                      className={cn(
                        "group relative flex items-start justify-between gap-2 px-3 py-2.5 text-left transition-colors last:rounded-b-md hover:bg-accent/50",
                        !isRead && "bg-primary/5"
                      )}
                    >
                      {/* Unread dot */}
                      {!isRead && (
                        <span className="absolute left-1.5 top-3.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      )}

                      {/* Main content */}
                      <button
                        onClick={() => {
                          markRead(alert.id);
                          handleViewAllTriggered();
                        }}
                        className="ml-2 flex flex-col gap-1 text-left"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-data text-[11px] font-semibold text-foreground">
                            {alert.ticker}
                          </span>
                          <span className="rounded bg-amber px-1.5 py-0.5 text-[9px] font-medium text-amber-950 dark:text-amber-950">
                            {t("status.triggered")}
                          </span>
                          {alert.id.startsWith("local-") && (
                            <span className="rounded bg-muted px-1 py-0.5 text-[8px] text-muted-foreground">
                              local
                            </span>
                          )}
                          {/* Current price context */}
                          {currentPrice != null && (
                            <span className="rounded bg-muted px-1 py-0.5 text-[9px] font-medium text-muted-foreground">
                              <span className="font-data">{formatPrice(currentPrice)}</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                          <span>
                            {formatConditionText(alert.condition, alert.targetValue, t)}
                          </span>
                          {alert.triggeredAt && (
                            <span className="text-muted-foreground/60">
                              {formatRelativeTime(alert.triggeredAt)}
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Dismiss button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markRead(alert.id);
                        }}
                        className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100"
                        title={t("notification.dismiss") || "Dismiss"}
                        aria-label={`Dismiss ${alert.ticker} notification`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {/* Quick pause/resume action */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleAlert(alert);
                        }}
                        className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 transition-all hover:bg-accent hover:text-foreground group-hover:opacity-100"
                        title={alert.isActive ? t("notification.pause") || "Pause alert" : t("notification.resume") || "Resume alert"}
                        aria-label={`${alert.isActive ? "Pause" : "Resume"} ${alert.ticker} alert`}
                      >
                        {alert.isActive ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Better empty state with actionable context */
              <div className="px-3 py-6 text-center">
                <p className="mb-1 text-[10px] font-semibold text-muted-foreground">
                  {totalActiveCount > 0
                    ? t("notification.noTriggers", { count: totalActiveCount })
                    : t("notification.none")}
                </p>
                {totalActiveCount > 0 && (
                  <p className="text-[9px] text-muted-foreground/60">
                    {t("notification.waitingForPrice") || "Waiting for price to hit target..."}
                  </p>
                )}
                {totalActiveCount === 0 && (
                  <button
                    onClick={() => navigate({ to: "/alerts" })}
                    className="mt-2 text-[9px] text-primary transition-colors hover:text-primary/80"
                  >
                    {t("notification.createFirst") || "Create your first alert →"}
                  </button>
                )}
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
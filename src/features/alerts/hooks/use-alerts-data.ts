import { useMemo, useCallback, useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAlerts, useDeleteAlert, useToggleAlert, useCreateAlert, useUpdateAlert } from "@/features/alerts/api/alerts-queries";
import { useLocalAlerts } from "@/features/alerts/hooks/use-local-alerts";
import type { AlertCondition } from "@/types/alert";

export interface AlertItem {
  id: string;
  ticker: string;
  condition: AlertCondition;
  targetValue: number;
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt: string | null;
  createdAt: string;
  isLocal: boolean;
  snoozedUntil: string | null;  // ISO date when snooze expires
}

export function useAlertsData() {
  const { isAuthenticated } = useAuth();

  const { data: remoteAlerts, isLoading: remoteLoading } = useAlerts();
  const { alerts: localAlerts, addAlert, removeAlert, toggleAlert: toggleLocalAlert, updateAlert: updateLocalAlert, snoozeAlert: snoozeLocalAlert } = useLocalAlerts();
  const createAlert = useCreateAlert();
  const deleteAlertMutation = useDeleteAlert();
  const toggleAlertMutation = useToggleAlert();
  const updateAlertMutation = useUpdateAlert();

  // Load snooze state from localStorage for authenticated users
  const [snoozeMap, setSnoozeMap] = useState<Record<string, string>>({});
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("zse-alert-snooze") || "{}");
      setSnoozeMap(stored);
    } catch {
      // Ignore
    }
  }, []);

  const refreshSnoozeMap = useCallback(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("zse-alert-snooze") || "{}");
      setSnoozeMap(stored);
    } catch {
      // Ignore
    }
  }, []);

  const alerts: AlertItem[] = useMemo(() => {
    if (isAuthenticated && remoteAlerts) {
      return remoteAlerts.map((a): AlertItem => ({
        id: a.id,
        ticker: a.ticker,
        condition: a.condition,
        targetValue: a.targetValue,
        isActive: a.isActive,
        isTriggered: a.isTriggered,
        triggeredAt: a.triggeredAt,
        createdAt: a.createdAt,
        isLocal: false,
        snoozedUntil: snoozeMap[a.id] ?? null,
      }));
    }
    return localAlerts.map((a): AlertItem => ({
      id: a.id,
      ticker: a.ticker,
      condition: a.condition,
      targetValue: a.targetValue,
      isActive: a.isActive,
      isTriggered: a.isTriggered,
      triggeredAt: a.triggeredAt,
      createdAt: a.createdAt,
      isLocal: true,
      snoozedUntil: a.snoozedUntil,
    }));
  }, [isAuthenticated, remoteAlerts, localAlerts, snoozeMap]);

  const isLoading = isAuthenticated ? remoteLoading : false;

  const deleteAlert = async (id: string) => {
    if (isAuthenticated) {
      await deleteAlertMutation.mutateAsync(id);
    } else {
      removeAlert(id);
    }
  };

  const toggleAlertActive = async (id: string) => {
    if (isAuthenticated) {
      const alert = alerts.find((a) => a.id === id);
      if (alert) {
        await toggleAlertMutation.mutateAsync({ alertId: id, isActive: !alert.isActive });
      }
    } else {
      toggleLocalAlert(id);
    }
  };

  const addNewAlert = async (data: {
    ticker: string;
    condition: AlertCondition;
    targetValue: number;
  }) => {
    if (isAuthenticated) {
      await createAlert.mutateAsync(data);
    } else {
      addAlert({ ...data, isActive: true });
    }
  };

  // Handle local alert update - memoized to prevent recreation
  const handleUpdateLocalAlert = useCallback(
    (id: string, data: { ticker: string; condition: AlertCondition; targetValue: number }) => {
      updateLocalAlert(id, data);
    },
    [updateLocalAlert],
  );

  const updateAlert = async (id: string, data: { ticker: string; condition: AlertCondition; targetValue: number }) => {
    if (isAuthenticated) {
      await updateAlertMutation.mutateAsync({ alertId: id, ...data });
    } else {
      handleUpdateLocalAlert(id, data);
    }
  };

  // Snooze an alert for N hours (0 hours = clear snooze)
  const snoozeAlert = async (id: string, hours: number) => {
    if (isAuthenticated) {
      try {
        const stored = JSON.parse(localStorage.getItem("zse-alert-snooze") || "{}");
        if (hours <= 0) {
          delete stored[id];  // Clear snooze
        } else {
          const snoozeUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
          stored[id] = snoozeUntil;
        }
        localStorage.setItem("zse-alert-snooze", JSON.stringify(stored));
        // Refresh the snooze map to trigger re-render
        refreshSnoozeMap();
      } catch {
        // Ignore storage errors
      }
    } else {
      snoozeLocalAlert(id, hours);
    }
  };

  // Bulk operations for managing multiple alerts at once
  const toggleAllAlerts = async (activate: boolean) => {
    const alertsToToggle = alerts.filter((a) => a.isActive !== activate);
    for (const alert of alertsToToggle) {
      if (isAuthenticated) {
        await toggleAlertMutation.mutateAsync({ alertId: alert.id, isActive: activate });
      } else {
        toggleLocalAlert(alert.id);
      }
    }
  };

  const deleteAllAlerts = async () => {
    for (const alert of alerts) {
      if (isAuthenticated) {
        await deleteAlertMutation.mutateAsync(alert.id);
      } else {
        removeAlert(alert.id);
      }
    }
  };

  const deleteTriggeredAlerts = async () => {
    const triggeredIds = alerts.filter((a) => a.isTriggered).map((a) => a.id);
    for (const id of triggeredIds) {
      if (isAuthenticated) {
        await deleteAlertMutation.mutateAsync(id);
      } else {
        removeAlert(id);
      }
    }
  };

  return {
    alerts,
    isLoading,
    isAuthenticated,
    addAlert: addNewAlert,
    deleteAlert,
    toggleAlert: toggleAlertActive,
    updateAlert,
    snoozeAlert,
    toggleAllAlerts,
    deleteAllAlerts,
    deleteTriggeredAlerts,
  };
}
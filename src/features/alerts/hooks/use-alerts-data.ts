import { useMemo, useCallback } from "react";
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
}

export function useAlertsData() {
  const { isAuthenticated } = useAuth();

  const { data: remoteAlerts, isLoading: remoteLoading } = useAlerts();
  const { alerts: localAlerts, addAlert, removeAlert, toggleAlert: toggleLocalAlert, updateAlert: updateLocalAlert } = useLocalAlerts();
  const createAlert = useCreateAlert();
  const deleteAlertMutation = useDeleteAlert();
  const toggleAlertMutation = useToggleAlert();
  const updateAlertMutation = useUpdateAlert();

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
    }));
  }, [isAuthenticated, remoteAlerts, localAlerts]);

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

  return {
    alerts,
    isLoading,
    isAuthenticated,
    addAlert: addNewAlert,
    deleteAlert,
    toggleAlert: toggleAlertActive,
    updateAlert,
  };
}

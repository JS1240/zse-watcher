import { useCallback } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import type { AlertCondition } from "@/types/alert";

const STORAGE_KEY = "zse-local-alerts";

export interface LocalAlert {
  id: string;
  ticker: string;
  condition: AlertCondition;
  targetValue: number;
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt: string | null;
  createdAt: string;
}

interface UseLocalAlertsReturn {
  alerts: LocalAlert[];
  addAlert: (alert: Omit<LocalAlert, "id" | "isTriggered" | "triggeredAt" | "createdAt">) => LocalAlert;
  removeAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  updateAlert: (id: string, data: { ticker?: string; condition?: AlertCondition; targetValue?: number }) => void;
  clearAll: () => void;
  hasAlerts: boolean;
}

function generateId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useLocalAlerts(): UseLocalAlertsReturn {
  const [alerts, setAlerts] = useLocalStorage<LocalAlert[]>(STORAGE_KEY, []);

  const addAlert = useCallback(
    (a: Omit<LocalAlert, "id" | "isTriggered" | "triggeredAt" | "createdAt">): LocalAlert => {
      const newAlert: LocalAlert = {
        ...a,
        id: generateId(),
        isTriggered: false,
        triggeredAt: null,
        createdAt: new Date().toISOString(),
      };
      setAlerts((prev) => [newAlert, ...prev]);
      return newAlert;
    },
    [setAlerts],
  );

  const removeAlert = useCallback(
    (id: string) => {
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    },
    [setAlerts],
  );

  const toggleAlert = useCallback(
    (id: string) => {
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a)),
      );
    },
    [setAlerts],
  );

  const updateAlert = useCallback(
    (id: string, data: { ticker?: string; condition?: AlertCondition; targetValue?: number }) => {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                ticker: data.ticker ?? a.ticker,
                condition: data.condition ?? a.condition,
                targetValue: data.targetValue ?? a.targetValue,
                isTriggered: false,
                triggeredAt: null,
              }
            : a,
        ),
      );
    },
    [setAlerts],
  );

  const clearAll = useCallback(() => {
    setAlerts([]);
  }, [setAlerts]);

  return {
    alerts,
    addAlert,
    removeAlert,
    toggleAlert,
    updateAlert,
    clearAll,
    hasAlerts: alerts.length > 0,
  };
}

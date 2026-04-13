import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { supabase } from "@/config/supabase";
import { useAuth } from "@/hooks/use-auth";
import { REFETCH_INTERVALS, FREE_TIER_LIMITS } from "@/config/constants";
import { createLogger } from "@/lib/logger";
import { toast } from "sonner";
import type { PriceAlert, AlertCondition, NotificationMethod } from "@/types/alert";

const logger = createLogger("AlertsQueries");

interface AlertRow {
  id: string;
  ticker: string;
  condition: string;
  target_value: number;
  is_active: boolean;
  is_triggered: boolean;
  triggered_at: string | null;
  notification_method: string;
  created_at: string;
}

function mapRow(row: AlertRow, userId: string): PriceAlert {
  return {
    id: row.id,
    userId,
    ticker: row.ticker,
    condition: row.condition as AlertCondition,
    targetValue: row.target_value,
    isActive: row.is_active,
    isTriggered: row.is_triggered,
    triggeredAt: row.triggered_at,
    notificationMethod: row.notification_method as NotificationMethod,
    createdAt: row.created_at,
  };
}

async function fetchAlerts(userId: string): Promise<PriceAlert[]> {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    logger.error("Failed to fetch alerts", error);
    return [];
  }

  return (data as AlertRow[]).map((r) => mapRow(r, userId));
}

export function useAlerts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["alerts", user?.id],
    queryFn: () => fetchAlerts(user!.id),
    enabled: !!user,
    refetchInterval: REFETCH_INTERVALS.ALERTS,
  });
}

export function useActiveAlertCount(): number {
  const { data } = useAlerts();
  return data?.filter((a) => a.isActive && !a.isTriggered).length ?? 0;
}

export function useTriggeredAlerts(): PriceAlert[] {
  const { data } = useAlerts();
  return data?.filter((a) => a.isTriggered) ?? [];
}

export function useCreateAlert() {
  const { t } = useTranslation("alerts");
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      ticker: string;
      condition: AlertCondition;
      targetValue: number;
      notificationMethod?: NotificationMethod;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Check free tier limit
      const current = queryClient.getQueryData<PriceAlert[]>(["alerts", user.id]);
      const activeCount = current?.filter((a) => a.isActive).length ?? 0;
      if (activeCount >= FREE_TIER_LIMITS.MAX_ALERTS) {
        throw new Error(`Free tier limit: max ${FREE_TIER_LIMITS.MAX_ALERTS} active alerts`);
      }

      const { error } = await supabase.from("alerts").insert({
        user_id: user.id,
        ticker: data.ticker,
        condition: data.condition,
        target_value: data.targetValue,
        notification_method: data.notificationMethod ?? "in_app",
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts", user?.id] });
      toast.success(t("toast.created"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("toast.createFailed"));
    },
  });
}

export function useDeleteAlert() {
  const { t } = useTranslation("alerts");
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (alertId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("alerts")
        .delete()
        .eq("id", alertId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts", user?.id] });
      toast.success(t("toast.deleted"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("toast.deleteFailed"));
    },
  });
}

export function useToggleAlert() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ alertId, isActive }: { alertId: string; isActive: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("alerts")
        .update({ is_active: isActive })
        .eq("id", alertId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts", user?.id] });
    },
  });
}

export function useUpdateAlert() {
  const { t } = useTranslation("alerts");
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      alertId,
      ticker,
      condition,
      targetValue,
    }: {
      alertId: string;
      ticker: string;
      condition: AlertCondition;
      targetValue: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("alerts")
        .update({
          ticker,
          condition,
          target_value: targetValue,
          is_triggered: false,
          triggered_at: null,
        })
        .eq("id", alertId)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts", user?.id] });
      toast.success(t("toast.updated"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("toast.updateFailed"));
    },
  });
}

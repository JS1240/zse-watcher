import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Bell, BellOff, X } from "lucide-react";

import { useAlerts, useDeleteAlert, useToggleAlert, useCreateAlert } from "@/features/alerts/api/alerts-queries";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatPrice, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { PriceAlert, AlertCondition } from "@/types/alert";

const alertSchema = z.object({
  ticker: z.string().min(1, "Required"),
  condition: z.enum(["above", "below", "percent_change_up", "percent_change_down"]),
  targetValue: z.string().min(1, "Required"),
});

type AlertValues = z.infer<typeof alertSchema>;

interface AlertFormProps {
  onClose: () => void;
  defaultTicker?: string;
}

export function AlertForm({ onClose, defaultTicker }: AlertFormProps) {
  const { t } = useTranslation("alerts");
  const createAlert = useCreateAlert();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AlertValues>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      ticker: defaultTicker ?? "",
      condition: "above",
    },
  });

  const onSubmit = async (data: AlertValues) => {
    await createAlert.mutateAsync({
      ticker: data.ticker,
      condition: data.condition as AlertCondition,
      targetValue: parseFloat(data.targetValue),
    });
    onClose();
  };

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground">{t("create")}</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">{t("fields.ticker")}</label>
          <Input placeholder="KOEI-R-A" {...register("ticker")} />
          {errors.ticker && <p className="mt-0.5 text-[10px] text-destructive">{errors.ticker.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">{t("fields.condition")}</label>
          <select
            {...register("condition")}
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1.5 font-data text-xs text-foreground"
          >
            <option value="above">{t("condition.above")}</option>
            <option value="below">{t("condition.below")}</option>
            <option value="percent_change_up">{t("condition.percentUp")}</option>
            <option value="percent_change_down">{t("condition.percentDown")}</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">{t("fields.target")}</label>
          <Input type="number" step="0.01" placeholder="150.00" {...register("targetValue")} />
          {errors.targetValue && <p className="mt-0.5 text-[10px] text-destructive">{errors.targetValue.message}</p>}
        </div>

        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : t("create")}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function AlertsDashboard() {
  const { t } = useTranslation("alerts");
  const { data: alerts, isLoading } = useAlerts();
  const deleteAlert = useDeleteAlert();
  const toggleAlert = useToggleAlert();
  const [showForm, setShowForm] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Create button */}
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3.5 w-3.5" />
          {t("create")}
        </Button>
      </div>

      {showForm && <AlertForm onClose={() => setShowForm(false)} />}

      {/* Alert list */}
      {alerts && alerts.length > 0 ? (
        <div className="space-y-1">
          {alerts.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              onDelete={() => deleteAlert.mutate(alert.id)}
              onToggle={() =>
                toggleAlert.mutate({
                  alertId: alert.id,
                  isActive: !alert.isActive,
                })
              }
            />
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-border bg-card py-12 text-center">
          <Bell className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
          <p className="text-xs text-muted-foreground">{t("empty")}</p>
        </div>
      )}
    </div>
  );
}

function AlertRow({
  alert,
  onDelete,
  onToggle,
}: {
  alert: PriceAlert;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const { t } = useTranslation("alerts");

  const conditionLabel = {
    above: t("condition.above"),
    below: t("condition.below"),
    percent_change_up: t("condition.percentUp"),
    percent_change_down: t("condition.percentDown"),
  }[alert.condition];

  const isPercent = alert.condition.includes("percent");

  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md border border-border bg-card px-3 py-2.5",
        !alert.isActive && "opacity-50",
        alert.isTriggered && "border-amber/30 bg-amber/5",
      )}
    >
      <div className="flex items-center gap-3">
        {/* Status */}
        <button onClick={onToggle} className="text-muted-foreground hover:text-foreground">
          {alert.isActive ? (
            <Bell className="h-3.5 w-3.5 text-amber" />
          ) : (
            <BellOff className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-data text-xs font-semibold text-foreground">
              {alert.ticker}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {conditionLabel}
            </span>
            <span className="font-data text-xs font-medium text-foreground">
              {isPercent ? `${alert.targetValue}%` : formatPrice(alert.targetValue)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>{formatDate(alert.createdAt)}</span>
            {alert.isTriggered && (
              <Badge variant="success" className="text-[9px]">
                {t("status.triggered")}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

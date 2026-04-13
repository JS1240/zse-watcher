import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Bell, BellOff, Pencil, Trash2, X, Check, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { useAlertsData } from "@/features/alerts/hooks/use-alerts-data";
import { useAlerts } from "@/features/alerts/api/alerts-queries";
import { AlertForm } from "@/features/alerts/components/alert-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TickerSelect } from "@/components/shared/ticker-select";
import { formatPrice, formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { AlertCondition } from "@/types/alert";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";

export function AlertsDashboard() {
  const { t } = useTranslation("alerts");
  const { t: tc } = useTranslation("common");
  const { alerts, isLoading, addAlert, deleteAlert, toggleAlert } = useAlertsData();
  const { isError, refetch } = useAlerts();
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

  if (isError) {
    return (
      <ErrorState
        title={tc("errors.generic")}
        description={tc("errors.network")}
        retry={{ onRetry: refetch, label: tc("errors.tryAgain") }}
      />
    );
  }

  return (
    <div className="space-y-3">
      {/* Create button */}
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          <Bell className="h-3.5 w-3.5" />
          {t("create")}
        </Button>
      </div>

      {showForm && (
        <AlertForm
          onClose={() => setShowForm(false)}
          onSuccess={() => toast.success(t("toast.created"))}
        />
      )}

      {/* Alert list */}
      {alerts && alerts.length > 0 ? (
        <div className="space-y-1">
          {alerts.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              onDelete={() => {
                deleteAlert(alert.id);
                toast.success(t("toast.deleted"));
              }}
              onToggle={() => toggleAlert(alert.id)}
              onUpdate={async (id, data) => {
                // Delete and re-create — inline edit via form replacement
                await deleteAlert(id);
                await addAlert({
                  ticker: data.ticker,
                  condition: data.condition,
                  targetValue: data.targetValue,
                });
                toast.success(t("toast.updated"));
              }}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Bell className="h-8 w-8" />}
          title={t("empty")}
          description={t("emptyDescription")}
          action={{ label: t("create"), onClick: () => setShowForm(true) }}
        />
      )}
    </div>
  );
}

interface AlertRowProps {
  alert: {
    id: string;
    ticker: string;
    condition: AlertCondition;
    targetValue: number;
    isActive: boolean;
    isTriggered: boolean;
    createdAt: string;
    isLocal: boolean;
  };
  onDelete: () => void;
  onToggle: () => void;
  onUpdate: (
    id: string,
    data: { ticker: string; condition: AlertCondition; targetValue: number },
  ) => Promise<void>;
}

function AlertRow({ alert, onDelete, onToggle, onUpdate }: AlertRowProps) {
  const { t } = useTranslation("alerts");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Inline edit form state
  const [editTicker, setEditTicker] = useState(alert.ticker);
  const [editCondition, setEditCondition] = useState(alert.condition);
  const [editTarget, setEditTarget] = useState(alert.targetValue.toString());
  const [editTickerError, setEditTickerError] = useState(false);
  const [editTargetError, setEditTargetError] = useState(false);

  const conditionOptions: { value: AlertCondition; label: string }[] = [
    { value: "above", label: t("condition.above") },
    { value: "below", label: t("condition.below") },
    { value: "percent_change_up", label: t("condition.percentUp") },
    { value: "percent_change_down", label: t("condition.percentDown") },
  ];

  const isPercent = alert.condition.includes("percent");
  const isPercentEdit = editCondition.includes("percent");
  const editPlaceholder = isPercentEdit ? "10.5" : "150.00";

  const handleSave = async () => {
    const parsed = parseFloat(editTarget.replace(",", "."));
    if (!editTicker) {
      setEditTickerError(true);
      return;
    }
    if (isNaN(parsed) || parsed <= 0) {
      setEditTargetError(true);
      return;
    }
    setSaving(true);
    setEditTickerError(false);
    setEditTargetError(false);
    try {
      await onUpdate(alert.id, {
        ticker: editTicker,
        condition: editCondition,
        targetValue: parsed,
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditTicker(alert.ticker);
    setEditCondition(alert.condition);
    setEditTarget(alert.targetValue.toString());
    setEditTickerError(false);
    setEditTargetError(false);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  // Focus target input on enter edit mode
  useEffect(() => {
    if (editing) {
      const timer = setTimeout(() => {
        const input = document.getElementById(`alert-edit-target-${alert.id}`);
        input?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editing, alert.id]);

  if (editing) {
    return (
      <div className="rounded-md border border-primary/50 bg-card px-3 py-2.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            {t("edit")}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50"
              title="Save"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
              title="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="mb-0.5 block text-[9px] uppercase tracking-wider text-muted-foreground">
              {t("fields.ticker")}
            </label>
            <TickerSelect
              value={editTicker}
              onChange={(v) => {
                setEditTicker(v);
                if (v) setEditTickerError(false);
              }}
              className={cn("h-7 font-data text-xs", editTickerError && "ring-1 ring-destructive")}
              placeholder="KOEI-R-A"
            />
            {editTickerError && (
              <p className="mt-1 flex items-center gap-1 rounded bg-destructive/10 px-2 py-1 text-[9px] font-medium text-destructive">
                ⚠ {t("validation.selectTicker")}
              </p>
            )}
          </div>
          <div>
            <label className="mb-0.5 block text-[9px] uppercase tracking-wider text-muted-foreground">
              {t("fields.condition")}
            </label>
            <select
              value={editCondition}
              onChange={(e) => setEditCondition(e.target.value as AlertCondition)}
              className="flex h-7 w-full rounded-md border border-input bg-background px-2 py-1 font-data text-xs text-foreground"
            >
              {conditionOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-0.5 block text-[9px] uppercase tracking-wider text-muted-foreground">
              {t("fields.target")}
            </label>
            <Input
              id={`alert-edit-target-${alert.id}`}
              type="number"
              step="0.01"
              value={editTarget}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                setEditTarget(e.target.value);
                const parsed = parseFloat(e.target.value.replace(",", "."));
                if (!isNaN(parsed) && parsed > 0) setEditTargetError(false);
              }}
              error={editTargetError}
              className="h-7 font-data text-xs"
              placeholder={editPlaceholder}
            />
            {editTargetError ? (
              <p className="mt-1 flex items-center gap-1 rounded bg-destructive/10 px-2 py-1 text-[9px] font-medium text-destructive">
                ⚠ {t("validation.positiveNumber")}
              </p>
            ) : (
              <p className="mt-1 flex items-center gap-1 text-[8px] text-muted-foreground">
                <Keyboard className="h-3 w-3" />
                {t("pressEnter")} · {t("cancelHint")}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex items-center justify-between rounded-md border border-border bg-card px-3 py-2.5 transition-colors",
        !alert.isActive && "opacity-50",
        alert.isTriggered && "border-amber/30 bg-amber/5",
      )}
    >
      <div className="flex items-center gap-3">
        {/* Status toggle */}
        <button
          onClick={onToggle}
          className="text-muted-foreground transition-colors hover:text-foreground"
          title={alert.isActive ? "Pause alert" : "Resume alert"}
        >
          {alert.isActive ? (
            <Bell className="h-3.5 w-3.5 text-amber" />
          ) : (
            <BellOff className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Alert info */}
        <div>
          <div className="flex items-center gap-2">
            <span className="font-data text-xs font-semibold text-foreground">
              {alert.ticker}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {conditionOptions.find((o) => o.value === alert.condition)?.label}
            </span>
            <span className="font-data text-xs font-medium text-foreground">
              {isPercent
                ? `${alert.targetValue}%`
                : formatPrice(alert.targetValue)}
            </span>
            {alert.isLocal && (
              <span className="rounded-sm bg-muted px-1 py-0.5 text-[9px] text-muted-foreground">
                {t("status.local")}
              </span>
            )}
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

      {/* Actions — visible on hover */}
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => setEditing(true)}
          className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title="Edit alert"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-sm p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          title="Delete alert"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
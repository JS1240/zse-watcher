import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Bell, BellOff, Pencil, Trash2, X, Check, Keyboard, Download, AlertCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { useAlertsData } from "@/features/alerts/hooks/use-alerts-data";
import { useAlerts, useUpdateAlert } from "@/features/alerts/api/alerts-queries";
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
import { exportToCsv } from "@/lib/export";
import { useDebounce } from "@/hooks/use-debounce";

export function AlertsDashboard() {
  const { t } = useTranslation("alerts");
  const { t: tc } = useTranslation("common");
  const { alerts, isLoading, deleteAlert, toggleAlert } = useAlertsData();
  const { isError, refetch } = useAlerts();
  const updateAlert = useUpdateAlert();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 200);

  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    if (!debouncedSearch) return alerts;
    const q = debouncedSearch.toLowerCase();
    return alerts.filter((a) => a.ticker.toLowerCase().includes(q));
  }, [alerts, debouncedSearch]);

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

  // CSV export for alerts
  const handleExport = () => {
    if (!filteredAlerts || filteredAlerts.length === 0) return;
    const headers = ["Ticker", "Condition", "Target", "Status", "Active", "Created"];
    const rows = alerts.map((a) => {
      const conditionLabels: Record<string, string> = {
        above: t("condition.above"),
        below: t("condition.below"),
        percent_change_up: t("condition.percentUp"),
        percent_change_down: t("condition.percentDown"),
      };
      return [
        a.ticker.toUpperCase(),
        conditionLabels[a.condition] || a.condition,
        a.condition.includes("percent") ? `${a.targetValue}%` : formatPrice(a.targetValue),
        a.isTriggered ? t("status.triggered") : "—",
        a.isActive ? "✓" : "—",
        formatDate(a.createdAt),
      ];
    });
    exportToCsv(`zse-alerts-${new Date().toISOString().split("T")[0]}`, headers, rows);
    toast.success(t("toast.exported") || "Exported to CSV");
  };

  return (
    <div className="space-y-3">
      {/* Search + Action buttons */}
      <div className="flex gap-2">
        {alerts && alerts.length > 0 && (
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={tc("actions.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        )}
        <div className="flex gap-2">
          {filteredAlerts.length > 0 && (
            <Button size="sm" variant="secondary" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" />
              {t("exportCsv")}
            </Button>
          )}
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Bell className="h-3.5 w-3.5" />
            {t("create")}
          </Button>
        </div>
      </div>

      {showForm && (
        <AlertForm
          onClose={() => setShowForm(false)}
          onSuccess={() => toast.success(t("toast.created"))}
        />
      )}

      {/* Results count */}
      {alerts && alerts.length > 0 && (
        <div className="text-[10px] text-muted-foreground">
          {filteredAlerts.length} {filteredAlerts.length === 1 ? "alert" : "alerta"}
        </div>
      )}

      {/* Alert list */}
      {filteredAlerts.length > 0 ? (
        <div className="space-y-1">
          {filteredAlerts.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              onDelete={() => {
                deleteAlert(alert.id);
                toast.success(t("toast.deleted"));
              }}
              onToggle={() => toggleAlert(alert.id)}
              onUpdate={async (id, data) => {
                // Proper update mutation — preserves alert ID and createdAt
                await updateAlert.mutateAsync({
                  alertId: id,
                  ticker: data.ticker,
                  condition: data.condition,
                  targetValue: data.targetValue,
                });
              }}
            />
          ))}
        </div>
      ) : debouncedSearch ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title={tc("empty.noResults")}
          description={tc("empty.noResultsDescription")}
          action={{ label: tc("empty.clearFilters"), onClick: () => setSearch("") }}
        />
      ) : (!alerts || alerts.length === 0) ? (
        <EmptyState
          icon={<Bell className="h-8 w-8" />}
          title={t("empty")}
          description={t("emptyDescription")}
          action={{ label: t("create"), onClick: () => setShowForm(true) }}
        />
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
              <p className="mt-1.5 flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {t("validation.selectTicker")}
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
              <p className="mt-1.5 flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {t("validation.positiveNumber")}
              </p>
            ) : (
              <p className="mt-1.5 flex items-center gap-1.5 text-[9px] text-muted-foreground">
                <Keyboard className="h-3 w-3 flex-shrink-0" />
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
          title={`Delete ${alert.ticker} alert`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
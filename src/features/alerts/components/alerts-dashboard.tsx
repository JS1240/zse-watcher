import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import { Bell, BellOff, Pencil, Trash2, X, Check, CheckCircle2, Keyboard, Download, AlertCircle, Search, CircleDot, Pause, TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { toast } from "sonner";
import { useAlertsData } from "@/features/alerts/hooks/use-alerts-data";
import { useAlerts, useUpdateAlert } from "@/features/alerts/api/alerts-queries";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { AlertForm } from "@/features/alerts/components/alert-form";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TickerSelect } from "@/components/shared/ticker-select";
import { formatPrice, formatDate } from "@/lib/formatters";
import { normalizeNumberInput, formatInputNumber, parseLocalizedNumber } from "@/lib/format-input";
import { cn } from "@/lib/utils";
import type { AlertCondition } from "@/types/alert";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchEmptyIllustration } from "@/components/shared/empty-illustrations";
import { ErrorState } from "@/components/shared/error-state";
import { exportToCsv } from "@/lib/export";
import { useDebounce } from "@/hooks/use-debounce";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { AlertsSkeleton } from "@/features/alerts/components/alerts-skeleton";

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

function FilterChip({ active, onClick, label, icon, count }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex h-11 min-w-11 items-center gap-1 rounded-full px-2.5 py-2 text-[10px] font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
      )}
    >
      {icon}
      {label}
      {typeof count === "number" && (
        <span
          className={cn(
            "ml-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold",
            active
              ? "bg-primary-foreground/20 text-primary-foreground"
              : "bg-muted-foreground/20 text-muted-foreground"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export function AlertsDashboard() {
  const { t } = useTranslation("alerts");
  const { t: tc } = useTranslation("common");
  const { alerts, isLoading, deleteAlert, toggleAlert } = useAlertsData();
  const { isError, refetch } = useAlerts();
  const updateAlert = useUpdateAlert();
  const { data: stocksResult } = useStocksLive();
  const stocks = useMemo(() => stocksResult?.stocks ?? [], [stocksResult]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  // Keyboard shortcut to focus search
  const searchInputRef = useRef<HTMLInputElement>(null);
  const focusSearch = useCallback(() => searchInputRef.current?.focus(), []);
  useKeyboardShortcut({ key: "/", handler: focusSearch, enabled: true });

  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "triggered" | "paused">("all");
  const [conditionFilter, setConditionFilter] = useState<"all" | "price" | "percent">("all");
  const [sort, setSort] = useState<{ column: "ticker" | "createdAt" | "targetValue"; direction: "asc" | "desc" }>({
    column: "createdAt",
    direction: "desc",
  });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 200);

  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    let result = alerts;

    // Filter by status
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        result = result.filter((a) => a.isActive && !a.isTriggered);
      } else if (statusFilter === "triggered") {
        result = result.filter((a) => a.isTriggered);
      } else if (statusFilter === "paused") {
        result = result.filter((a) => !a.isActive);
      }
    }

    // Filter by condition type
    if (conditionFilter !== "all") {
      if (conditionFilter === "price") {
        result = result.filter((a) => !a.condition.includes("percent"));
      } else if (conditionFilter === "percent") {
        result = result.filter((a) => a.condition.includes("percent"));
      }
    }

    // Filter by search term
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((a) => a.ticker.toLowerCase().includes(q));
    }

    // Apply sorting
    if (sort) {
      result = [...result].sort((a, b) => {
        if (sort.column === "ticker") {
          return sort.direction === "asc"
            ? a.ticker.localeCompare(b.ticker)
            : b.ticker.localeCompare(a.ticker);
        }
        if (sort.column === "createdAt") {
          const aTime = new Date(a.createdAt).getTime();
          const bTime = new Date(b.createdAt).getTime();
          return sort.direction === "asc" ? aTime - bTime : bTime - aTime;
        }
        // targetValue
        return sort.direction === "asc"
          ? a.targetValue - b.targetValue
          : b.targetValue - a.targetValue;
      });
    }

    return result;
  }, [alerts, debouncedSearch, statusFilter, sort]);

  if (isLoading) {
    return <AlertsSkeleton />;
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
    toast.success(t("toast.exported") || "Exported to CSV", { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
  };

  return (
    <div className="space-y-3">
      {/* Search + Status Filter + Action buttons */}
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          {alerts && alerts.length > 0 && (
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder={tc("actions.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-14"
              />
              {!search && (
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                  <Keyboard className="h-2.5 w-2.5" />
                  /
                </span>
              )}
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  title={tc("actions.clear")}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
          <div className="flex gap-2">
            {filteredAlerts.length > 0 && (
              <>
                {/* Sort dropdown */}
                <select
                  value={`${sort.column}-${sort.direction}`}
                  onChange={(e) => {
                    const [column, direction] = e.target.value.split("-") as [
                      "ticker" | "createdAt" | "targetValue",
                      "asc" | "desc",
                    ];
                    setSort({ column, direction });
                  }}
                  className="h-8 rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground"
                  aria-label={t("sortBy") || "Sortiraj"}
                >
                  <option value="createdAt-desc">{t("sort.newest") || "Najnovije"}</option>
                  <option value="createdAt-asc">{t("sort.oldest") || "Najstarije"}</option>
                  <option value="ticker-asc">{t("sort.tickerAsc") || "A-Z"}</option>
                  <option value="ticker-desc">{t("sort.tickerDesc") || "Z-A"}</option>
                  <option value="targetValue-desc">{t("sort.targetDesc") || "Cilj ↓"}</option>
                  <option value="targetValue-asc">{t("sort.targetAsc") || "Cilj ↑"}</option>
                </select>
                <Button size="sm" variant="secondary" onClick={handleExport}>
                  <Download className="h-3.5 w-3.5" />
                  {t("exportCsv")}
                </Button>
              </>
            )}
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Bell className="h-3.5 w-3.5" />
              {t("create")}
            </Button>
          </div>
        </div>

        {/* Status filter buttons with counts - only show when there are alerts */}
        {alerts && alerts.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <FilterChip
              active={statusFilter === "all"}
              onClick={() => setStatusFilter("all")}
              label={t("filter.all") || "Sve"}
              count={alerts.length}
            />
            <FilterChip
              active={statusFilter === "active"}
              onClick={() => setStatusFilter("active")}
              label={t("filter.active") || "Aktivne"}
              icon={<CircleDot className="h-3 w-3" />}
              count={alerts.filter((a) => a.isActive && !a.isTriggered).length}
            />
            <FilterChip
              active={statusFilter === "triggered"}
              onClick={() => setStatusFilter("triggered")}
              label={t("filter.triggered") || "Aktivirane"}
              icon={<AlertCircle className="h-3 w-3" />}
              count={alerts.filter((a) => a.isTriggered).length}
            />
            <FilterChip
              active={statusFilter === "paused"}
              onClick={() => setStatusFilter("paused")}
              label={t("filter.paused") || "Pauzirane"}
              icon={<Pause className="h-3 w-3" />}
              count={alerts.filter((a) => !a.isActive).length}
            />
            <span className="mx-1 h-4 w-px bg-border" />
            <FilterChip
              active={conditionFilter === "all"}
              onClick={() => setConditionFilter("all")}
              label={t("filter.allConditions") || "Svi uvjeti"}
              icon={<ArrowUpDown className="h-3 w-3" />}
            />
            <FilterChip
              active={conditionFilter === "price"}
              onClick={() => setConditionFilter("price")}
              label={t("filter.priceAlerts") || "Cijena"}
              icon={<TrendingUp className="h-3 w-3" />}
              count={alerts.filter((a) => !a.condition.includes("percent")).length}
            />
            <FilterChip
              active={conditionFilter === "percent"}
              onClick={() => setConditionFilter("percent")}
              label={t("filter.percentAlerts") || "Postotak"}
              icon={<TrendingDown className="h-3 w-3" />}
              count={alerts.filter((a) => a.condition.includes("percent")).length}
            />
          </div>
        )}
      </div>

      {showForm && (
        <AlertForm
          onClose={() => setShowForm(false)}
          onSuccess={() => toast.success(t("toast.created"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> })}
        />
      )}

      {/* Results count */}
      {alerts && alerts.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {filteredAlerts.length} {filteredAlerts.length === 1 ? "alert" : "alerta"}
          </span>
          {/* Keyboard shortcuts hint - only show when alerts exist */}
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Enter</kbd>
              <span>{t("shortcut.toggle") || "aktiviraj"}</span>
            </span>
            <span className="flex items-center gap-0.5">
              <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">E</kbd>
              <span>{t("shortcut.edit") || "uredi"}</span>
            </span>
            <span className="flex items-center gap-0.5">
              <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Del</kbd>
              <span>{t("shortcut.delete") || "obrisi"}</span>
            </span>
          </div>
        </div>
      )}

      {/* Alert list */}
      {filteredAlerts.length > 0 ? (
        <div className="space-y-1">
          {filteredAlerts.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              stocks={stocks}
              onDelete={() => setConfirmDelete(alert.id)}
              onToggle={() => {
                const wasActive = alert.isActive;
                toggleAlert(alert.id);
                toast.success(wasActive ? t("toast.paused") : t("toast.activated"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
              }}
              onUpdate={async (id, data) => {
                // Proper update mutation — preserves alert ID and createdAt
                await updateAlert.mutateAsync({
                  alertId: id,
                  ticker: data.ticker,
                  condition: data.condition,
                  targetValue: data.targetValue,
                });
                toast.success(t("toast.updated") || "Alert updated", { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
              }}
            />
          ))}
        </div>
      ) : debouncedSearch ? (
        <EmptyState
          icon={<SearchEmptyIllustration className="h-8 w-8" />}
          title={tc("empty.noResults")}
          description={tc("empty.noResultsDescription")}
          action={{ label: tc("empty.clearFilters"), onClick: () => setSearch("") }}
        />
      ) : (
        <EmptyState
          icon={<Bell className="h-8 w-8" />}
          title={t("empty")}
          description={t("emptyDescription")}
          action={{ label: t("create"), onClick: () => setShowForm(true) }}
          variant="action"
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmationDialog
        open={!!confirmDelete}
        onOpenChange={(open) => !open && setConfirmDelete(null)}
        title={t("confirmDelete") || "Delete alert?"}
        description={
          confirmDelete
            ? t("confirmDeleteDescription")
                ?.replace("{ticker}", alerts?.find((a) => a.id === confirmDelete)?.ticker ?? "")
            : ""
        }
        confirmLabel={t("actions.delete") || "Delete"}
        cancelLabel={tc("actions.cancel") || "Cancel"}
        variant="danger"
        onConfirm={() => {
          if (confirmDelete) {
            deleteAlert(confirmDelete);
            toast.success(t("toast.deleted"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
          }
        }}
      />
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
  stocks?: { ticker: string; name: string; price: number | null }[];
}

export const AlertRow = memo(function AlertRow({ alert, onDelete, onToggle, onUpdate, stocks }: AlertRowProps) {
  const { t } = useTranslation("alerts");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  // Handle row-level keyboard shortcuts (outside edit mode)
  const handleRowKeyDown = (e: React.KeyboardEvent) => {
    if (editing) return; // Edit mode has its own handler

    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        onToggle();
        break;
      case "e":
      case "E":
        e.preventDefault();
        setEditing(true);
        break;
      case "Delete":
      case "Backspace":
        e.preventDefault();
        onDelete();
        break;
    }
  };

  // Focus row on mount if it's triggered (get attention)
  useEffect(() => {
    if (alert.isTriggered && rowRef.current) {
      rowRef.current.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Inline edit form state
  const [editTicker, setEditTicker] = useState(alert.ticker);
  const [editCondition, setEditCondition] = useState(alert.condition);
  const [editTarget, setEditTarget] = useState(alert.targetValue.toString());
  const [editTickerError, setEditTickerError] = useState(false);
  const [editTargetError, setEditTargetError] = useState(false);

  // Real-time validation state
  const [editFocused, setEditFocused] = useState({ ticker: false, target: false });

  // Real-time validation logic (matching AlertForm pattern)
  const isEditTickerValid = useMemo(() => {
    if (!editTicker) return false;
    if (!/^[A-Z0-9_-]{3,10}$/i.test(editTicker)) return false;
    // Check if ticker exists in stocks list (passed from parent)
    if (!stocks) return false;
    return stocks.some((s) => s.ticker.toUpperCase() === editTicker.toUpperCase());
  }, [editTicker, stocks]);

  const isEditTickerFormatValid = useMemo(() => {
    if (!editTicker) return false;
    return /^[A-Z0-9_-]{3,10}$/i.test(editTicker);
  }, [editTicker]);

  const showEditTickerNotFound = useMemo(() => {
    return isEditTickerFormatValid && !isEditTickerValid && editTicker.length >= 3;
  }, [isEditTickerFormatValid, isEditTickerValid, editTicker]);

  const isEditTargetValid = useMemo(() => {
    if (!editTarget) return false;
    const parsed = parseLocalizedNumber(editTarget);
    return !isNaN(parsed) && parsed > 0;
  }, [editTarget]);

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
    // Support both Croatian (150,00) and English (150.00) decimal formats
    const parsed = parseLocalizedNumber(editTarget);
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

  // Handle localized input display on blur
  const handleTargetBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const normalized = normalizeNumberInput(e.target.value);
    const parsed = parseLocalizedNumber(normalized);
    if (!isNaN(parsed)) {
      e.target.value = formatInputNumber(parsed, 2);
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
      <div className="animate-edit-expand rounded-md border border-primary/50 bg-card px-3 py-2.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            {t("edit")}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-sm p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title="Save"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="rounded-sm p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              className={cn(
                "h-7 font-data text-xs",
                editTickerError && "ring-1 ring-destructive border-destructive",
                isEditTickerValid && !editTickerError && "ring-1 ring-emerald-500 border-emerald-500"
              )}
              placeholder="KOEI-R-A"
            />
            {editTickerError ? (
              <p className="mt-1.5 flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {t("validation.selectTicker")}
              </p>
            ) : showEditTickerNotFound ? (
              <p className="mt-1.5 flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {t("tickerNotFound")}
              </p>
            ) : isEditTickerValid ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                {t("validation.tickerValid")}
              </p>
            ) : null}
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
              type="text"
              inputMode="decimal"
              step="0.01"
              value={editTarget}
              onKeyDown={handleKeyDown}
              onBlur={(e) => {
                setEditFocused((prev) => ({ ...prev, target: false }));
                handleTargetBlur(e);
              }}
              onFocus={() => setEditFocused((prev) => ({ ...prev, target: true }))}
              onChange={(e) => {
                setEditTarget(e.target.value);
                const parsed = parseLocalizedNumber(e.target.value);
                if (!isNaN(parsed) && parsed > 0) setEditTargetError(false);
              }}
              error={editTargetError}
              className={cn(
                "h-7 font-data text-xs",
                editTargetError && "ring-1 ring-destructive border-destructive",
                isEditTargetValid && !editTargetError && !editFocused.target && "ring-1 ring-emerald-500 border-emerald-500"
              )}
              placeholder={editPlaceholder}
            />
            {editTargetError ? (
              <p className="mt-1.5 flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {t("validation.positiveNumber")}
              </p>
            ) : isEditTargetValid && !editFocused.target ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                {t("validation.targetValid")}
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
      ref={rowRef}
tabIndex={0}
      onKeyDown={handleRowKeyDown}
      role="row"
      aria-label={`${alert.ticker} alert: ${alert.isActive ? "active" : "paused"}. Press Enter to toggle, E to edit, Delete to remove`}
      className={cn(
        "group flex cursor-pointer items-center justify-between rounded-md border border-border bg-card px-3 py-2.5 transition-all duration-150 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        !alert.isActive && "opacity-50",
        alert.isTriggered && "border-amber/30 bg-amber/5",
      )}
    >
      <div className="flex items-center gap-3">
        {/* Status toggle */}
        <button
          onClick={onToggle}
          className="text-muted-foreground transition-colors hover:text-foreground"
          title={alert.isActive ? "Pause alert (Enter)" : "Resume alert (Enter)"}
          aria-label={`${alert.isActive ? "Pause" : "Resume"} ${alert.ticker} alert`}
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

      {/* Actions — visible on hover/focus */}
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          onClick={() => setEditing(true)}
          className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="Edit alert (E)"
          aria-label={`Edit ${alert.ticker} alert`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-sm p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title={`Delete ${alert.ticker} alert (Del)`}
          aria-label={`Delete ${alert.ticker} alert`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}, (prev, next) => {
  // Only re-render if alert data changed
  return (
    prev.alert.id === next.alert.id &&
    prev.alert.ticker === next.alert.ticker &&
    prev.alert.condition === next.alert.condition &&
    prev.alert.targetValue === next.alert.targetValue &&
    prev.alert.isActive === next.alert.isActive &&
    prev.alert.isTriggered === next.alert.isTriggered
  );
});
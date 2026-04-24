import { useState, useEffect, useMemo, useRef, useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import i18n from "i18next";
import { Bell, BellOff, Pencil, Trash2, X, Check, CheckCircle2, Keyboard, Download, AlertCircle, Search, CircleDot, Pause, TrendingUp, TrendingDown, ArrowUpDown, ArrowUp, Copy, Play, PauseIcon, RotateCcw, Loader2, Clock, BellRing } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { toast } from "sonner";
import { useAlertsData } from "@/features/alerts/hooks/use-alerts-data";
import { useAlerts } from "@/features/alerts/api/alerts-queries";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { AlertForm } from "@/features/alerts/components/alert-form";
import { Button } from "@/components/ui/button";
import { LiveDataIndicator } from "@/components/shared/live-data-indicator";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TickerSelect } from "@/components/shared/ticker-select";
import { formatPrice, formatDate, formatRelativeTime } from "@/lib/formatters";
import { normalizeNumberInput, formatInputNumber, parseLocalizedNumber } from "@/lib/format-input";
import { cn } from "@/lib/utils";
import type { AlertCondition } from "@/types/alert";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchEmptyIllustration, AlertEmptyIllustration } from "@/components/shared/empty-illustrations";
import { ErrorState } from "@/components/shared/error-state";
import { Highlight } from "@/components/shared/highlight";
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
        "flex h-11 min-w-11 items-center gap-1 rounded-full px-2.5 py-2 text-[10px] font-medium transition-all duration-150",
        active
          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
          : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:scale-[1.02]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background btn-press"
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

interface AlertsDashboardProps {
  initialStatusFilter?: "all" | "active" | "triggered" | "paused";
}

export function AlertsDashboard({ initialStatusFilter }: AlertsDashboardProps) {
  const { t } = useTranslation("alerts");
  const { t: tc } = useTranslation("common");
  const { alerts, isLoading, deleteAlert, toggleAlert, updateAlert, toggleAllAlerts, deleteAllAlerts, deleteTriggeredAlerts, snoozeAlert } = useAlertsData();
  const { isError, refetch, dataUpdatedAt: alertsDataUpdatedAt, isFetching: alertsIsFetching } = useAlerts();
  const { data: stocksResult } = useStocksLive();
  const stocks = useMemo(() => stocksResult?.stocks ?? [], [stocksResult]);

  // Track when alerts were last checked against live prices
  // Persisted in localStorage so users can see when alerts were last evaluated
  const [lastCheckedTime, setLastCheckedTime] = useState<number>(() => {
    try {
      const stored = localStorage.getItem("zse-alerts-last-checked");
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Update last checked time when stock prices are fetched
  useEffect(() => {
    if (stocksResult && stocksResult.stocks) {
      const now = Date.now();
      setLastCheckedTime(now);
      try {
        localStorage.setItem("zse-alerts-last-checked", now.toString());
      } catch {
        // Ignore storage errors
      }
    }
  }, [stocksResult]);

  // Get stock prices for flash detection (only include tickers that have alerts)
  // Track previous prices to detect changes for flash animation
  const prevPricesRef = useRef<Map<string, number>>(new Map());
  const [priceFlashMap, setPriceFlashMap] = useState<Map<string, "up" | "down" | null>>(new Map());

  useEffect(() => {
    if (!alerts || !stocks) return;

    const newFlashes = new Map<string, "up" | "down" | null>();

    for (const alert of alerts) {
      const stock = stocks.find((s) => s.ticker === alert.ticker);
      if (!stock) continue;

      const currentPrice = stock.price ?? 0;
      const prevPrice = prevPricesRef.current.get(alert.ticker);

      if (prevPrice !== undefined && prevPrice !== currentPrice) {
        newFlashes.set(alert.ticker, currentPrice > prevPrice ? "up" : "down");
      }
      prevPricesRef.current.set(alert.ticker, currentPrice);
    }

    if (newFlashes.size > 0) {
      setPriceFlashMap(newFlashes);
      // Clear flashes after animation
      const timer = setTimeout(() => setPriceFlashMap(new Map()), 800);
      return () => clearTimeout(timer);
    }
  }, [alerts, stocks]);

  const getFlashState = useCallback(
    (alertId: string): "up" | "down" | null => {
      const alert = alerts?.find((a) => a.id === alertId);
      if (!alert) return null;
      return priceFlashMap.get(alert.ticker) ?? null;
    },
    [alerts, priceFlashMap]
  );

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  // Keyboard shortcut to focus search
  const searchInputRef = useRef<HTMLInputElement>(null);
  const focusSearch = useCallback(() => searchInputRef.current?.focus(), []);
  useKeyboardShortcut({ key: "/", handler: focusSearch, enabled: true });

  // Keyboard shortcut to create new alert
  const openCreateForm = useCallback(() => setShowForm(true), []);
  useKeyboardShortcut({ key: "a", handler: openCreateForm, enabled: true });

  // Initialize status filter from URL parameter (navigated from notification center)
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "triggered" | "paused">(
    initialStatusFilter ?? "all"
  );
  const [scrollTop, setScrollTop] = useState(false);
  const alertsListRef = useRef<HTMLDivElement>(null);
  const [conditionFilter, setConditionFilter] = useState<"all" | "price" | "percent">("all");
  const [sort, setSort] = useState<{ column: "ticker" | "createdAt" | "targetValue"; direction: "asc" | "desc" }>({
    column: "createdAt",
    direction: "desc",
  });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 200);

  // Bulk action state
  const [bulkAction, setBulkAction] = useState<"none" | "activateAll" | "pauseAll" | "deleteTriggered" | "deleteAll">("none");

  // Calculate alert counts for bulk action buttons
  const alertCounts = useMemo(() => {
    if (!alerts) return { active: 0, paused: 0, triggered: 0, total: 0 };
    return {
      active: alerts.filter((a) => a.isActive && !a.isTriggered).length,
      paused: alerts.filter((a) => !a.isActive).length,
      triggered: alerts.filter((a) => a.isTriggered).length,
      total: alerts.length,
    };
  }, [alerts]);

  // Bulk action handlers
  const handleBulkActivate = async () => {
    await toggleAllAlerts(true);
    toast.success(t("bulk.toastActivatedAll"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
  };

  const handleBulkPause = async () => {
    await toggleAllAlerts(false);
    toast.success(t("bulk.toastPausedAll"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
  };

  const handleBulkDeleteTriggered = async () => {
    await deleteTriggeredAlerts();
    toast.success(t("bulk.toastDeletedTriggered"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
    setBulkAction("none");
  };

  const handleBulkDeleteAll = async () => {
    await deleteAllAlerts();
    toast.success(t("bulk.toastDeletedAll"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
    setBulkAction("none");
  };

  // Click-to-copy handlers for alert values (matching portfolio UX)
  const handleCopyTicker = useCallback(async (e: React.MouseEvent, ticker: string) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(ticker);
    toast.success(tc("toast.copied", { ticker }) || `${ticker} kopiran`);
    setCopiedField(`ticker-${ticker}`);
    setTimeout(() => setCopiedField(null), 1200);
  }, [tc]);

  const handleCopyTarget = useCallback(async (e: React.MouseEvent, targetValue: number, isPercent: boolean) => {
    e.stopPropagation();
    const text = isPercent ? `${targetValue}%` : targetValue.toFixed(2);
    await navigator.clipboard.writeText(text);
    toast.success(tc("toast.copiedTarget") || `Kopirano: ${text}`);
    setCopiedField(`target-${targetValue}`);
    setTimeout(() => setCopiedField(null), 1200);
  }, [tc]);

  // Handle duplicate alert (opens form pre-filled with alert data)
  const [duplicateDefaults, setDuplicateDefaults] = useState<{
    ticker: string;
    condition: AlertCondition;
    targetValue: number;
  } | null>(null);

  const handleDuplicate = useCallback((alertData: { ticker: string; condition: AlertCondition; targetValue: number }) => {
    setDuplicateDefaults(alertData);
    setShowForm(true);
    toast.info(t("toast.duplicateHint") || "Alert values pre-filled — adjust and save", { icon: <Pencil className="h-4 w-4" /> });
  }, [t]);

  const filteredAlerts = useMemo(() => {
    if (!alerts) return [];
    let result = alerts;

    // Filter by status
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        result = result.filter((a) => a.isActive && !a.isTriggered);
      } else if (statusFilter === "triggered") {
        // Show triggered alerts, but hide ones that are snoozed (snooze hasn't expired)
        const now = new Date().getTime();
        result = result.filter((a) => {
          if (!a.isTriggered) return false;
          // Check if snoozed and snooze time hasn't passed
          if (a.snoozedUntil) {
            const snoozeUntil = new Date(a.snoozedUntil).getTime();
            if (snoozeUntil > now) return false;  // Hide snoozed alerts
          }
          return true;
        });
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
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setSearch("");
                    searchInputRef.current?.blur();
                  }
                }}
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
                <LiveDataIndicator
                  updatedAt={alertsDataUpdatedAt ?? 0}
                  isFetching={alertsIsFetching}
                />
                {/* Last checked timestamp - when alerts were evaluated against live prices */}
                {lastCheckedTime > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex h-8 items-center gap-1 px-2 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="hidden sm:inline">
                          {tc("time.lastChecked") || "Provjereno"} {formatRelativeTime(new Date(lastCheckedTime), i18n.language)}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">
                        {formatDate(new Date(lastCheckedTime) as unknown as string)}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                )}
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
            {/* Clear all filters button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(""); setStatusFilter("all"); setConditionFilter("all"); }}
              className="h-6 text-[10px]"
            >
              <RotateCcw className="h-3 w-3" />
              {tc("common:actions.reset")}
            </Button>
            {/* Bulk action buttons - show when there are alerts */}
            {alertCounts.total > 1 && (
              <>
                <span className="mx-1 h-4 w-px bg-border" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleBulkActivate}
                      disabled={alertCounts.active === alertCounts.total}
                      className="flex h-11 items-center gap-1 rounded-full px-2.5 py-2 text-[10px] font-medium bg-emerald-500/20 text-emerald-700 hover:bg-emerald-500/30 disabled:opacity-50 dark:bg-emerald-900/50 dark:text-emerald-300"
                    >
                      <Play className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {t("bulk.activateAll")}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleBulkPause}
                      disabled={alertCounts.paused === alertCounts.total}
                      className="flex h-11 items-center gap-1 rounded-full px-2.5 py-2 text-[10px] font-medium bg-amber-500/20 text-amber-700 hover:bg-amber-500/30 disabled:opacity-50 dark:bg-amber-900/50 dark:text-amber-300"
                    >
                      <PauseIcon className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {t("bulk.pauseAll")}
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setBulkAction("deleteTriggered")}
                      disabled={alertCounts.triggered === 0}
                      className="flex h-11 items-center gap-1 rounded-full px-2.5 py-2 text-[10px] font-medium bg-destructive/20 text-destructive hover:bg-destructive/30 disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {t("bulk.deleteTriggered")} ({alertCounts.triggered})
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setBulkAction("deleteAll")}
                      disabled={alertCounts.total === 0}
                      className="flex h-11 items-center gap-1 rounded-full px-2.5 py-2 text-[10px] font-medium bg-destructive/20 text-destructive hover:bg-destructive/30 disabled:opacity-50"
                    >
                      <Trash2 className="h-3 w-3" />
                      <Trash2 className="h-3 w-3 -ml-3" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {t("bulk.deleteAll")}
                  </TooltipContent>
                </Tooltip>
              </>
            )}
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
          onClose={() => { setShowForm(false); setDuplicateDefaults(null); }}
          defaultTicker={duplicateDefaults?.ticker}
          defaultCondition={duplicateDefaults?.condition}
          defaultTargetValue={duplicateDefaults?.targetValue}
          onSuccess={() => { toast.success(t("toast.created"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> }); setDuplicateDefaults(null); }}
        />
      )}

      {/* Results count */}
      {alerts && alerts.length > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground">
            {filteredAlerts.length} {filteredAlerts.length === 1 ? "alert" : "alerta"}
          </span>
          {/* Always-visible keyboard shortcuts hint for discoverability */}
          <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Enter</kbd>
              <span className="text-muted-foreground">{t("shortcut.toggle") || "aktiviraj/pauziraj"}</span>
            </span>
            <span className="flex items-center gap-0.5">
              <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">E</kbd>
              <span className="text-muted-foreground">{t("shortcut.edit") || "uredi"}</span>
            </span>
            <span className="flex items-center gap-0.5">
              <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">D</kbd>
              <span className="text-muted-foreground">{t("shortcut.duplicate") || "kopiraj"}</span>
            </span>
            <span className="flex items-center gap-0.5">
              <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Del</kbd>
              <span className="text-muted-foreground">{t("shortcut.delete") || "obri\u0161i"}</span>
            </span>
          </div>
        </div>
      )}

      {/* Alert list */}
      {filteredAlerts.length > 0 ? (
        <>
          <div
            ref={alertsListRef}
            onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop > 200)}
            className="max-h-[calc(100vh-280px)] space-y-1 overflow-y-auto pr-1"
          >
            {filteredAlerts.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                stocks={stocks}
                searchHighlight={debouncedSearch}
                flash={getFlashState(alert.id)}
                onDelete={() => setConfirmDelete(alert.id)}
                onToggle={() => {
                  const wasActive = alert.isActive;
                  toggleAlert(alert.id);
                  toast.success(wasActive ? t("toast.paused") : t("toast.activated"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
                }}
                onUpdate={async (id, data) => {
                  // Unified update for both authenticated and local alerts
                  await updateAlert(id, data);
                  toast.success(t("toast.updated") || "Alert updated", { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
                }}
                onSnooze={async (id, hours) => {
                  await snoozeAlert(id, hours);
                  toast.success(t("snooze.snoozed") || "Alert snoozed", { icon: <CheckCircle2 className="h-4 w-4 text-amber-500" /> });
                }}
                onUnsnooze={async (id) => {
                  await snoozeAlert(id, 0);  // 0 hours clears the snooze
                  toast.success(t("snooze.unsnooze") || "Snooze removed", { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
                }}
                onDuplicate={handleDuplicate}
                onCopyTicker={(e) => handleCopyTicker(e, alert.ticker)}
                onCopyTarget={(e) => handleCopyTarget(e, alert.targetValue, alert.condition.includes("percent"))}
                copiedField={copiedField}
              />
            ))}
          </div>

          {/* Scroll to top button */}
          <button
            onClick={() => alertsListRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
            className={cn(
              "fixed bottom-6 right-6 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-200 hover:bg-primary/90",
              scrollTop ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2"
            )}
            aria-label={tc("scrollToTop") || "Scroll to top"}
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </>
      ) : debouncedSearch ? (
        <div className="flex flex-col gap-6">
          <EmptyState
            icon={<SearchEmptyIllustration className="h-8 w-8" />}
            title={tc("empty.noResults")}
            description={tc("empty.noResultsDescription")}
            action={{ label: tc("empty.clearFilters"), onClick: () => setSearch("") }}
            shortcut="/"
          />
          {/* Keyboard shortcuts hint for empty state discoverability */}
          <div className="flex items-center justify-center gap-4 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-sans text-[8px]">A</kbd>
              <span>{t("shortcut.create") || "stvori alarm"}</span>
            </span>
            <span className="flex items-center gap-0.5">
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-sans text-[8px]">/</kbd>
              <span>{t("shortcut.search") || "pretrazi"}</span>
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <EmptyState
            icon={<AlertEmptyIllustration className="h-8 w-8" />}
            title={t("empty")}
            description={t("emptyDescription")}
            steps={[
              { label: t("emptyHints.step1"), description: t("emptyHints.step1Desc") },
              { label: t("emptyHints.step2"), description: t("emptyHints.step2Desc") },
              { label: t("emptyHints.step3"), description: t("emptyHints.step3Desc") },
            ]}
            action={{ label: t("create"), onClick: () => setShowForm(true) }}
            shortcut="A"
            variant="action"
          />
          {/* Keyboard shortcuts hint for empty state discoverability */}
          <div className="flex items-center justify-center gap-4 text-[9px] text-muted-foreground">
            <span className="flex items-center gap-0.5">
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-sans text-[8px]">A</kbd>
              <span>{t("shortcut.create") || "stvori alarm"}</span>
            </span>
            <span className="flex items-center gap-0.5">
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-sans text-[8px]">/</kbd>
              <span>{t("shortcut.search") || "pretrazi"}</span>
            </span>
          </div>
        </div>
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
        icon={<Bell className="h-5 w-5 text-amber" />}
        onConfirm={() => {
          if (confirmDelete) {
            deleteAlert(confirmDelete);
            toast.success(t("toast.deleted"), { icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> });
          }
        }}
      />

      {/* Bulk delete all confirmation dialog */}
      <ConfirmationDialog
        open={bulkAction === "deleteAll"}
        onOpenChange={(open) => !open && setBulkAction("none")}
        title={t("bulk.confirmDeleteAll") || "Delete all alerts?"}
        description={t("bulk.confirmDeleteAllDescription") || "This will permanently delete all your alerts."}
        confirmLabel={t("bulk.deleteAll") || "Delete all"}
        cancelLabel={tc("actions.cancel") || "Cancel"}
        variant="danger"
        icon={<Trash2 className="h-5 w-5 text-destructive" />}
        onConfirm={handleBulkDeleteAll}
      />

      {/* Bulk delete triggered confirmation dialog */}
      <ConfirmationDialog
        open={bulkAction === "deleteTriggered"}
        onOpenChange={(open) => !open && setBulkAction("none")}
        title={t("bulk.confirmDeleteTriggered") || "Delete triggered alerts?"}
        description={t("bulk.confirmDeleteTriggeredDescription") || "This will delete triggered alerts."}
        confirmLabel={t("bulk.deleteTriggered") || "Delete triggered"}
        cancelLabel={tc("actions.cancel") || "Cancel"}
        variant="danger"
        icon={<AlertCircle className="h-5 w-5 text-amber" />}
        onConfirm={handleBulkDeleteTriggered}
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
    triggeredAt: string | null;
    createdAt: string;
    isLocal: boolean;
    snoozedUntil: string | null;
  };
  onDelete: () => void;
  onToggle: () => void;
  onUpdate: (
    id: string,
    data: { ticker: string; condition: AlertCondition; targetValue: number },
  ) => Promise<void>;
  onSnooze?: (id: string, hours: number) => void;
  onUnsnooze?: (id: string) => void;
  onDuplicate?: (alert: {
    ticker: string;
    condition: AlertCondition;
    targetValue: number;
  }) => void;
  onCopyTicker?: (e: React.MouseEvent) => void;
  onCopyTarget?: (e: React.MouseEvent) => void;
  copiedField?: string | null;
  stocks?: { ticker: string; name: string; price: number | null }[];
  searchHighlight?: string;
  flash?: "up" | "down" | null;
}

export const AlertRow = memo(function AlertRow({ alert, onDelete, onToggle, onUpdate, onSnooze, onUnsnooze, onDuplicate, onCopyTicker, onCopyTarget, stocks, searchHighlight, flash }: AlertRowProps) {
  const { t } = useTranslation("alerts");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);

  // Get current price for this alert's ticker
  const currentPrice = useMemo(() => {
    if (!stocks || !alert.ticker) return null;
    const stock = stocks.find((s) => s.ticker === alert.ticker);
    return stock?.price ?? null;
  }, [stocks, alert.ticker]);

  // Calculate distance to trigger as percentage
  const triggerDistance = useMemo(() => {
    if (!currentPrice || !alert.targetValue) return null;
    const isPercent = alert.condition.includes("percent");
    if (isPercent) {
      // For percent conditions, the target is the percentage change itself
      return null;
    }
    // For absolute price conditions, calculate % distance
    const percentDiff = alert.condition === "above"
      ? ((alert.targetValue - currentPrice) / currentPrice) * 100
      : ((currentPrice - alert.targetValue) / currentPrice) * 100;
    return percentDiff;
  }, [currentPrice, alert.targetValue, alert.condition]);

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
      case "d":
      case "D":
        e.preventDefault();
        onDuplicate?.({
          ticker: alert.ticker,
          condition: alert.condition,
          targetValue: alert.targetValue,
        });
        break;
      case "Escape":
        if (editing) {
          e.preventDefault();
          handleCancel();
        }
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

  // Current price for the ticker being edited
  const editTickerCurrentPrice = useMemo(() => {
    if (!editTicker || !stocks) return null;
    const stock = stocks.find((s) => s.ticker.toUpperCase() === editTicker.toUpperCase());
    return stock?.price ?? null;
  }, [editTicker, stocks]);

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

  // Suggested targets for quick selection (matching AlertForm pattern)
  const editSuggestedTargets = useMemo(() => {
    if (!editTickerCurrentPrice || editCondition.includes("percent")) return null;
    return {
      up5: editTickerCurrentPrice * 1.05,
      up10: editTickerCurrentPrice * 1.10,
      down5: editTickerCurrentPrice * 0.95,
      down10: editTickerCurrentPrice * 0.90,
    };
  }, [editTickerCurrentPrice, editCondition]);

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
      <div className="rounded-md border-2 border-primary/60 bg-card animate-edit-border-pulse shadow-lg shadow-primary/10 transition-all duration-200">
        <div className="alert-edit-container open">
          <div className="alert-edit-inner px-3 py-2.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            {t("edit")}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-sm p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring btn-press"
              title="Save"
            >
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="rounded-sm p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring btn-press"
              title="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 animate-form-field">
          <div className="animate-form-field">
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
              <p className="mt-1.5 flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/15 px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {t("validation.selectTicker")}
              </p>
            ) : showEditTickerNotFound ? (
              <p className="mt-1.5 flex items-center gap-1.5 rounded-md border border-amber-400/30 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700/30">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {t("tickerNotFound")}
              </p>
            ) : isEditTickerValid ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
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
              <p className="mt-1.5 flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/15 px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {t("validation.positiveNumber")}
              </p>
            ) : isEditTargetValid && !editFocused.target ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                {t("validation.targetValid")}
              </p>
            ) : editSuggestedTargets ? (
              <div className="mt-1.5 flex flex-wrap items-center gap-1">
                <span className="text-[9px] text-muted-foreground">{t("quickSet") || "Brzo"}: </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditTarget(editSuggestedTargets.up5.toFixed(2));
                    setEditCondition("above");
                  }}
                  className="flex items-center gap-0.5 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 hover:bg-emerald-500/30 dark:text-emerald-300 suggested-chip"
                >
                  <TrendingUp className="h-2.5 w-2.5" />+5%
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditTarget(editSuggestedTargets.up10.toFixed(2));
                    setEditCondition("above");
                  }}
                  className="flex items-center gap-0.5 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700 hover:bg-emerald-500/30 dark:text-emerald-300 suggested-chip"
                >
                  <TrendingUp className="h-2.5 w-2.5" />+10%
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditTarget(editSuggestedTargets.down5.toFixed(2));
                    setEditCondition("below");
                  }}
                  className="flex items-center gap-0.5 rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] font-medium text-red-700 hover:bg-red-500/30 dark:text-red-300 suggested-chip"
                >
                  <TrendingDown className="h-2.5 w-2.5" />-5%
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditTarget(editSuggestedTargets.down10.toFixed(2));
                    setEditCondition("below");
                  }}
                  className="flex items-center gap-0.5 rounded bg-red-500/20 px-1.5 py-0.5 text-[9px] font-medium text-red-700 hover:bg-red-500/30 dark:text-red-300 suggested-chip"
                >
                  <TrendingDown className="h-2.5 w-2.5" />-10%
                </button>
              </div>
            ) : editTickerCurrentPrice != null ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-[9px] font-medium text-muted-foreground">
                <TrendingUp className="h-3 w-3 flex-shrink-0" />
                {t("fields.currentPriceHint", { price: formatPrice(editTickerCurrentPrice) }) || `Trenutna cijena: ${formatPrice(editTickerCurrentPrice)}`}
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
        flash === "up" && "price-flash-up",
        flash === "down" && "price-flash-down",
      )}
    >
      <div className="flex items-center gap-3">
        {/* Status toggle */}
        <button
          onClick={onToggle}
          className="flex h-11 w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
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
            {onCopyTicker ? (
              <button
                type="button"
                onClick={onCopyTicker}
                className="font-data text-xs font-semibold text-foreground transition-colors hover:text-primary"
                title="Click to copy ticker"
              >
                {searchHighlight ? (
                  <Highlight text={alert.ticker} highlight={searchHighlight} />
                ) : (
                  alert.ticker
                )}
              </button>
            ) : (
              <span className="font-data text-xs font-semibold text-foreground">
                {searchHighlight ? (
                  <Highlight text={alert.ticker} highlight={searchHighlight} />
                ) : (
                  alert.ticker
                )}
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">
              {conditionOptions.find((o) => o.value === alert.condition)?.label}
            </span>
            {onCopyTarget ? (
              <button
                type="button"
                onClick={onCopyTarget}
                className="font-data text-xs font-medium text-foreground transition-colors hover:text-primary"
                title="Click to copy target"
              >
                {isPercent
                  ? `${alert.targetValue}%`
                  : formatPrice(alert.targetValue)}
              </button>
            ) : (
              <span className="font-data text-xs font-medium text-foreground">
                {isPercent
                  ? `${alert.targetValue}%`
                  : formatPrice(alert.targetValue)}
              </span>
            )}
            {/* Current price + trigger distance */}
            {currentPrice && !isPercent && (
              <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <TrendingUp className="h-2.5 w-2.5" />
                  <span className="font-data">{formatPrice(currentPrice)}</span>
                </span>
                {triggerDistance !== null && (
                  <span
                    aria-label={`${triggerDistance > 0 ? "+" : ""}${triggerDistance.toFixed(1)}% ${t("distanceAria") || "do cilja"}`}
                    className={cn(
                      "rounded px-1 py-0.5 font-medium",
                      triggerDistance <= 2
                        ? "bg-red-500/20 text-red-600 dark:text-red-400"
                        : triggerDistance <= 5
                        ? "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {triggerDistance > 0 ? "+" : ""}{triggerDistance.toFixed(1)}%
                  </span>
                )}
              </span>
            )}
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
      <div className="alert-actions flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {onCopyTicker && (
          <button
            onClick={onCopyTicker}
            className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Copy ticker"
            aria-label={`Copy ${alert.ticker}`}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        )}
        {/* Always show both edit and duplicate buttons */}
        <button
          onClick={() => setEditing(true)}
          className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title="Edit alert (E)"
          aria-label={`Edit ${alert.ticker} alert`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        {onDuplicate && (
          <button
            onClick={() => onDuplicate({
              ticker: alert.ticker,
              condition: alert.condition,
              targetValue: alert.targetValue,
            })}
            className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title="Duplicate alert (D)"
            aria-label={`Duplicate ${alert.ticker} alert`}
          >
            <Copy className="h-3.5 w-3.5 rotate-90" />
          </button>
        )}
        {/* Snooze button - only show for triggered alerts that are not snoozed */}
        {alert.isTriggered && !alert.snoozedUntil && onSnooze && (
          <div className="flex items-center gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSnooze(alert.id, 1)}
                  className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  title={t("snooze.1hour") || "1 sat"}
                  aria-label={`Snooze ${alert.ticker} alert 1 hour`}
                >
                  <BellRing className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">{t("snooze.1hour") || "1 sat"}</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSnooze(alert.id, 24)}
                  className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  title={t("snooze.24hours") || "24 sata"}
                  aria-label={`Snooze ${alert.ticker} alert 24 hours`}
                >
                  <Clock className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">{t("snooze.24hours") || "24 sata"}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}
        {/* Unsnooze button - show for snoozed triggered alerts */}
        {alert.isTriggered && alert.snoozedUntil && onUnsnooze && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onUnsnooze(alert.id)}
                className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title={t("snooze.unsnooze") || "Ukloni odgodu"}
                aria-label={`Remove snooze from ${alert.ticker} alert`}
              >
                <BellRing className="h-3.5 w-3.5 text-amber" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left">
              <p className="text-xs">{alert.snoozedUntil ? new Date(alert.snoozedUntil).toLocaleString(i18n.language === "hr" ? "hr-HR" : "en-US") : ""}</p>
            </TooltipContent>
          </Tooltip>
        )}
        <button
          onClick={onDelete}
          className="flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          title={`Delete ${alert.ticker} alert (Del)`}
          aria-label={`Delete ${alert.ticker} alert`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}, (prev, next) => {
  // Only re-render if alert data or search highlight changed
  return (
    prev.alert.id === next.alert.id &&
    prev.alert.ticker === next.alert.ticker &&
    prev.alert.condition === next.alert.condition &&
    prev.alert.targetValue === next.alert.targetValue &&
    prev.alert.isActive === next.alert.isActive &&
    prev.alert.isTriggered === next.alert.isTriggered &&
    prev.searchHighlight === next.searchHighlight &&
    prev.onCopyTicker === next.onCopyTicker &&
    prev.onCopyTarget === next.onCopyTarget
  );
});
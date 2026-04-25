import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Moon, Sun, Globe, Monitor, Keyboard, Trash2, Download, Upload, Database, Check, ArrowUp, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useThemeStore } from "@/hooks/use-theme";
import { useSubscription } from "@/features/premium/hooks/use-subscription";
import { LoginPrompt } from "@/features/auth/components/login-prompt";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { cn } from "@/lib/utils";
import type { ThemeMode } from "@/types/user";
import { SettingsSkeleton } from "@/features/settings/components/settings-skeleton";
import { ShortcutsOverlay } from "@/components/layout/shortcuts-overlay";

export const Route = createFileRoute("/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { t, i18n } = useTranslation("common");
  const { isAuthenticated, user, loading } = useAuth();
  const { mode, setMode } = useThemeStore();
  const { isPremium, loading: subLoading } = useSubscription();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [scrollTop, setScrollTop] = useState(false);

  // Keyboard shortcut: ? to open shortcuts overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only trigger if not typing in an input
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA" && !target.isContentEditable) {
          e.preventDefault();
          setShowShortcuts(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Scroll to top handler
  const scrollToTop = () => {
    document.querySelector("[class*='overflow-auto']")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Data management state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [clearOptions, setClearOptions] = useState({
    watchlist: true,
    portfolio: true,
    alerts: true,
    dividends: true,
    presets: true,
  });
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Check if user has local data
  const hasLocalData = (() => {
    try {
      return !!(
        localStorage.getItem("zse-local-watchlist") ||
        localStorage.getItem("zse-portfolio-transactions") ||
        localStorage.getItem("zse-local-alerts") ||
        localStorage.getItem("zse-received-dividends") ||
        localStorage.getItem("zse-screener-presets")
      );
    } catch {
      return false;
    }
  })();

  // Export all local data as JSON
  const handleExportAll = useCallback(() => {
    const data: Record<string, unknown> = {};
    try {
      const watchlist = localStorage.getItem("zse-local-watchlist");
      const portfolio = localStorage.getItem("zse-portfolio-transactions");
      const alerts = localStorage.getItem("zse-local-alerts");
      const dividends = localStorage.getItem("zse-received-dividends");
      const presets = localStorage.getItem("zse-screener-presets");

      if (watchlist) data.watchlist = JSON.parse(watchlist);
      if (portfolio) data.portfolio = JSON.parse(portfolio);
      if (alerts) data.alerts = JSON.parse(alerts);
      if (dividends) data.dividends = JSON.parse(dividends);
      if (presets) data.presets = JSON.parse(presets);

      if (Object.keys(data).length === 0) {
        toast.info(t("empty.noData") || "No local data to export");
        return;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `zse-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("localData.exported"), { icon: <Check className="h-4 w-4 text-emerald-500" /> });
    } catch {
      toast.error(t("errors.generic"));
    }
  }, [t]);

  // Import data from JSON backup
  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          let imported = 0;

          if (data.watchlist) {
            localStorage.setItem("zse-local-watchlist", JSON.stringify(data.watchlist));
            imported++;
          }
          if (data.portfolio) {
            localStorage.setItem("zse-portfolio-transactions", JSON.stringify(data.portfolio));
            imported++;
          }
          if (data.alerts) {
            localStorage.setItem("zse-local-alerts", JSON.stringify(data.alerts));
            imported++;
          }
          if (data.dividends) {
            localStorage.setItem("zse-received-dividends", JSON.stringify(data.dividends));
            imported++;
          }
          if (data.presets) {
            localStorage.setItem("zse-screener-presets", JSON.stringify(data.presets));
            imported++;
          }

          if (imported > 0) {
            toast.success(t("localData.imported"), { icon: <Check className="h-4 w-4 text-emerald-500" /> });
            // Trigger page refresh
            window.location.reload();
          } else {
            toast.error(t("localData.importError"));
          }
        } catch {
          toast.error(t("localData.importError"));
        }
      };
      reader.readAsText(file);
      // Reset input
      e.target.value = "";
    },
    [t]
  );

  // Handle selective clear (called from ConfirmationDialog)
  const handleSelectiveClear = useCallback(() => {
    const keysToRemove: Record<string, string> = {
      watchlist: "zse-local-watchlist",
      portfolio: "zse-portfolio-transactions",
      alerts: "zse-local-alerts",
      dividends: "zse-received-dividends",
      presets: "zse-screener-presets",
    };

    let cleared = 0;
    Object.entries(clearOptions).forEach(([key, enabled]) => {
      if (enabled) {
        localStorage.removeItem(keysToRemove[key]);
        cleared++;
      }
    });

    if (cleared > 0) {
      toast.success(t("localData.cleared"), { icon: <Check className="h-4 w-4 text-emerald-500" /> });
      // Trigger page refresh
      window.location.reload();
    }
    setShowClearConfirm(false);
  }, [t, clearOptions]);

  if (loading || subLoading) return <SettingsSkeleton />;

  if (!isAuthenticated) {
    return <LoginPrompt />;
  }

  const themeOptions: { value: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { value: "dark", label: t("theme.dark"), icon: Moon },
    { value: "light", label: t("theme.light"), icon: Sun },
    { value: "system", label: t("theme.system"), icon: Monitor },
  ];

  const languageOptions = [
    { value: "hr", label: t("language.hr") },
    { value: "en", label: t("language.en") },
  ];

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4" onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop > 200)}>
      <div className="flex flex-col gap-1">
        <h1 className="font-data text-lg font-bold">{t("nav.settings")}</h1>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Keyboard className="h-3 w-3" />
          <kbd className="font-data">?</kbd>
          <span className="text-[9px]">{t("shortcuts.showAll") || "svi prečaci"}</span>
        </div>
      </div>

      {/* Always-visible keyboard shortcuts hint */}
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-md border border-dashed border-border bg-muted/30 px-3 py-2 text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-sans text-[8px]">K</kbd>
          <span>{t("shortcuts.commandPalette") || "naredbe"}</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-sans text-[8px]">1-9</kbd>
          <span>navigacija</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-sans text-[8px]">T</kbd>
          <span>tema</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="rounded bg-muted px-1.5 py-0.5 font-sans text-[8px]">?</kbd>
          <span>{t("shortcuts.showAll") || "svi prečaci"}</span>
        </span>
      </div>

      {/* Scroll to top button */}
      {scrollTop && (
        <button
          onClick={scrollToTop}
          aria-label={t("scrollToTop") || "Scroll to top"}
          title={t("scrollToTop") || "Scroll to top"}
          className="fixed bottom-20 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:bottom-6"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      )}

      {/* Account */}
      <section className="rounded-md border border-border bg-card p-4">
        <h2 className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">
          Account
        </h2>
        <div className="space-y-3 text-xs sm:space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">Email</span>
            <span className="font-data break-all text-foreground sm:text-right">{user?.email}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted-foreground">Plan</span>
            <span className={cn(
              "font-data font-medium",
              isPremium ? "text-amber drop-shadow-sm" : "text-foreground"
            )}>
              {isPremium ? "Premium" : "Free"}
            </span>
          </div>
        </div>
      </section>

      {/* Theme */}
      <section className="rounded-md border border-border bg-card p-4">
        <h2 className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">
          Theme
        </h2>
        <div className="flex gap-2 sm:grid sm:grid-cols-3">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.value}
                onClick={() => setMode(opt.value)}
                className={cn(
                  "flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-xs transition-colors",
                  mode === opt.value
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-accent",
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Language */}
      <section className="rounded-md border border-border bg-card p-4">
        <h2 className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">
          Language
        </h2>
        <div className="flex gap-2 sm:grid sm:grid-cols-2">
          {languageOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => i18n.changeLanguage(opt.value)}
              className={cn(
                "flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-xs transition-colors",
                i18n.language === opt.value
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-accent",
              )}
            >
              <Globe className="h-4 w-4 flex-shrink-0" />
              <span className="hidden sm:inline">{opt.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Data Management - for all users with localStorage */}
      {hasLocalData && (
        <section className="rounded-md border border-border bg-card p-4">
          <h2 className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("localData.title")}
          </h2>
          <div className="space-y-3">
            {/* Export all data button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportAll}
              className="w-full text-xs"
            >
              <Download className="mr-2 h-3.5 w-3.5" />
              {t("localData.exportAll")}
            </Button>

            {/* Import data button */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="w-full text-xs"
            >
              <Upload className="mr-2 h-3.5 w-3.5" />
              {t("localData.importData")}
            </Button>

            {/* Selective clear options */}
            <div className="space-y-2 py-2">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground">
                  {t("localData.selectData")}
                </p>
                <div className="flex gap-1 text-[9px]">
                  <button
                    onClick={() => setClearOptions({ watchlist: true, portfolio: true, alerts: true, dividends: true, presets: true })}
                    className="rounded px-1.5 py-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    {t("localData.selectAll") || "Svi"}
                  </button>
                  <span className="text-muted-foreground">/</span>
                  <button
                    onClick={() => setClearOptions({ watchlist: false, portfolio: false, alerts: false, dividends: false, presets: false })}
                    className="rounded px-1.5 py-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    {t("localData.selectNone") || "Ništa"}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {([
                  ["watchlist", t("localData.watchlist"), <Database className="h-3.5 w-3.5" />],
                  ["portfolio", t("localData.portfolio"), <Database className="h-3.5 w-3.5" />],
                  ["alerts", t("localData.alerts"), <Database className="h-3.5 w-3.5" />],
                  ["dividends", t("localData.dividends"), <Database className="h-3.5 w-3.5" />],
                  ["presets", t("localData.presets"), <Database className="h-3.5 w-3.5" />],
                ] as const).map(([key, label, icon]) => (
                  <button
                    key={key}
                    onClick={() =>
                      setClearOptions((prev) => ({
                        ...prev,
                        [key]: !prev[key as keyof typeof prev],
                      }))
                    }
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-2 py-2 text-xs transition-colors",
                      clearOptions[key as keyof typeof clearOptions]
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {clearOptions[key as keyof typeof clearOptions] ? (
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                    ) : (
                      <span className="h-3.5 w-3.5" />
                    )}
                    {icon}
                    <span className="truncate">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Clear selected button */}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
              className="w-full text-xs"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              {t("localData.clearAll")}
            </Button>

            {/* Clear confirmation dialog */}
            <ConfirmationDialog
              open={showClearConfirm}
              onOpenChange={setShowClearConfirm}
              onConfirm={handleSelectiveClear}
              title={t("localData.clearConfirmTitle") || " Briši sve lokalne podatke?"}
              description={
                t("localData.clearConfirmDesc") ||
                "Ovo će trajno izbrisati odabrane podatke iz preglednika. Ovo se ne može poništiti."
              }
              confirmLabel={t("localData.clearAll") || "Briši sve"}
              cancelLabel={t("common.cancel") || "Odustani"}
              variant="danger"
              icon={<AlertTriangle className="h-5 w-5" />}
            />
          </div>
        </section>
      )}

      <Separator />

      {/* Keyboard shortcuts reference */}
      <section className="rounded-md border border-border bg-card p-4">
        <h2 className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">
          {t("shortcuts.title") || "Keyboard Shortcuts"}
        </h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ["K", "Command palette"],
              ["1-9", "Navigation"],
              ["T", "Toggle theme"],
              ["Esc", t("shortcuts.closeDrawer") || "Close drawer"],
            ].map(([key, desc]) => (
              <div key={key} className="flex items-center justify-between rounded-sm bg-muted/50 px-2 py-1.5">
                <span className="text-muted-foreground">{desc}</span>
                <kbd className="font-data text-[10px] text-foreground">{key}</kbd>
              </div>
            ))}
          </div>
          {/* Hint to open full overlay */}
          <button
            onClick={() => setShowShortcuts(true)}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Keyboard className="h-4 w-4" />
            {t("shortcuts.showAll") || "Press ? for all shortcuts"}
          </button>
        </div>
      </section>

      {/* Shortcuts overlay */}
      {showShortcuts && <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />}
    </div>
  );
}

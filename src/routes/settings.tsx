import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Moon, Sun, Globe, Monitor, Keyboard, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useThemeStore } from "@/hooks/use-theme";
import { useSubscription } from "@/features/premium/hooks/use-subscription";
import { LoginPrompt } from "@/features/auth/components/login-prompt";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
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
    <div className="flex h-full flex-col gap-4 overflow-auto p-4">
      <h1 className="font-data text-lg font-bold">{t("nav.settings")}</h1>

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

      {/* Clear local data - for unauthenticated users */}
      <section className="rounded-md border border-border bg-card p-4">
        <h2 className="mb-3 text-[10px] uppercase tracking-wider text-muted-foreground">
          {t("localData.title")}
        </h2>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {t("localData.clearWarning")}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              localStorage.removeItem("zse-local-watchlist");
              localStorage.removeItem("zse-portfolio-transactions");
              localStorage.removeItem("zse-local-alerts");
              localStorage.removeItem("zse-received-dividends");
              localStorage.removeItem("zse-screener-presets");
              toast.success(t("localData.cleared"));
            }}
            className="w-full text-xs"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            {t("localData.clearAll")}
          </Button>
        </div>
      </section>

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

import { useTranslation } from "react-i18next";
import { Activity, Moon, Sun, Globe } from "lucide-react";
import { useThemeStore } from "@/hooks/use-theme";
import { UserMenu } from "@/features/auth/components/user-menu";
import { NotificationCenter } from "@/features/alerts/components/notification-center";
import { useMarketStatus } from "@/features/market/api/market-queries";
import { cn } from "@/lib/utils";

export function Header() {
  const { t, i18n } = useTranslation("common");
  const { mode, toggle: toggleTheme } = useThemeStore();
  const { data: marketStatus } = useMarketStatus();
  const isMarketOpen = marketStatus?.isOpen ?? false;

  const toggleLanguage = () => {
    const next = i18n.language === "hr" ? "en" : "hr";
    i18n.changeLanguage(next);
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4">
      {/* Left: Brand + Market Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <span className="font-data text-lg font-bold tracking-tight text-foreground">
            {t("app.name")}
          </span>
        </div>

        {/* Market status indicator - compact for header */}
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2 py-1 transition-colors",
            isMarketOpen
              ? "border-green-500/30 bg-green-500/10"
              : "border-red-500/30 bg-red-500/10"
          )}
          title={isMarketOpen ? t("market.status.open") : t("market.status.closed")}
        >
          <div
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              isMarketOpen ? "bg-price-up animate-pulse" : "bg-price-down"
            )}
          />
          <span
            className={cn(
              "font-data text-[9px] font-semibold uppercase tracking-wider",
              isMarketOpen ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
            )}
          >
            {isMarketOpen ? "OTVORENO" : "ZATVORENO"}
          </span>
        </div>

        <span className="hidden text-xs text-muted-foreground lg:inline">
          {t("app.tagline")}
        </span>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-1">
        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title={i18n.language === "hr" ? "Switch to English" : "Prebaci na Hrvatski"}
        >
          <Globe className="h-3.5 w-3.5" />
          <span className="font-data uppercase">{i18n.language}</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          title={mode === "dark" ? t("theme.light") : t("theme.dark")}
        >
          {mode === "dark" ? (
            <Sun className="h-3.5 w-3.5" />
          ) : (
            <Moon className="h-3.5 w-3.5" />
          )}
        </button>

        {/* Keyboard shortcut hint */}
        <div className="ml-1 hidden items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground md:flex">
          <kbd className="font-data text-[10px]">Cmd+K</kbd>
        </div>

        {/* Notifications */}
        <NotificationCenter />

        {/* User menu */}
        <div className="ml-1">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

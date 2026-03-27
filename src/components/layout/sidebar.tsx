import { useTranslation } from "react-i18next";
import { Link, useMatchRoute } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Grid3X3,
  Wallet,
  CalendarDays,
  Bell,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", labelKey: "nav.stocks", icon: Activity, shortcut: "1" },
  { path: "/macro", labelKey: "nav.macro", icon: BarChart3, shortcut: "2" },
  { path: "/heatmap", labelKey: "nav.heatmap", icon: Grid3X3, shortcut: "3" },
  { path: "/portfolio", labelKey: "nav.portfolio", icon: Wallet, shortcut: "4" },
  { path: "/dividends", labelKey: "nav.dividends", icon: CalendarDays, shortcut: "5" },
  { path: "/alerts", labelKey: "nav.alerts", icon: Bell, shortcut: "6" },
  { path: "/screener", labelKey: "Screener", icon: SlidersHorizontal, shortcut: "7" },
] as const;

export function Sidebar() {
  const { t } = useTranslation("common");
  const matchRoute = useMatchRoute();

  return (
    <nav className="hidden lg:flex w-14 shrink-0 flex-col items-center gap-1 border-r border-border bg-card py-2 lg:w-48 lg:items-stretch lg:px-2">
      {NAV_ITEMS.map((item) => {
        const isActive = matchRoute({ to: item.path, fuzzy: item.path !== "/" });
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "group flex items-center justify-center gap-2 rounded-md px-2 py-2 text-xs transition-colors lg:justify-start",
              isActive
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
            title={t(item.labelKey)}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="hidden lg:inline">{t(item.labelKey)}</span>
            <kbd className="ml-auto hidden font-data text-[10px] text-muted-foreground lg:inline">
              {item.shortcut}
            </kbd>
          </Link>
        );
      })}
    </nav>
  );
}

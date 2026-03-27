import { useTranslation } from "react-i18next";
import { Link, useMatchRoute } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Grid3X3,
  Wallet,
  CalendarDays,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { path: "/", labelKey: "nav.stocks", icon: Activity },
  { path: "/macro", labelKey: "nav.macro", icon: BarChart3 },
  { path: "/heatmap", labelKey: "nav.heatmap", icon: Grid3X3 },
  { path: "/portfolio", labelKey: "nav.portfolio", icon: Wallet },
  { path: "/dividends", labelKey: "nav.dividends", icon: CalendarDays },
  { path: "/alerts", labelKey: "nav.alerts", icon: Bell },
] as const;

export function MobileNav() {
  const { t } = useTranslation("common");
  const matchRoute = useMatchRoute();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex lg:hidden items-center",
        "border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80",
        "pb-safe padding-bottom-env",
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = matchRoute({
          to: item.path,
          fuzzy: item.path !== "/",
        });
        const Icon = item.icon;

        return (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px]",
              "transition-colors",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className={cn("h-4 w-4", isActive && "text-primary")} />
            <span className="font-data">{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

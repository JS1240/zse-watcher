import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useAppLastUpdated } from "@/hooks/use-last-updated";

type FooterProps = ComponentProps<"footer">;

export function Footer({ className }: FooterProps) {
  const { t, i18n } = useTranslation("common");
  const lastUpdated = useAppLastUpdated();

  const formatTime = (timestamp: number | null): string => {
    if (!timestamp) return "-";
    const locale = i18n.language === "hr" ? "hr-HR" : "en-GB";
    return new Date(timestamp).toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDate = (timestamp: number | null): string => {
    if (!timestamp) return "";
    const locale = i18n.language === "hr" ? "hr-HR" : "en-GB";
    const today = new Date();
    const date = new Date(timestamp);
    const isToday = today.toDateString() === date.toDateString();
    if (isToday) return "";
    return date.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
  };

  const dateStr = formatDate(lastUpdated);
  const timeStr = formatTime(lastUpdated);

  return (
    <footer className={cn("flex h-7 shrink-0 items-center justify-between border-t border-border bg-card px-4 text-[10px] text-muted-foreground", className)}>
      <div className="flex items-center gap-3">
        <span className="font-data">{t("app.name")} v0.1.0</span>
        <span className="hidden sm:inline">|</span>
        <span className="hidden sm:inline">ZSE - Zagrebacka burza</span>
      </div>
      <div className="flex items-center gap-3">
        {lastUpdated && (
          <span className="flex items-center gap-1 font-data">
            <span className="hidden sm:inline">{t("time.lastUpdated")}: </span>
            {dateStr && <span className="hidden sm:inline">{dateStr} </span>}
            <span>{timeStr}</span>
          </span>
        )}
      </div>
    </footer>
  );
}
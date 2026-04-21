import { useTranslation } from "react-i18next";
import { useMarketStatus } from "@/features/market/api/market-queries";
import { cn } from "@/lib/utils";

/** Get Croatian trading hours context */
function getTradingPhase(): { phase: "pre" | "open" | "after" | "closed"; label: string; timeUntil?: string } {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const day = now.getDay();
  
  // Weekend = closed
  if (day === 0 || day === 6) {
    const nextMonday = day === 0 ? 1 : 2;
    const daysUntil = nextMonday - day;
    return { phase: "closed", label: `Vikend – ${daysUntil === 1 ? "PON" : "UTO"}` };
  }
  
  // ZSE trading hours: 8:00-16:00 local time
  const currentMinutes = hour * 60 + minute;
  const marketOpen = 8 * 60;  // 8:00
  const marketClose = 16 * 60; // 16:00
  
  if (currentMinutes < marketOpen) {
    const minutesLeft = marketOpen - currentMinutes;
    const hours = Math.floor(minutesLeft / 60);
    const mins = minutesLeft % 60;
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    return { phase: "pre", label: "Prije otvaranja", timeUntil: timeStr };
  }
  
  if (currentMinutes >= marketClose) {
    return { phase: "after", label: "Nakon zatvaranja" };
  }
  
  // Open - show time remaining
  const minutesLeft = marketClose - currentMinutes;
  const hours = Math.floor(minutesLeft / 60);
  const mins = minutesLeft % 60;
  const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  return { phase: "open", label: "Otvoreno", timeUntil: timeStr };
}

export function MarketStatus() {
  const { data: status } = useMarketStatus();
  const { t, i18n } = useTranslation("common");

  const isOpen = status?.isOpen ?? false;
  const isCroatian = i18n.language === "hr";
  
  // Get trading phase for context
  const { phase, label, timeUntil } = getTradingPhase();
  
  // Accessible label for Croatian retail investors
  const ariaLabel = isOpen
    ? isCroatian
      ? "Burza je otvorena za trgovanje"
      : "Market is open for trading"
    : isCroatian
      ? "Burza je zatvorena"
      : "Market is closed";

  // Status indicator color based on phase
  const indicatorColor = phase === "pre" ? "bg-amber" : phase === "open" ? "bg-price-up animate-pulse" : phase === "after" ? "bg-amber" : "bg-price-down";

  return (
    <div
      className="flex flex-col gap-0.5"
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      aria-atomic="true"
    >
      <div className="flex items-center gap-2">
        <div className={cn("h-2 w-2 rounded-full", indicatorColor)} />
        <span className="font-data text-[10px] uppercase tracking-wider text-muted-foreground">
          {isOpen ? t("market.status.open") : t("market.status.closed")}
        </span>
      </div>
      {/* Trading phase context for Croatian investors */}
      <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
        <span>{label}</span>
        {timeUntil && (
          <span className="font-medium text-foreground">
            ({timeUntil})
          </span>
        )}
      </div>
    </div>
  );
}

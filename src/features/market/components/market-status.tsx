import { useTranslation } from "react-i18next";
import { useMarketStatus } from "@/features/market/api/market-queries";
import { cn } from "@/lib/utils";

export function MarketStatus() {
  const { data: status } = useMarketStatus();
  const { t, i18n } = useTranslation("common");

  const isOpen = status?.isOpen ?? false;
  const isCroatian = i18n.language === "hr";

  // Accessible label for Croatian retail investors
  const ariaLabel = isOpen
    ? isCroatian
      ? "Burza je otvorena za trgovanje"
      : "Market is open for trading"
    : isCroatian
      ? "Burza je zatvorena"
      : "Market is closed";

  return (
    <div
      className="flex items-center gap-2"
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      aria-atomic="true"
    >
      <div
        className={cn(
          "h-2 w-2 rounded-full",
          isOpen ? "bg-price-up animate-pulse" : "bg-price-down",
        )}
      />
      <span className="font-data text-[10px] uppercase tracking-wider text-muted-foreground">
        {isOpen ? t("market.status.open") : t("market.status.closed")}
      </span>
    </div>
  );
}

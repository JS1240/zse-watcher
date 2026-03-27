import { useTranslation } from "react-i18next";
import { useMarketStatus } from "@/features/market/api/market-queries";
import { cn } from "@/lib/utils";

export function MarketStatus() {
  const { data: status } = useMarketStatus();
  const { t } = useTranslation("common");

  const isOpen = status?.isOpen ?? false;

  return (
    <div className="flex items-center gap-2">
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

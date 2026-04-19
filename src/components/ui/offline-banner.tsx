import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useTranslation } from "react-i18next";

interface OfflineBannerProps {
  className?: string;
}

/**
 * Offline banner that shows when the user loses internet connectivity.
 * Useful for Croatian retail investors on mobile who may lose connection
 * during their commute or travel.
 */
export function OfflineBanner({ className }: OfflineBannerProps) {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation("common");

  if (isOnline) return null;

  return (
    <div
      className={`
        flex items-center justify-center gap-2 bg-amber-500/90 px-4 py-2 
        text-center text-[11px] font-medium text-amber-950 
        dark:bg-amber-600/90 dark:text-amber-50
        ${className ?? ""}
      `}
      role="status"
      aria-live="polite"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span>{t("offline.message") || "Niste povezani s internetom. Podaci možda nisu ažurirani."}</span>
    </div>
  );
}

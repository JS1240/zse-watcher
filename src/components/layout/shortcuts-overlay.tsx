import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { useThemeStore } from "@/hooks/use-theme";

interface ShortcutsOverlayProps {
  onClose: () => void;
}

export function ShortcutsOverlay({ onClose }: ShortcutsOverlayProps) {
  const { t } = useTranslation("common");
  const { toggle: toggleTheme } = useThemeStore();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "?") {
        e.preventDefault();
        onClose();
      }
      if (e.key.toLowerCase() === "t") {
        onClose();
        toggleTheme();
      }
      if (e.key.toLowerCase() === "k") {
        onClose();
        // Command palette is opened via its own shortcut
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, toggleTheme]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-sm rounded-lg border border-border bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-data text-sm font-bold text-foreground">{t("shortcutsOverlay.title")}</h2>
          <button
            onClick={onClose}
            className="rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Shortcuts */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-auto">
          {/* Navigation */}
          <div>
            <h3 className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("shortcutsOverlay.navigation")}
            </h3>
            <div className="space-y-1">
              <ShortcutItem keys={["1"]} description={t("shortcutsOverlay.stocks")} />
              <ShortcutItem keys={["2"]} description={t("shortcutsOverlay.macro")} />
              <ShortcutItem keys={["3"]} description={t("shortcutsOverlay.heatmap")} />
              <ShortcutItem keys={["4"]} description={t("shortcutsOverlay.portfolio")} />
              <ShortcutItem keys={["5"]} description={t("shortcutsOverlay.dividends")} />
              <ShortcutItem keys={["6"]} description={t("shortcutsOverlay.alerts")} />
              <ShortcutItem keys={["7"]} description={t("shortcutsOverlay.screener")} />
              <ShortcutItem keys={["8"]} description={t("shortcutsOverlay.watchlist")} />
              <ShortcutItem keys={["9"]} description={t("shortcutsOverlay.pricing")} />
            </div>
          </div>

          {/* App */}
          <div>
            <h3 className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("shortcutsOverlay.app")}
            </h3>
            <div className="space-y-1">
              <ShortcutItem keys={["T"]} description={t("shortcutsOverlay.toggleTheme")} />
              <ShortcutItem keys={["K"]} description={t("shortcutsOverlay.commandPalette")} />
              <ShortcutItem keys={["?"]} description={t("shortcutsOverlay.showShortcuts")} />
            </div>
          </div>

          {/* Stock Table */}
          <div>
            <h3 className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("shortcutsOverlay.stockTable")}
            </h3>
            <div className="space-y-1">
              <ShortcutItem keys={["Enter"]} description={t("shortcutsOverlay.openStockDetail")} />
              <ShortcutItem keys={["Esc"]} description={t("shortcutsOverlay.closeDrawer")} />
              <ShortcutItem keys={["↑", "↓"]} description={t("shortcutsOverlay.navigateRows")} />
            </div>
          </div>

          {/* Alerts */}
          <div>
            <h3 className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("shortcutsOverlay.alerts")}
            </h3>
            <div className="space-y-1">
              <ShortcutItem keys={["Enter"]} description={t("shortcutsOverlay.toggleAlert")} />
              <ShortcutItem keys={["E"]} description={t("shortcutsOverlay.editAlert")} />
              <ShortcutItem keys={["Del"]} description={t("shortcutsOverlay.deleteAlert")} />
              <ShortcutItem keys={["Esc"]} description={t("shortcutsOverlay.cancelEdit")} />
            </div>
          </div>

          {/* Watchlist */}
          <div>
            <h3 className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("shortcutsOverlay.watchlist")}
            </h3>
            <div className="space-y-1">
              <ShortcutItem keys={["Enter"]} description={t("shortcutsOverlay.openStockDetail")} />
              <ShortcutItem keys={["W"]} description={t("shortcutsOverlay.toggleWatchlist")} />
              <ShortcutItem keys={["Del"]} description={t("shortcutsOverlay.removeFromList")} />
            </div>
          </div>

          {/* Portfolio */}
          <div>
            <h3 className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("shortcutsOverlay.portfolio")}
            </h3>
            <div className="space-y-1">
              <ShortcutItem keys={["Enter"]} description={t("shortcutsOverlay.openStockDetail")} />
              <ShortcutItem keys={["E"]} description={t("shortcutsOverlay.editPosition")} />
              <ShortcutItem keys={["Del"]} description={t("shortcutsOverlay.deletePosition")} />
              <ShortcutItem keys={["N"]} description={t("shortcutsOverlay.addPosition")} />
            </div>
          </div>

          {/* Screener */}
          <div>
            <h3 className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("shortcutsOverlay.screener")}
            </h3>
            <div className="space-y-1">
              <ShortcutItem keys={["Enter"]} description={t("shortcutsOverlay.openStockDetail")} />
              <ShortcutItem keys={["F"]} description={t("shortcutsOverlay.filter")} />
              <ShortcutItem keys={["S"]} description={t("shortcutsOverlay.sort")} />
            </div>
          </div>
        </div>

        {/* Footer hint */}
        <div className="border-t border-border px-4 py-2 text-center">
          <p className="text-[10px] text-muted-foreground">{t("shortcutsOverlay.footer")}</p>
        </div>
      </div>
    </div>
  );
}

function ShortcutItem({ keys, description }: { keys: string[]; description: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-foreground/80">{description}</span>
      <div className="flex items-center gap-1">
        {keys.map((key) => (
          <kbd
            key={key}
            className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-muted px-1.5 font-data text-[10px] font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border/50"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
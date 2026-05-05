import { useEffect, useState, useMemo, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { X, Search } from "lucide-react";
import { useThemeStore } from "@/hooks/use-theme";
import { useDebounce } from "@/hooks/use-debounce";

interface ShortcutsOverlayProps {
  onClose: () => void;
}

export function ShortcutsOverlay({ onClose }: ShortcutsOverlayProps) {
  const { t } = useTranslation("common");
  const { toggle: toggleTheme } = useThemeStore();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 150);

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

  // Shortcut data — single source of truth for rendering and filtering
  const shortcutGroups = useMemo(() => [
    {
      id: "navigation",
      label: t("shortcutsOverlay.navigation"),
      shortcuts: [
        { keys: ["1"], description: t("shortcutsOverlay.stocks") },
        { keys: ["2"], description: t("shortcutsOverlay.macro") },
        { keys: ["3"], description: t("shortcutsOverlay.heatmap") },
        { keys: ["4"], description: t("shortcutsOverlay.portfolio") },
        { keys: ["5"], description: t("shortcutsOverlay.dividends") },
        { keys: ["6"], description: t("shortcutsOverlay.alerts") },
        { keys: ["7"], description: t("shortcutsOverlay.screener") },
        { keys: ["8"], description: t("shortcutsOverlay.watchlist") },
        { keys: ["9"], description: t("shortcutsOverlay.pricing") },
      ],
    },
    {
      id: "app",
      label: t("shortcutsOverlay.app"),
      shortcuts: [
        { keys: ["T"], description: t("shortcutsOverlay.toggleTheme") },
        { keys: ["K"], description: t("shortcutsOverlay.commandPalette") },
        { keys: ["?"], description: t("shortcutsOverlay.showShortcuts") },
      ],
    },
    {
      id: "stockTable",
      label: t("shortcutsOverlay.stockTable"),
      shortcuts: [
        { keys: ["Enter"], description: t("shortcutsOverlay.openStockDetail") },
        { keys: ["Esc"], description: t("shortcutsOverlay.closeDrawer") },
        { keys: ["↑", "↓"], description: t("shortcutsOverlay.navigateRows") },
      ],
    },
    {
      id: "alerts",
      label: t("shortcutsOverlay.alerts"),
      shortcuts: [
        { keys: ["Enter"], description: t("shortcutsOverlay.toggleAlert") },
        { keys: ["E"], description: t("shortcutsOverlay.editAlert") },
        { keys: ["Del"], description: t("shortcutsOverlay.deleteAlert") },
        { keys: ["Esc"], description: t("shortcutsOverlay.cancelEdit") },
      ],
    },
    {
      id: "watchlist",
      label: t("shortcutsOverlay.watchlist"),
      shortcuts: [
        { keys: ["Enter"], description: t("shortcutsOverlay.openStockDetail") },
        { keys: ["W"], description: t("shortcutsOverlay.toggleWatchlist") },
        { keys: ["Del"], description: t("shortcutsOverlay.removeFromList") },
      ],
    },
    {
      id: "portfolio",
      label: t("shortcutsOverlay.portfolio"),
      shortcuts: [
        { keys: ["Enter"], description: t("shortcutsOverlay.openStockDetail") },
        { keys: ["E"], description: t("shortcutsOverlay.editPosition") },
        { keys: ["Del"], description: t("shortcutsOverlay.deletePosition") },
        { keys: ["N"], description: t("shortcutsOverlay.addPosition") },
      ],
    },
    {
      id: "screener",
      label: t("shortcutsOverlay.screener"),
      shortcuts: [
        { keys: ["Enter"], description: t("shortcutsOverlay.openStockDetail") },
        { keys: ["F"], description: t("shortcutsOverlay.filter") },
        { keys: ["S"], description: t("shortcutsOverlay.sort") },
      ],
    },
  ] as const, [t]);

  // Filter groups and shortcuts by search term — matches on key or description
  const filteredGroups = useMemo(() => {
    if (!debouncedSearch) return shortcutGroups.map((g) => ({ ...g, shortcuts: g.shortcuts }));
    const q = debouncedSearch.toLowerCase();
    return shortcutGroups
      .map((group) => ({
        ...group,
        shortcuts: group.shortcuts.filter(
          (s) =>
            s.keys.some((k) => k.toLowerCase().includes(q)) ||
            s.description.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.shortcuts.length > 0);
  }, [shortcutGroups, debouncedSearch]);

  const totalResults = filteredGroups.reduce((sum, g) => sum + g.shortcuts.length, 0);

  const handleClearSearch = useCallback(() => setSearch(""), []);

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

        {/* Search bar */}
        <div className="border-b border-border px-4 py-2.5">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("shortcutsOverlay.searchPlaceholder")}
              autoFocus
              className="h-8 w-full rounded-md border border-border bg-muted/50 pl-8 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
            />
            {search && (
              <button
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          {search && (
            <p className="mt-1.5 text-[10px] text-muted-foreground">
              {t("shortcutsOverlay.resultsCount", { count: totalResults })}
            </p>
          )}
        </div>

        {/* Shortcuts — scrollable, shrinks to fit */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-auto">
          {filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-xs text-muted-foreground">{t("shortcutsOverlay.noResults")}</p>
              <p className="mt-1 text-[10px] text-muted-foreground/60">{t("shortcutsOverlay.noResultsHint")}</p>
            </div>
          ) : (
            filteredGroups.map((group) => (
              <div key={group.id}>
                <h3 className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </h3>
                <div className="space-y-0.5">
                  {group.shortcuts.map((s, idx) => (
                    <ShortcutItem key={idx} keys={s.keys} description={s.description} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border px-4 py-2 text-center">
          <p className="text-[10px] text-muted-foreground">{t("shortcutsOverlay.footer")}</p>
        </div>
      </div>
    </div>
  );
}

function ShortcutItem({ keys, description }: { keys: readonly string[]; description: string }) {
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
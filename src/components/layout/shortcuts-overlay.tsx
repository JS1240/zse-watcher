import { useEffect } from "react";
import { X } from "lucide-react";
import { useThemeStore } from "@/hooks/use-theme";

interface ShortcutsOverlayProps {
  onClose: () => void;
}

const SHORTCUTS = [
  {
    group: "Navigation",
    items: [
      { keys: ["1"], description: "Stocks" },
      { keys: ["2"], description: "Macro" },
      { keys: ["3"], description: "Heatmap" },
      { keys: ["4"], description: "Portfolio" },
      { keys: ["5"], description: "Dividends" },
      { keys: ["6"], description: "Alerts" },
    ],
  },
  {
    group: "App",
    items: [
      { keys: ["T"], description: "Toggle theme" },
      { keys: ["K"], description: "Command palette" },
      { keys: ["?"], description: "Show shortcuts" },
    ],
  },
  {
    group: "Stock Table",
    items: [
      { keys: ["Enter"], description: "Open stock detail" },
      { keys: ["Esc"], description: "Close drawer" },
      { keys: ["↑", "↓"], description: "Navigate rows" },
    ],
  },
];

export function ShortcutsOverlay({ onClose }: ShortcutsOverlayProps) {
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
          <h2 className="font-data text-sm font-bold text-foreground">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="rounded-sm p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Shortcuts */}
        <div className="p-4 space-y-4 max-h-[70vh] overflow-auto">
          {SHORTCUTS.map((group) => (
            <div key={group.group}>
              <h3 className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.group}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <div key={item.description} className="flex items-center justify-between py-1">
                    <span className="text-xs text-foreground/80">{item.description}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key) => (
                        <kbd
                          key={key}
                          className="inline-flex h-5 min-w-5 items-center justify-center rounded-sm bg-muted px-1.5 font-data text-[10px] font-semibold text-foreground shadow-sm ring-1 ring-inset ring-border/50"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="border-t border-border px-4 py-2 text-center">
          <p className="text-[10px] text-muted-foreground">Press <kbd className="inline-flex h-4 items-center rounded-sm bg-muted px-1 font-data text-[9px] font-semibold">Esc</kbd> or <kbd className="inline-flex h-4 items-center rounded-sm bg-muted px-1 font-data text-[9px] font-semibold">?</kbd> to close</p>
        </div>
      </div>
    </div>
  );
}

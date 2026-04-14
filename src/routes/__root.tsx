import { createRootRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { CommandPalette } from "@/components/layout/command-palette";
import { ShortcutsOverlay } from "@/components/layout/shortcuts-overlay";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { useThemeStore } from "@/hooks/use-theme";
import { useSelectedStock } from "@/hooks/use-selected-stock";
import { eventBus } from "@/lib/event-bus";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const navigate = useNavigate();
  const { toggle: toggleTheme } = useThemeStore();
  const { clear: clearSelection } = useSelectedStock();
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Tab shortcuts: 1-6
  useKeyboardShortcut({ key: "1", handler: () => navigate({ to: "/" }) });
  useKeyboardShortcut({ key: "2", handler: () => navigate({ to: "/macro" }) });
  useKeyboardShortcut({ key: "3", handler: () => navigate({ to: "/heatmap" }) });
  useKeyboardShortcut({ key: "4", handler: () => navigate({ to: "/portfolio" }) });
  useKeyboardShortcut({ key: "5", handler: () => navigate({ to: "/dividends" }) });
  useKeyboardShortcut({ key: "6", handler: () => navigate({ to: "/alerts" }) });
  useKeyboardShortcut({ key: "7", handler: () => navigate({ to: "/screener" }) });
  useKeyboardShortcut({ key: "8", handler: () => navigate({ to: "/watchlist" }) });
  useKeyboardShortcut({ key: "9", handler: () => navigate({ to: "/pricing" }) });

  // Theme toggle: T
  useKeyboardShortcut({ key: "t", handler: toggleTheme });

  // Shortcuts overlay: ?
  useKeyboardShortcut({ key: "?", shift: true, handler: () => setShowShortcuts(true) });

  // Command palette: Cmd+K / Ctrl+K
  useKeyboardShortcut({ key: "k", meta: true, handler: () => eventBus.emit("toggle-command-palette", undefined) });

  // Escape to close drawer / overlay
  useKeyboardShortcut({ key: "Escape", handler: () => {
    clearSelection();
    setShowShortcuts(false);
  }});

  return (
    <AppShell>
      <Outlet />
      <CommandPalette />
      {showShortcuts && <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />}
    </AppShell>
  );
}

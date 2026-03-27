import { createRootRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/app-shell";
import { CommandPalette } from "@/components/layout/command-palette";
import { useKeyboardShortcut } from "@/hooks/use-keyboard-shortcut";
import { useThemeStore } from "@/hooks/use-theme";
import { useSelectedStock } from "@/hooks/use-selected-stock";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const navigate = useNavigate();
  const { toggle: toggleTheme } = useThemeStore();
  const { clear: clearSelection } = useSelectedStock();

  // Tab shortcuts: 1-6
  useKeyboardShortcut({ key: "1", handler: () => navigate({ to: "/" }) });
  useKeyboardShortcut({ key: "2", handler: () => navigate({ to: "/macro" }) });
  useKeyboardShortcut({ key: "3", handler: () => navigate({ to: "/heatmap" }) });
  useKeyboardShortcut({ key: "4", handler: () => navigate({ to: "/portfolio" }) });
  useKeyboardShortcut({ key: "5", handler: () => navigate({ to: "/dividends" }) });
  useKeyboardShortcut({ key: "6", handler: () => navigate({ to: "/alerts" }) });

  // Theme toggle: T
  useKeyboardShortcut({ key: "t", handler: toggleTheme });

  // Escape to close drawer
  useKeyboardShortcut({ key: "Escape", handler: clearSelection });

  return (
    <AppShell>
      <Outlet />
      <CommandPalette />
    </AppShell>
  );
}

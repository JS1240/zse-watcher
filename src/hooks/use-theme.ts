import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ThemeMode } from "@/types/user";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "dark",
      setMode: (mode) => {
        set({ mode });
        applyTheme(mode);
      },
      toggle: () => {
        const next = get().mode === "dark" ? "light" : "dark";
        set({ mode: next });
        applyTheme(next);
      },
    }),
    {
      name: "zse-watcher-theme",
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.mode);
        }
      },
    },
  ),
);

function applyTheme(mode: ThemeMode): void {
  const root = document.documentElement;
  const resolved =
    mode === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : mode;

  root.classList.remove("dark", "light");
  root.classList.add(resolved);
}

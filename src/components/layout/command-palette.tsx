import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Command } from "cmdk";
import {
  Activity,
  BarChart3,
  Grid3X3,
  Wallet,
  CalendarDays,
  Bell,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import { useThemeStore } from "@/hooks/use-theme";
import { eventBus } from "@/lib/event-bus";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const { mode, toggle: toggleTheme } = useThemeStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const unsubscribe = eventBus.on("toggle-command-palette", () => {
      setOpen((prev) => !prev);
    });
    return unsubscribe;
  }, []);

  const navigateTo = (path: string) => {
    navigate({ to: path });
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Command dialog */}
      <Command
        className="relative w-full max-w-lg overflow-hidden rounded-lg border border-border bg-popover shadow-2xl"
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        <Command.Input
          placeholder={t("commandPalette.placeholder")}
          className="h-11 w-full border-b border-border bg-transparent px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />

        <Command.List className="max-h-72 overflow-y-auto p-2">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
            {t("commandPalette.noResults")}
          </Command.Empty>

          <Command.Group heading="Navigation" className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <CommandItem icon={Activity} label={t("nav.stocks")} shortcut="1" onSelect={() => navigateTo("/")} />
            <CommandItem icon={BarChart3} label={t("nav.macro")} shortcut="2" onSelect={() => navigateTo("/macro")} />
            <CommandItem icon={Grid3X3} label={t("nav.heatmap")} shortcut="3" onSelect={() => navigateTo("/heatmap")} />
            <CommandItem icon={Wallet} label={t("nav.portfolio")} shortcut="4" onSelect={() => navigateTo("/portfolio")} />
            <CommandItem icon={CalendarDays} label={t("nav.dividends")} shortcut="5" onSelect={() => navigateTo("/dividends")} />
            <CommandItem icon={Bell} label={t("nav.alerts")} shortcut="6" onSelect={() => navigateTo("/alerts")} />
            <CommandItem icon={Settings} label={t("nav.settings")} onSelect={() => navigateTo("/settings")} />
          </Command.Group>

          <Command.Separator className="my-1 h-px bg-border" />

          <Command.Group heading="Actions" className="px-2 py-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            <CommandItem
              icon={mode === "dark" ? Sun : Moon}
              label={mode === "dark" ? t("theme.light") : t("theme.dark")}
              shortcut="T"
              onSelect={() => { toggleTheme(); setOpen(false); }}
            />
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}

interface CommandItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  onSelect: () => void;
}

function CommandItem({ icon: Icon, label, shortcut, onSelect }: CommandItemProps) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground aria-selected:bg-accent"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="flex-1">{label}</span>
      {shortcut && (
        <kbd className="font-data text-[10px] text-muted-foreground">{shortcut}</kbd>
      )}
    </Command.Item>
  );
}

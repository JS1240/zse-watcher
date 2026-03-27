import { useEffect, useCallback } from "react";

interface ShortcutOptions {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  handler: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcut({
  key,
  ctrl = false,
  meta = false,
  shift = false,
  handler,
  enabled = true,
}: ShortcutOptions): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore shortcuts when typing in inputs
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      const metaMatch = meta ? event.metaKey || event.ctrlKey : true;
      const ctrlMatch = ctrl ? event.ctrlKey : true;
      const shiftMatch = shift ? event.shiftKey : !event.shiftKey;
      const keyMatch = event.key.toLowerCase() === key.toLowerCase();

      if (keyMatch && metaMatch && ctrlMatch && shiftMatch) {
        event.preventDefault();
        handler();
      }
    },
    [key, ctrl, meta, shift, handler, enabled],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}

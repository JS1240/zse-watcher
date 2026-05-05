import { useEffect, useRef } from "react";
import { AlertTriangle, X, Check } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  /**
   * Optional custom icon to display instead of the default AlertTriangle.
   * Useful for delete dialogs in context-specific features (alerts, watchlist, portfolio).
   */
  icon?: ReactNode;
  onConfirm: () => void;
  /**
   * Optional keyboard shortcuts hint text. If omitted, shows a localized hint via i18n.
   */
  shortcutsHint?: string;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel,
  variant = "danger",
  icon,
  onConfirm,
  shortcutsHint,
}: ConfirmationDialogProps) {
  const { t } = useTranslation("common");
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Resolve labels from i18n — callers can pass explicit labels or rely on defaults
  const resolvedConfirmLabel = confirmLabel ?? t("actions.confirm");
  const resolvedCancelLabel = cancelLabel ?? t("actions.cancel");

  // Focus management: ESC focuses cancel, ENTER focuses confirm
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      cancelRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
    } else if (e.key === "Enter") {
      e.preventDefault();
      onConfirm();
    }
  };

  if (!open) return null;

  const isDanger = variant === "danger";

  // Use custom icon if provided, otherwise fall back to AlertTriangle
  const displayIcon = icon ? (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center">{icon}</div>
  ) : (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        isDanger ? "bg-destructive/15" : "bg-amber-500/15"
      }`}
    >
      <AlertTriangle
        className={`h-4 w-4 ${isDanger ? "text-destructive" : "text-amber-500"}`}
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
    >
      <div
        className="mx-4 w-full max-w-sm rounded-lg border border-border bg-card p-4 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          {displayIcon}
          <div className="flex-1">
            <h3
              id="confirm-title"
              className="font-data text-sm font-semibold text-foreground"
            >
              {title}
            </h3>
            <p
              id="confirm-desc"
              className="mt-1 text-xs text-muted-foreground"
            >
              {description}
            </p>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button
            ref={cancelRef}
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            <X className="mr-1.5 h-3.5 w-3.5" />
            {resolvedCancelLabel}
          </Button>
          <Button
            ref={confirmRef}
            variant={isDanger ? "destructive" : "default"}
            size="sm"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            {resolvedConfirmLabel}
          </Button>
        </div>

        <p className="mt-2 text-center text-[9px] text-muted-foreground">
          {shortcutsHint ?? (
            <>
              <kbd className="rounded bg-muted px-1">{t("shortcuts.enter") || "Enter"}</kbd>{" "}
              {t("shortcuts.confirm") || "potvrdi"},{" "}
              <kbd className="rounded bg-muted px-1">{t("shortcuts.esc") || "Esc"}</kbd>{" "}
              {t("shortcuts.cancel") || "odustani"}
            </>
          )}
        </p>
      </div>
    </div>
  );
}
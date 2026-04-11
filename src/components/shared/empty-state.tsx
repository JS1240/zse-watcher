import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateVariant = "action" | "info" | "warning";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  hint?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: EmptyStateVariant;
  className?: string;
}

const variantClasses: Record<EmptyStateVariant, { container: string; icon: string }> = {
  action: {
    container: "bg-primary/5 ring-primary/20",
    icon: "text-primary",
  },
  info: {
    container: "bg-muted/60 ring-border",
    icon: "text-muted-foreground",
  },
  warning: {
    container: "bg-amber/5 ring-amber/20",
    icon: "text-amber",
  },
};

export function EmptyState({
  icon,
  title,
  description,
  hint,
  action,
  variant = "info",
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-8 px-4 text-center", className)}>
      {/* Icon container */}
      <div
        className={cn(
          "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ring-1 transition-colors",
          variantClasses[variant].container,
        )}
      >
        <div className={cn("transition-transform", variantClasses[variant].icon)}>{icon}</div>
      </div>

      {/* Title */}
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-foreground">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="mt-1.5 max-w-[280px] text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}

      {/* Action */}
      {action && (
        <Button
          size="sm"
          variant={variant === "action" ? "default" : "outline"}
          className="mt-4"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}

      {/* Hint pill */}
      {hint && (
        <p className="mt-3 max-w-[260px] rounded-md bg-muted/40 px-3 py-1.5 text-[10px] leading-relaxed text-muted-foreground ring-1 ring-border">
          💡 {hint}
        </p>
      )}
    </div>
  );
}

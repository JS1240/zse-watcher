import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Lightbulb } from "lucide-react";

type EmptyStateVariant = "action" | "info" | "warning" | "no-results";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  hint?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  /** variant 'no-results' shows a prominent action button for clearing filters/search */
  variant?: EmptyStateVariant;
  className?: string;
  /** Additional class for the icon wrapper div (e.g. 'h-10 w-10') */
  iconClassName?: string;
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
  "no-results": {
    container: "bg-muted/60 ring-border",
    icon: "text-muted-foreground",
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
  iconClassName,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-8 px-4 text-center animate-empty-state", className)}>
      {/* Icon container */}
      <div
        className={cn(
          "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ring-1 transition-colors",
          "animate-empty-icon",
          variantClasses[variant].container,
        )}
      >
        <div className={cn("transition-transform", variantClasses[variant].icon, iconClassName)}>{icon}</div>
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
          className={cn("mt-4", variant === "action" && "animate-cta-pulse")}
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}

      {/* Hint pill */}
      {hint && (
        <div className="mt-3 flex items-center gap-2 max-w-[260px] rounded-md bg-muted/40 px-3 py-1.5 text-[10px] leading-relaxed text-muted-foreground ring-1 ring-border">
          <Lightbulb className="h-3 w-3 shrink-0 text-amber" />
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
}

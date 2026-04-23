import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Lightbulb, ArrowRight } from "lucide-react";

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
  /** Keyboard shortcut to display next to the action button (e.g. 'N' for new, 'A' for add) */
  shortcut?: string;
  /** Optional quick start steps for new users - shows numbered step-by-step guide */
  steps?: {
    label: string;
    description?: string;
  }[];
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
  shortcut,
  steps,
  variant = "info",
  className,
  iconClassName,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-6 text-center",
        "animate-empty-state",
        className
      )}
    >
      {/* Icon container */}
      <div
        className={cn(
          "mb-5 flex h-20 w-20 items-center justify-center rounded-2xl ring-1 transition-colors",
          "animate-empty-icon",
          variantClasses[variant].container
        )}
      >
        <div className={cn("flex transition-transform", variantClasses[variant].icon, iconClassName)}>
          {icon}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-foreground">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}

      {/* Quick start steps */}
      {steps && steps.length > 0 && (
        <div className="mt-5 flex flex-col gap-2 w-full max-w-[260px] text-left">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex items-start gap-3 rounded-lg bg-muted/40 p-3 ring-1 ring-border"
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-relaxed text-foreground">
                  {step.label}
                </p>
                {step.description && (
                  <p className="mt-0.5 text-[10px] leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                )}
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="mt-1 h-3 w-3 shrink-0 text-muted-foreground/50" />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Action */}
      {action && (
        <div className="mt-4 flex items-center gap-2">
          <Button
            size="sm"
            variant={variant === "action" ? "default" : "outline"}
            className={cn(variant === "action" && "animate-cta-pulse")}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
          {/* Keyboard shortcut hint */}
          {shortcut && (
            <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-sans text-[8px]">{shortcut}</kbd>
              {variant === "action" ? "tipkovnica" : "keyboard"}
            </span>
          )}
        </div>
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

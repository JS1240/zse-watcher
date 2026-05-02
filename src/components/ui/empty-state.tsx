import { type ElementType, type ReactNode } from "react";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

export type EmptyStateVariant = "default" | "no-results" | "info" | "action";

interface Step {
  label: string;
  description: string;
}

interface Hint {
  shortcut: string;
  label: string;
}

interface EmptyStateProps {
  /** Icon to display (Lucide icon component or ReactNode) */
  icon?: ElementType | ReactNode;
  /** Main title */
  title: string;
  /** Optional description text */
  description?: string;
  /** Primary action button */
  action?: ReactNode;
  /** Secondary action link */
  actionLink?: ReactNode;
  /** Variant determines styling */
  variant?: EmptyStateVariant;
  /** Always-visible keyboard shortcut hint (e.g. "A", "/") */
  shortcut?: string;
  /** Step-by-step hints to guide users through a workflow */
  steps?: Step[];
  /** Inline hint pills with keyboard shortcuts */
  hints?: Hint[];
  /** Additional className */
  className?: string;
}

/**
 * Reusable empty state component for consistent UX across the app.
 * - default: centered icon with floating animation
 * - no-results: prominent clear action for filters returning nothing
 * - info: subtle informational state
 * - action: prominent CTA
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLink,
  variant = "default",
  shortcut,
  steps,
  hints,
  className,
}: EmptyStateProps) {
  const isNoResults = variant === "no-results";
  const isInfo = variant === "info";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-8 text-center",
        isNoResults && "rounded-md border border-dashed border-border bg-card/50",
        !isNoResults && !isInfo && "rounded-md border border-dashed border-border bg-card/30 p-6",
        className
      )}
    >
      {/* Icon with floating animation */}
      {Icon && (
        <div
          className={cn(
            "animate-empty-float mb-3 flex items-center justify-center",
            variant === "action" ? "h-16 w-16 rounded-full bg-primary/10" : "h-14 w-14"
          )}
        >
          {typeof Icon === "function" ? (
            <Icon
              className={cn(
                "text-muted-foreground",
                isNoResults
                  ? "h-10 w-10"
                  : isInfo
                    ? "h-6 w-6"
                    : "h-10 w-10 opacity-60"
              )}
              strokeWidth={1.5}
            />
          ) : (
            Icon
          )}
        </div>
      )}

      {/* Title */}
      <h3
        className={cn(
          "text-sm font-semibold text-foreground",
          isNoResults && "text-base",
          isInfo && "text-xs font-medium"
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            "mt-1.5 max-w-xs text-xs text-muted-foreground",
            isInfo && "mt-0.5"
          )}
        >
          {description}
        </p>
      )}

      {(action || actionLink) && (
        <div
          className={cn(
            "mt-4 flex flex-wrap items-center justify-center gap-2",
            isNoResults && "mt-3"
          )}
        >
          {action && <div>{action}</div>}
          {actionLink && <div className="text-xs">{actionLink}</div>}
        </div>
      )}

      {/* Step-by-step hints for guided empty states */}
      {steps && steps.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 rounded-md border border-dashed border-border/50 bg-muted/20 p-3 text-left">
          {steps.map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[10px] font-semibold text-primary">
                {i + 1}
              </span>
              <div>
                <span className="text-xs font-semibold text-foreground">{step.label}</span>
                <span className="ml-1 text-xs text-muted-foreground">— {step.description}</span>
              </div>
            </div>
          ))}
        </div>
      )}


      {/* Always-visible keyboard shortcut hint pill */}
      {shortcut && (
        <div className="mt-3 flex items-center justify-center gap-3 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-sans text-[8px]">{shortcut}</kbd>
            <span>{action ? "stvori alarm" : "pretraživanje"}</span>
          </span>
        </div>
      )}

      {/* Inline hint pills with keyboard shortcuts */}
      {hints && hints.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {hints.map((hint, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1 text-[9px] text-muted-foreground"
            >
              <Lightbulb className="h-2.5 w-2.5 text-amber-500/70" />
              <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">{hint.shortcut}</kbd>
              <span>{hint.label}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
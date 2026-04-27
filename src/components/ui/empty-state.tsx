import { type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type EmptyStateVariant = "default" | "no-results" | "info" | "action";

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

      {/* Actions */}
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
    </div>
  );
}
import { AlertCircle, RotateCcw, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title: string;
  description?: string;
  hint?: string;
  retry?: {
    onRetry: () => void;
    label?: string;
  };
  className?: string;
}

/**
 * ErrorState — displays error messages with optional retry action
 * Used when data fetches fail (API errors, network issues)
 */
export function ErrorState({
  title,
  description,
  hint,
  retry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-8 px-4 text-center animate-empty-state", className)}>
      {/* Icon container */}
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ring-1 bg-red-500/5 ring-red-500/20 animate-empty-icon">
        <AlertCircle className="h-7 w-7 text-red-500" />
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

      {/* Retry button */}
      {retry && (
        <Button
          size="sm"
          variant="outline"
          className="mt-4"
          onClick={retry.onRetry}
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          {retry.label || "Pokušaj ponovo"}
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
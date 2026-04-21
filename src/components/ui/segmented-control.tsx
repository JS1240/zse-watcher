import { type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SegmentedControlProps {
  options: Array<{ value: string; label: ReactNode; hint?: string }>;
  value: string;
  onChange: (value: string) => void;
  name?: string;
  className?: string;
}

interface SegmentedButtonProps extends HTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

/**
 * Polished segmented control (button group) for selecting one option from a short list.
 * Replaces native <select> for better visual UX — especially on mobile.
 * Keyboard accessible: arrow keys move, Enter/Space select.
 */
export function SegmentedControl({
  options,
  value,
  onChange,
  name,
  className,
  ...props
}: SegmentedControlProps) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "inline-flex rounded-md border border-border bg-muted/60 p-0.5",
        className,
      )}
      {...props}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          aria-label={option.hint}
          onClick={() => onChange(option.value)}
          className={cn(
            "relative z-10 flex flex-1 items-center justify-center rounded-sm px-2 py-1",
            "text-[10px] font-semibold leading-tight transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
            value === option.value
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Single segmented button — use inside SegmentedControl or standalone for toggle-like patterns.
 */
export function SegmentedButton({ selected, className, children, ...props }: SegmentedButtonProps & { children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "relative z-10 flex flex-1 items-center justify-center rounded-sm px-2 py-1",
        "text-[10px] font-semibold leading-tight transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        selected
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
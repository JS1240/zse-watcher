import { useState, useRef, memo } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef, ElementRef } from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<ComponentPropsWithoutRef<"select">, "onChange"> {
  options: SelectOption[];
  placeholder?: string;
  onChange?: (value: string) => void;
  error?: boolean;
}

export const Select = memo(function Select({
  options,
  placeholder = "Odaberi...",
  onChange,
  error,
  className,
  value,
  ...props
}: SelectProps) {
  const [focused, setFocused] = useState(false);
  const selectRef = useRef<ElementRef<"select">>(null);

  // Find selected option label
  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <div className="relative">
      <select
        ref={selectRef}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          "h-8 w-full appearance-none rounded-md border bg-transparent px-2.5 py-1 pr-8 text-[10px] font-medium transition-all",
          // Base styles
          "cursor-pointer text-foreground",
          // Border - conditionally show ring
          focused
            ? "border-ring ring-2 ring-ring ring-offset-1 ring-offset-background"
            : "border-border",
          // Error state
          error
            ? "border-destructive ring-destructive/30"
            : "hover:border-border/80",
          // Disabled
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {/* Custom chevron icon that stays visible */}
      <ChevronDown
        className={cn(
          "pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground transition-transform",
          focused && "rotate-180",
          selectedOption && "text-foreground"
        )}
      />
    </div>
  );
});

// Compact select variant for toolbars/filters - matches the design of other compact UI elements
interface SelectInputProps extends Omit<ComponentPropsWithoutRef<"select">, "onChange"> {
  options: SelectOption[];
  onChange?: (value: string) => void;
}

export function SelectInput({
  options,
  onChange,
  className,
  value,
  ...props
}: SelectInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className={cn(
          "inline-flex h-7 appearance-none items-center rounded-full border border-border bg-muted px-2.5 py-0.5 pr-7 text-[10px] font-medium transition-all",
          "cursor-pointer text-muted-foreground hover:border-border/80 hover:bg-muted/80 hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className={cn(
          "pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground transition-transform",
          focused && "rotate-180"
        )}
      />
    </div>
  );
}
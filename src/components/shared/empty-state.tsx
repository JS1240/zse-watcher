import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-10 px-4 text-center", className)}>
      <div className="mb-3 text-muted-foreground/40">{icon}</div>
      <h3 className="text-xs font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-[260px] text-[11px] text-muted-foreground">{description}</p>
      )}
      {action && (
        <Button size="sm" variant="outline" className="mt-3" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

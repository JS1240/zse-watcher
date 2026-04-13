import { cn } from "@/lib/utils";

interface TableSkeletonProps {
  /** Number of rows to display */
  rows?: number;
  /** Column configuration - either number or array of width percentages */
  columns?: number | { label: string; width?: string }[];
  /** Optional className */
  className?: string;
  /** Show table header row */
  showHeader?: boolean;
}

const defaultColumns = [
  { label: "Ticker", width: "w-[80px]" },
  { label: "Name", width: "w-[140px]" },
  { label: "Price", width: "w-[80px]" },
  { label: "Change", width: "w-[70px]" },
  { label: "Volume", width: "w-[70px]" },
];

function SkeletonCell({ width }: { width?: string }) {
  return <div className={cn("h-4 rounded-md bg-muted animate-pulse", width || "flex-1")} />;
}

export function TableSkeleton({
  rows = 8,
  columns = defaultColumns,
  className,
  showHeader = true,
}: TableSkeletonProps) {
  const columnConfig = Array.isArray(columns)
    ? columns
    : Array.from({ length: columns }, (_, i) => ({
        label: `Column ${i + 1}`,
        width: undefined,
      }));

  return (
    <div className={cn("w-full overflow-hidden rounded-lg border border-border bg-card", className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex items-center border-b border-border bg-muted/30 px-3 py-2">
          {columnConfig.map((col, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
                col.width || "flex-1",
              )}
            >
              {col.label}
            </div>
          ))}
        </div>
      )}

      {/* Rows */}
      <div className="divide-y divide-border/60">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div
            key={rowIdx}
            className="flex items-center px-3 py-2.5 transition-colors hover:bg-muted/20"
          >
            {columnConfig.map((col, colIdx) => (
              <div
                key={colIdx}
                className={cn("flex items-center px-1", col.width || "flex-1")}
              >
                <SkeletonCell width={col.width} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Compact single-line skeleton for inline table rows
 * Useful in drawers, cards, or compact lists
 */
export function TableRowSkeleton({
  columns = 5,
  className,
}: {
  columns?: number | { label: string; width?: string }[];
  className?: string;
}) {
  const columnConfig = Array.isArray(columns)
    ? columns
    : Array.from({ length: columns }, () => ({ width: undefined }));

  return (
    <div className={cn("flex items-center gap-3 px-3 py-2", className)}>
      {columnConfig.map((col, idx) => (
        <SkeletonCell key={idx} width={col.width} />
      ))}
    </div>
  );
}
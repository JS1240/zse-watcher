import { useCallback, useState } from "react";
import { toast } from "sonner";

interface UseClickCopyOptions {
  value: string;
  label?: string;
  formatForDisplay?: (value: string) => string;
}

/**
 * Click-to-copy hook for Copying values to clipboard.
 * Shows toast confirmation on success.
 * Used for tickers, prices, and other financial values.
 */
export function useClickCopy({ value, label, formatForDisplay }: UseClickCopyOptions) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = useCallback(async () => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      const displayValue = formatForDisplay ? formatForDisplay(value) : value;
      toast.success(label ? `${label}: ${displayValue}` : displayValue, {
        id: "click-copy",
        duration: 1200,
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Failed to copy", { id: "click-copy" });
    }
  }, [value, label, formatForDisplay]);

  return { copyToClipboard, copied };
}
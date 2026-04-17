import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface HighlightProps {
  text: string;
  highlight: string;
  className?: string;
}

/**
 * Highlights matching substrings within text.
 * Useful for search results where users need to see what matched.
 * 
 * @example
 * // Returns "ATPL" with background when highlight="AT"
 * <Highlight text="ATPL" highlight="AT" />
 */
export function Highlight({ text, highlight, className }: HighlightProps) {
  const parts = useMemo(() => {
    if (!highlight || !text) {
      return [{ text, match: false }];
    }

    const result: { text: string; match: boolean }[] = [];
    const lowerText = text.toLowerCase();
    const lowerHighlight = highlight.toLowerCase();
    let lastIndex = 0;
    let idx = lowerText.indexOf(lowerHighlight);

    while (idx !== -1) {
      // Push text before match
      if (idx > lastIndex) {
        result.push({ text: text.slice(lastIndex, idx), match: false });
      }
      // Push the match
      result.push({ text: text.slice(idx, idx + highlight.length), match: true });
      lastIndex = idx + highlight.length;
      idx = lowerText.indexOf(lowerHighlight, lastIndex);
    }

    // Push remaining text
    if (lastIndex < text.length) {
      result.push({ text: text.slice(lastIndex), match: false });
    }

    return result;
  }, [text, highlight]);

  if (!highlight || !text) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={cn("whitespace-pre-wrap", className)}>
      {parts.map((part, i) =>
        part.match ? (
          <mark
            key={i}
            className="rounded-sm bg-yellow-200 px-0.5 text-foreground dark:bg-yellow-400/30 dark:text-foreground"
          >
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </span>
  );
}
/**
 * Custom SVG illustrations for empty states.
 * Designed for Croatian retail investors — clean, professional, warm.
 * Replaces generic lucide icons with purpose-built SVGs.
 */

import { type ReactNode } from "react";

/** Chart-up illustration for watchlist empty state */
export function WatchlistEmptyIllustration({ className }: { className?: string }): ReactNode {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Background circle */}
      <circle cx="40" cy="40" r="36" className="fill-muted/40" />
      {/* Grid lines */}
      <line x1="16" y1="58" x2="64" y2="58" className="stroke-border" strokeWidth="1" strokeLinecap="round" />
      <line x1="16" y1="46" x2="64" y2="46" className="stroke-border" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 3" />
      <line x1="16" y1="34" x2="64" y2="34" className="stroke-border" strokeWidth="1" strokeLinecap="round" strokeDasharray="2 3" />
      {/* Stock chart line — trending up */}
      <polyline
        points="16,52 26,48 34,50 44,38 52,42 60,30 64,26"
        fill="none"
        className="stroke-primary"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dot on the peak */}
      <circle cx="64" cy="26" r="3" className="fill-primary" />
      {/* Small star overlay */}
      <path
        d="M64 18 L65.2 21.1 L68.5 21.4 L66.3 23.5 L67.1 26.8 L64 25.5 L60.9 26.8 L61.7 23.5 L59.5 21.4 L62.8 21.1 Z"
        className="fill-amber"
        transform="scale(0.5) translate(64, 20)"
      />
    </svg>
  );
}

/** Bar chart illustration for portfolio empty state */
export function PortfolioEmptyIllustration({ className }: { className?: string }): ReactNode {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Background circle */}
      <circle cx="40" cy="40" r="36" className="fill-muted/40" />
      {/* Horizontal axis */}
      <line x1="14" y1="62" x2="66" y2="62" className="stroke-border" strokeWidth="1.5" strokeLinecap="round" />
      {/* Bar 1 — short */}
      <rect x="18" y="48" width="10" height="14" rx="2" className="fill-primary/40" />
      {/* Bar 2 — medium */}
      <rect x="32" y="38" width="10" height="24" rx="2" className="fill-primary/60" />
      {/* Bar 3 — tall, highlighted */}
      <rect x="46" y="26" width="10" height="36" rx="2" className="fill-primary" />
      {/* Arrow trending up */}
      <path
        d="M48 22 L52 18 L54 20 L50 24 L48 22Z"
        className="fill-amber"
      />
    </svg>
  );
}

/** Sold-out illustration for when all portfolio positions are sold */
export function PortfolioSoldIllustration({ className }: { className?: string }): ReactNode {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Background circle */}
      <circle cx="40" cy="40" r="36" className="fill-muted/40" />
      {/* Empty bag outline */}
      <path
        d="M28 28 L28 50 Q28 58 40 58 Q52 58 52 50 L52 28 Z"
        fill="none"
        className="stroke-muted-foreground"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Bag handles */}
      <path
        d="M32 28 Q32 22 40 22 Q48 22 48 28"
        fill="none"
        className="stroke-muted-foreground"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* X mark over the bag */}
      <path
        d="M34 38 L46 50 M46 38 L34 50"
        className="stroke-destructive"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Magnifying glass illustration for no search results */
export function SearchEmptyIllustration({ className }: { className?: string }): ReactNode {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Background circle */}
      <circle cx="40" cy="40" r="36" className="fill-muted/40" />
      {/* Magnifying glass handle */}
      <path
        d="M54 54 L64 64"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        className="stroke-muted-foreground"
      />
      {/* Magnifying glass rim */}
      <circle
        cx="36"
        cy="36"
        r="16"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        className="stroke-muted-foreground"
      />
      {/* Question mark inside - indicating not found */}
      <text
        x="36"
        y="42"
        textAnchor="middle"
        fontSize="20"
        fontWeight="700"
        fontFamily="system-ui"
        className="fill-muted-foreground"
        style={{ fontFamily: 'var(--font-data), ui-monospace, monospace' }}
      >
        ?
      </text>
    </svg>
  );
}

/** Pie chart illustration for portfolio analytics empty state */
export function AnalyticsEmptyIllustration({ className }: { className?: string }): ReactNode {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Background circle */}
      <circle cx="40" cy="40" r="36" className="fill-muted/40" />
      {/* Pie chart outline */}
      <circle cx="40" cy="42" r="20" fill="none" className="stroke-border" strokeWidth="2" />
      {/* Slice indicators (empty pie) */}
      <line x1="40" y1="22" x2="40" y2="42" className="stroke-border" strokeWidth="1.5" />
      <line x1="40" y1="42" x2="58" y2="52" className="stroke-border" strokeWidth="1.5" />
      <line x1="40" y1="42" x2="22" y2="52" className="stroke-border" strokeWidth="1.5" />
      {/* Chart bars at bottom */}
      <rect x="16" y="66" width="6" height="6" rx="1" className="fill-primary/30" />
      <rect x="26" y="63" width="6" height="9" rx="1" className="fill-primary/50" />
      <rect x="36" y="60" width="6" height="12" rx="1" className="fill-primary/70" />
      <rect x="46" y="63" width="6" height="9" rx="1" className="fill-primary/50" />
      <rect x="56" y="66" width="6" height="6" rx="1" className="fill-primary/30" />
    </svg>
  );
}

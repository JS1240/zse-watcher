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

/** Stock list + chart illustration for stock table "no data" empty state */
export function StockListEmptyIllustration({ className }: { className?: string }): ReactNode {
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
      {/* Left panel — stock ticker rows */}
      <rect x="16" y="20" width="22" height="40" rx="3" className="fill-card" stroke="currentColor" strokeWidth="1.5" style={{ stroke: 'hsl(var(--border))' }} />
      {/* Ticker row 1 — active */}
      <rect x="19" y="23" width="10" height="4" rx="1" className="fill-primary/40" />
      <rect x="31" y="23" width="5" height="4" rx="1" className="fill-price-up/60" />
      {/* Ticker row 2 */}
      <rect x="19" y="30" width="10" height="4" rx="1" className="fill-primary/20" />
      <rect x="31" y="30" width="5" height="4" rx="1" className="fill-muted-foreground/30" />
      {/* Ticker row 3 */}
      <rect x="19" y="37" width="10" height="4" rx="1" className="fill-primary/20" />
      <rect x="31" y="37" width="5" height="4" rx="1" className="fill-price-down/50" />
      {/* Ticker row 4 */}
      <rect x="19" y="44" width="10" height="4" rx="1" className="fill-primary/20" />
      <rect x="31" y="44" width="5" height="4" rx="1" className="fill-primary/40" />
      {/* Ticker row 5 */}
      <rect x="19" y="51" width="10" height="4" rx="1" className="fill-primary/20" />
      <rect x="31" y="51" width="5" height="4" rx="1" className="fill-muted-foreground/30" />
      {/* Right panel — mini sparkline chart */}
      <rect x="42" y="20" width="22" height="40" rx="3" className="fill-card" stroke="currentColor" strokeWidth="1.5" style={{ stroke: 'hsl(var(--border))' }} />
      {/* Grid lines */}
      <line x1="45" y1="30" x2="62" y2="30" className="stroke-border" strokeWidth="0.75" strokeDasharray="2 2" />
      <line x1="45" y1="40" x2="62" y2="40" className="stroke-border" strokeWidth="0.75" strokeDasharray="2 2" />
      <line x1="45" y1="50" x2="62" y2="50" className="stroke-border" strokeWidth="0.75" strokeDasharray="2 2" />
      {/* Stock price line */}
      <polyline
        points="45,54 49,50 53,52 57,44 60,47 63,40"
        fill="none"
        className="stroke-primary"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Peak dot */}
      <circle cx="63" cy="40" r="2.5" className="fill-primary" />
      {/* Star accent — watchlist indicator */}
      <path
        d="M50 22 L51 24.5 L53.8 24.5 L51.7 26.2 L52.4 29 L50 27.5 L47.6 29 L48.3 26.2 L46.2 24.5 L49 24.5 Z"
        className="fill-amber"
        transform="scale(0.6) translate(40, 8)"
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

/** Bell notification illustration for alerts empty state */
export function AlertEmptyIllustration({ className }: { className?: string }): ReactNode {
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
      {/* Bell body */}
      <path
        d="M40 20 C32 20 26 26 26 34 L26 48 C26 52 30 56 40 56 C50 56 54 52 54 48 L54 34 C54 26 48 20 40 20Z"
        fill="none"
        className="stroke-muted-foreground"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Bell top clapper */}
      <path
        d="M34 20 C34 16 36 14 40 14 C44 14 46 16 46 20"
        fill="none"
        className="stroke-muted-foreground"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Bell ring indicators — dashed lines suggesting notification */}
      <line x1="24" y1="30" x2="28" y2="26" className="stroke-muted-foreground/40" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="56" y1="30" x2="52" y2="26" className="stroke-muted-foreground/40" strokeWidth="1.5" strokeLinecap="round" />
      {/* Small dot — the "notification" indicator */}
      <circle cx="52" cy="22" r="4" className="fill-amber" />
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

/** Heatmap grid illustration for market overview empty state */
export function HeatmapEmptyIllustration({ className }: { className?: string }): ReactNode {
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
      {/* Grid cells — representing sector heatmap */}
      <rect x="16" y="20" width="14" height="12" rx="2" className="fill-primary/30" />
      <rect x="33" y="20" width="14" height="12" rx="2" className="fill-primary/20" />
      <rect x="50" y="20" width="14" height="12" rx="2" className="fill-primary/40" />
      <rect x="16" y="35" width="14" height="12" rx="2" className="fill-primary/20" />
      <rect x="33" y="35" width="14" height="12" rx="2" className="fill-primary/50" />
      <rect x="50" y="35" width="14" height="12" rx="2" className="fill-primary/20" />
      <rect x="16" y="50" width="14" height="12" rx="2" className="fill-primary/40" />
      <rect x="33" y="50" width="14" height="12" rx="2" className="fill-primary/30" />
      <rect x="50" y="50" width="14" height="12" rx="2" className="fill-primary/20" />
      {/* Empty state indicator */}
      <line x1="28" y1="56" x2="52" y2="32" className="stroke-destructive" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="52" y1="56" x2="28" y2="32" className="stroke-destructive" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** Newspaper illustration for news feed empty state */
export function NewsEmptyIllustration({ className }: { className?: string }): ReactNode {
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
      {/* Newspaper outline */}
      <rect x="18" y="22" width="44" height="36" rx="3" className="fill-card" stroke="currentColor" strokeWidth="2" style={{ stroke: 'hsl(var(--border))' }} />
      {/* Newspaper header bar */}
      <rect x="22" y="26" width="36" height="6" rx="1" className="fill-primary/30" />
      {/* Article lines */}
      <rect x="22" y="36" width="36" height="3" rx="1" className="fill-border" />
      <rect x="22" y="42" width="28" height="3" rx="1" className="fill-border" />
      <rect x="22" y="48" width="32" height="3" rx="1" className="fill-border" />
      <rect x="22" y="54" width="20" height="3" rx="1" className="fill-border" />
    </svg>
  );
}

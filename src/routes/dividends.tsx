import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUp, Keyboard } from "lucide-react";
import { MarketStatus } from "@/features/market/components/market-status";
import { ShortcutsOverlay } from "@/components/layout/shortcuts-overlay";
import { DividendsCalendar } from "@/features/dividends/components/dividends-calendar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dividends")({
  component: DividendsPage,
});

function DividendsPage() {
  const { t: tc } = useTranslation("common");
  const [scrollTop, setScrollTop] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      ref={contentRef}
      onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop > 200)}
      className="flex h-full flex-col gap-3 overflow-auto p-4"
    >
      <h1 className="font-data text-lg font-bold">{tc("nav.dividends")}</h1>
      <DividendsCalendar />

      {/* Always-visible keyboard shortcuts hint for discoverability - consistent with stocks/watchlist/portfolio pattern */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-sm border border-border/50 bg-muted/30 px-3 py-1.5 text-[9px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <MarketStatus />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">?</kbd>
            <span>{tc("shortcut.shortcuts") || "prečaci"}</span>
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">T</kbd>
            <span>{tc("shortcut.theme") || "tema"}</span>
          </span>
          <button
            onClick={() => setShowShortcuts(true)}
            className="flex items-center gap-1 hover:text-foreground"
          >
            <Keyboard className="h-2.5 w-2.5" />
            <span className="text-[9px]">{tc("shortcuts.showAll") || "svi prečaci"}</span>
          </button>
        </div>
      </div>

      {showShortcuts && <ShortcutsOverlay onClose={() => setShowShortcuts(false)} />}

      {/* Scroll to top button */}
      <button
        onClick={scrollToTop}
        aria-label={tc("scrollToTop")}
        title={tc("scrollToTop")}
        className={cn(
          "fixed bottom-20 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:bottom-6",
          scrollTop ? "opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2"
        )}
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </div>
  );
}

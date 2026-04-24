import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUp } from "lucide-react";
import { DividendsCalendar } from "@/features/dividends/components/dividends-calendar";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dividends")({
  component: DividendsPage,
});

function DividendsPage() {
  const { t: _t } = useTranslation("common");
  const { t: tc } = useTranslation("common");
  const [scrollTop, setScrollTop] = useState(false);
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

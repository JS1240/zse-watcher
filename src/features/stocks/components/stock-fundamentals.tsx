import { useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Newspaper, HelpCircle, Check } from "lucide-react";
import { PerformanceBar } from "@/components/shared/performance-bar";
import { toast } from "sonner";
import { useNews } from "@/features/news/api/news-queries";
import { ArticleDrawer } from "@/features/news/components/article-drawer";
import { EmptyState } from "@/components/shared/empty-state";
import { NewsEmptyIllustration } from "@/components/shared/empty-illustrations";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { formatPrice, formatMarketCap } from "@/lib/formatters";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { StockDetail } from "@/types/stock";
import type { NewsArticle } from "@/types/news";

interface StockFundamentalsProps {
  stock: StockDetail;
}

export function StockFundamentals({ stock }: StockFundamentalsProps) {
  const { t } = useTranslation("stocks");
  const { t: tc } = useTranslation("common");
  const { data: allNews, isLoading: isNewsLoading } = useNews();
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  // Click-to-copy state for metric values
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Copy value to clipboard with toast feedback
  const handleCopy = useCallback(async (field: string, value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    toast.success(tc("toast.copied", { value: label }) || `${label} kopiran`);
    setTimeout(() => setCopiedField(null), 1500);
  }, [tc]);
  const relatedNews = allNews
    ? allNews.filter((a) => a.ticker === stock.ticker).slice(0, 5)
    : [];

  // 52-week range bar position
  const rangeWidth = stock.high52w - stock.low52w;
  const pricePosition = rangeWidth > 0
    ? ((stock.price - stock.low52w) / rangeWidth) * 100
    : 50;

  return (
    <>
      <div className="space-y-4">
        {/* Investment Summary — quick at-a-glance quality signals for Croatian retail investors */}
        <div>
          <h4 className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("summary.title") || "Sažetak"}
          </h4>
          <div className="rounded-md border border-border bg-card p-3 space-y-2.5">
            <div className="grid grid-cols-3 gap-3">
              {/* Dividend Yield quality */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  {t("summary.dividendYield") || "Dividenda"}
                </span>
                <div className="flex items-center gap-1.5">
                  <PerformanceBar
                    value={stock.dividendYield ?? 0}
                    baseline={0}
                    ceiling={10}
                    floor={0}
                    showValue={false}
                    compact
                    colorMode="positive"
                    ariaLabel={stock.dividendYield != null ? `${stock.dividendYield.toFixed(2)}% dividend yield` : "No dividend data"}
                  />
                  <span className={cn(
                    "font-data text-[11px] font-semibold tabular-nums",
                    (stock.dividendYield ?? 0) >= 4 ? "text-emerald-500" :
                    (stock.dividendYield ?? 0) >= 2 ? "text-amber-500" : "text-muted-foreground"
                  )}>
                    {stock.dividendYield != null ? `${stock.dividendYield.toFixed(1)}%` : "—"}
                  </span>
                </div>
                <span className={cn(
                  "text-[9px] font-medium",
                  (stock.dividendYield ?? 0) >= 4 ? "text-emerald-600 dark:text-emerald-400" :
                  (stock.dividendYield ?? 0) >= 2 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground/60"
                )}>
                  {(stock.dividendYield ?? 0) >= 4 ? t("summary.yieldHigh") :
                   (stock.dividendYield ?? 0) >= 2 ? t("summary.yieldMedium") : t("summary.yieldLow")}
                </span>
              </div>

              {/* P/E ratio vs market */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  {t("summary.peRatio") || "P/E"}
                </span>
                <div className="flex items-center gap-1.5">
                  <PerformanceBar
                    value={stock.peRatio ?? 0}
                    baseline={0}
                    ceiling={30}
                    floor={0}
                    showValue={false}
                    compact
                    colorMode="neutral"
                    ariaLabel={stock.peRatio != null ? `P/E ratio ${stock.peRatio.toFixed(1)}` : "No P/E data"}
                  />
                  <span className={cn(
                    "font-data text-[11px] font-semibold tabular-nums",
                    (stock.peRatio ?? 0) < 15 ? "text-emerald-500" :
                    (stock.peRatio ?? 0) < 25 ? "text-amber-500" : "text-red-500"
                  )}>
                    {stock.peRatio != null ? stock.peRatio.toFixed(1) : "—"}
                  </span>
                </div>
                <span className={cn(
                  "text-[9px] font-medium",
                  (stock.peRatio ?? 0) < 15 ? "text-emerald-600 dark:text-emerald-400" :
                  (stock.peRatio ?? 0) < 25 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"
                )}>
                  {(stock.peRatio ?? 0) < 15 ? t("summary.peAttractive") :
                   (stock.peRatio ?? 0) < 25 ? t("summary.peFair") : t("summary.peExpensive")}
                </span>
              </div>

              {/* 52w range zone */}
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground">
                  {t("summary.range52w") || "52W raspon"}
                </span>
                <div className="flex items-center gap-1.5">
                  <PerformanceBar
                    value={stock.price}
                    baseline={stock.low52w}
                    ceiling={stock.high52w}
                    floor={stock.low52w}
                    showValue={false}
                    compact
                    colorMode="auto"
                    ariaLabel={`52-week range: current price at ${pricePosition.toFixed(0)}%`}
                  />
                  <span className={cn(
                    "font-data text-[11px] font-semibold tabular-nums",
                    pricePosition < 30 ? "text-emerald-500" :
                    pricePosition > 70 ? "text-red-500" : "text-amber-500"
                  )}>
                    {pricePosition.toFixed(0)}%
                  </span>
                </div>
                <span className={cn(
                  "text-[9px] font-medium",
                  pricePosition < 30 ? "text-emerald-600 dark:text-emerald-400" :
                  pricePosition > 70 ? "text-red-600 dark:text-red-400" : "text-amber-600 dark:text-amber-400"
                )}>
                  {pricePosition < 30 ? t("summary.nearLow") :
                   pricePosition > 70 ? t("summary.nearHigh") : t("summary.midRange")}
                </span>
              </div>
            </div>

            {/* Combined signal badge */}
            <div className="pt-1.5 border-t border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {t("summary.overallSignal") || "Signal"}
                </span>
                <span className={cn(
                  "rounded px-2 py-0.5 text-[10px] font-semibold",
                  getOverallSignal(stock.dividendYield ?? 0, stock.peRatio ?? 0, pricePosition) === "buy" && "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
                  getOverallSignal(stock.dividendYield ?? 0, stock.peRatio ?? 0, pricePosition) === "hold" && "bg-amber-500/20 text-amber-600 dark:text-amber-400",
                  getOverallSignal(stock.dividendYield ?? 0, stock.peRatio ?? 0, pricePosition) === "sell" && "bg-red-500/20 text-red-600 dark:text-red-400"
                )}>
                  {getOverallSignal(stock.dividendYield ?? 0, stock.peRatio ?? 0, pricePosition) === "buy" && t("summary.signalBuy")}
                  {getOverallSignal(stock.dividendYield ?? 0, stock.peRatio ?? 0, pricePosition) === "hold" && t("summary.signalHold")}
                  {getOverallSignal(stock.dividendYield ?? 0, stock.peRatio ?? 0, pricePosition) === "sell" && t("summary.signalSell")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {stock.description && (
          <div>
            <h4 className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("detail.description")}
            </h4>
            <p className="text-xs leading-relaxed text-foreground/80">
              {stock.description}
            </p>
          </div>
        )}

        {/* Key metrics grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetricItem
            label={t("detail.marketCap")}
            value={stock.marketCapM != null && stock.marketCapM > 0 ? formatMarketCap(stock.marketCapM) : "N/A"}
            tooltip={t("detail.marketCapTooltip")}
            copyValue={stock.marketCapM != null && stock.marketCapM > 0 ? stock.marketCapM.toFixed(2) : undefined}
            copyField="marketCap"
            onCopy={handleCopy}
            copiedField={copiedField}
            t={t}
          />
          <MetricItem
            label={t("detail.pe")}
            value={stock.peRatio !== null ? stock.peRatio.toFixed(1) : "N/A"}
            tooltip={t("detail.peTooltip")}
            copyValue={stock.peRatio !== null ? stock.peRatio.toFixed(1) : undefined}
            copyField="peRatio"
            onCopy={handleCopy}
            copiedField={copiedField}
            t={t}
            barValue={stock.peRatio ?? undefined}
            barCeiling={30}
            barFloor={0}
            barColorMode="neutral"
          />
          <MetricItem
            label={t("detail.dividendYield")}
            value={stock.dividendYield !== null ? `${stock.dividendYield.toFixed(2)}%` : "N/A"}
            tooltip={t("detail.dividendYieldTooltip")}
            copyValue={stock.dividendYield !== null ? stock.dividendYield.toFixed(2) : undefined}
            copyField="dividendYield"
            onCopy={handleCopy}
            copiedField={copiedField}
            t={t}
            barValue={stock.dividendYield ?? undefined}
            barCeiling={10}
            barFloor={0}
            barColorMode="positive"
          />
          <MetricItem
            label={t("detail.shares")}
            value={stock.sharesM > 0 ? `${stock.sharesM.toFixed(1)}M` : "N/A"}
            tooltip={t("detail.sharesTooltip")}
            copyValue={stock.sharesM > 0 ? stock.sharesM.toFixed(1) : undefined}
            copyField="sharesM"
            onCopy={handleCopy}
            copiedField={copiedField}
            t={t}
          />
          <MetricItem
            label={t("detail.founded")}
            value={stock.founded || "N/A"}
            tooltip={t("detail.foundedTooltip")}
            copyValue={stock.founded || undefined}
            copyField="founded"
            onCopy={handleCopy}
            copiedField={copiedField}
            t={t}
          />
          <MetricItem
            label={t("detail.isin")}
            value={stock.isin}
            mono
            tooltip={t("detail.isinTooltip")}
            copyValue={stock.isin}
            copyField="isin"
            onCopy={handleCopy}
            copiedField={copiedField}
            t={t}
          />
        </div>

        {/* Interactive 52-week range bar */}
        <RangeBar
          low={stock.low52w}
          high={stock.high52w}
          price={stock.price}
          changePct={stock.changePct}
          pricePosition={pricePosition}
          ticker={stock.ticker}
        />

        {/* Related news */}
        <div>
          <h4 className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("fundamentals.relatedNews")}
          </h4>
          {isNewsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-2 w-24 animate-shimmer" />
              <div className="space-y-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex w-full items-start justify-between gap-2 rounded-sm border border-border/50 bg-card px-2 py-1.5"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <Skeleton className="h-3 w-4/5 animate-shimmer" />
                      <Skeleton className="h-2 w-1/3 animate-shimmer" />
                    </div>
                    <Skeleton className="h-3 w-3 shrink-0 animate-shimmer" />
                  </div>
                ))}
              </div>
            </div>
          ) : relatedNews.length > 0 ? (
            <div className="space-y-1.5">
              {relatedNews.map((article) => (
                <button
                  key={article.id}
                  onClick={() => setSelectedArticle(article)}
                  className="group flex w-full items-start justify-between gap-2 rounded-sm border border-border/50 bg-card px-2 py-1.5 text-left transition-colors hover:border-border hover:bg-accent/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-[10px] font-medium text-foreground group-hover:text-primary">
                      {article.title}
                    </p>
                    <p className="text-[9px] text-muted-foreground">
                      {formatDate(article.publishedAt)} · {article.source}
                    </p>
                  </div>
                  <Newspaper className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/50" />
                </button>
              ))}
            </div>
          ) : (
            <div className="rounded-sm border border-border/50 bg-card py-4">
              <EmptyState
                icon={<NewsEmptyIllustration className="h-10 w-10" />}
                title={t("empty.noNews")}
                description={t("empty.noNewsDescription")}
              />
            </div>
          )}
        </div>
      </div>

      <ArticleDrawer
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </>
  );
}

function MetricItem({
  label,
  value,
  mono,
  tooltip,
  copyValue,
  copyField,
  onCopy,
  copiedField,
  t: translate,
  barValue,
  barCeiling,
  barFloor = 0,
  barColorMode = "auto",
}: {
  label: string;
  value: string;
  mono?: boolean;
  tooltip?: string;
  copyValue?: string;
  copyField?: string;
  onCopy?: (field: string, value: string, label: string) => void;
  copiedField?: string | null;
  t?: (key: string) => string;
  /** Numeric value for optional PerformanceBar overlay */
  barValue?: number;
  /** Ceiling for PerformanceBar (max in range) */
  barCeiling?: number;
  /** Floor for PerformanceBar (min in range) */
  barFloor?: number;
  /** Color mode for PerformanceBar */
  barColorMode?: "auto" | "positive" | "negative" | "neutral";
}) {
  const isCopied = copyField && copiedField === copyField;
  const t = translate ?? ((k: string) => k);

  const handleClick = useCallback(() => {
    if (copyValue && copyField && onCopy) {
      onCopy(copyField, copyValue, label);
    }
  }, [copyValue, copyField, onCopy, label]);

  if (tooltip || copyValue) {
    const canCopy = !!copyValue && !!onCopy;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              canCopy && "cursor-pointer transition-colors hover:bg-muted/50 rounded px-1 -mx-1",
              isCopied && "bg-emerald-500/10 -mx-1 rounded px-1"
            )}
            onClick={handleClick}
          >
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              {label}
              {tooltip && <HelpCircle className="h-3 w-3 text-muted-foreground/50" />}
              {canCopy && !tooltip && (
                <span className="text-[8px] text-muted-foreground/50">{t("fundamentals.clickToCopy")}</span>
              )}
            </span>
            <div
              className={cn(
                "text-xs font-medium text-foreground",
                mono && "font-data",
                isCopied && "text-emerald-600 dark:text-emerald-400"
              )}
            >
              {isCopied ? (
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3" />
                  {t("fundamentals.copied")}
                </span>
              ) : (
                value
              )}
            </div>
            {/* Performance bar overlay — shows relative position/range */}
            {barValue !== undefined && barCeiling !== undefined && (
              <div className="mt-1.5">
                <PerformanceBar
                  value={barValue}
                  baseline={barFloor}
                  ceiling={barCeiling}
                  floor={barFloor}
                  showValue={false}
                  compact
                  colorMode={barColorMode}
                  ariaLabel={`${label}: ${value}`}
                />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div>
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <div
        className={cn(
          "text-xs font-medium text-foreground",
          mono && "font-data",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function getOverallSignal(dividendYield: number, peRatio: number, pricePosition: number): "buy" | "hold" | "sell" {
  // Simple signal logic based on dividend yield, P/E, and 52w range position
  // CROBEX stocks typically range 2-8% dividend yield and 8-20 P/E
  let score = 0;
  if (dividendYield >= 4) score += 2;
  else if (dividendYield >= 2) score += 1;
  if (peRatio > 0 && peRatio < 15) score += 1;
  else if (peRatio >= 25) score -= 1;
  if (pricePosition < 30) score += 1;
  else if (pricePosition > 70) score -= 1;
  if (score >= 2) return "buy";
  if (score <= -1) return "sell";
  return "hold";
}

interface RangeBarProps {
  low: number;
  high: number;
  price: number;
  changePct: number;
  pricePosition: number;
  ticker: string;
}

function RangeBar({ low, high, price, changePct, pricePosition, ticker }: RangeBarProps) {
  const { t } = useTranslation("stocks");
  const barRef = useRef<HTMLDivElement>(null);
  const [hoverPct, setHoverPct] = useState<number | null>(null);
  const [hoverLabel, setHoverLabel] = useState<string>("");

  const rangeWidth = high - low;


  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current || rangeWidth <= 0) return;
    const rect = barRef.current.getBoundingClientRect();
    const pct = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1) * 100;
    const targetPrice = low + (pct / 100) * rangeWidth;
    const fromCurrent = targetPrice - price;
    const fromCurrentPct = (fromCurrent / price) * 100;

    setHoverPct(pct);
    setHoverLabel(`${formatPrice(targetPrice)} (${fromCurrentPct >= 0 ? '+' : ''}${fromCurrentPct.toFixed(1)}%)`);
  }, [low, rangeWidth, price]);

  const handleMouseLeave = useCallback(() => {
    setHoverPct(null);
    setHoverLabel("");
  }, []);

  const priceZone = pricePosition < 20 ? 'buy' : pricePosition > 80 ? 'sell' : 'mid';
  const zoneLabel = priceZone === 'buy' ? t('range.buyZone') : priceZone === 'sell' ? t('range.sellZone') : t('range.midZone');

  return (
    <div>
      <h4 className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
        {t("fundamentals.range52w")}
      </h4>
      <div className="space-y-1.5">
        {/* Price labels */}
        <div className="flex justify-between font-data text-[10px] tabular-nums text-muted-foreground">
          <span>{formatPrice(low)}</span>
          <span className="text-[9px] text-primary/70">{t("fundamentals.week52")}</span>
          <span>{formatPrice(high)}</span>
        </div>

        {/* Interactive bar */}
        <div
          ref={barRef}
          className="relative h-3 cursor-crosshair rounded-full bg-muted/60 overflow-hidden select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          aria-label={`52-week range for ${ticker}: ${formatPrice(low)} to ${formatPrice(high)}, current price ${formatPrice(price)}`}
        >
          {/* Gradient background */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: 'linear-gradient(90deg, hsl(var(--color-price-down)) 0%, hsl(var(--color-muted-foreground) / 0.2) 50%, hsl(var(--color-price-up)) 100%)'
            }}
          />

          {/* Hover indicator */}
          {hoverPct !== null && (
            <div
              className="absolute top-0 h-3 w-0.5 rounded-full bg-foreground/60"
              style={{ left: `${hoverPct}%` }}
            />
          )}

          {/* Position indicator */}
          <div
            className="absolute top-0 h-3 rounded-full bg-primary/40"
            style={{
              width: `${Math.min(Math.max(pricePosition, 2), 98)}%`,
              boxShadow: '0 0 6px hsl(var(--color-primary) / 0.3)'
            }}
          />

          {/* Current price marker */}
          <div
            className="absolute top-0 h-3 w-1 rounded-full bg-foreground shadow-lg"
            style={{ left: `${Math.min(Math.max(pricePosition, 0.5), 99.5)}%` }}
          />

          {/* Hover tooltip */}
          {hoverPct !== null && hoverLabel && (
            <div
              className="absolute -top-6 z-10 rounded border border-border bg-popover px-1.5 py-0.5 font-data text-[9px] text-popover-foreground shadow-md"
              style={{ left: `${Math.min(hoverPct, 85)}%`, transform: 'translateX(-50%)' }}
            >
              {hoverLabel}
            </div>
          )}
        </div>


        {/* Current price row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-data text-[10px] text-foreground">
            <span>
              {changePct > 0 ? '↑' : changePct < 0 ? '↓' : '→'} {formatPrice(price)} EUR
            </span>
            <span
              className={cn(
                "rounded px-1 py-0.5 text-[9px] font-semibold",
                priceZone === 'buy' && "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
                priceZone === 'sell' && "bg-red-500/20 text-red-600 dark:text-red-400",
                priceZone === 'mid' && "bg-muted text-muted-foreground"
              )}
            >
              {zoneLabel}
            </span>
          </div>
          <div className={cn(
            "font-data text-[10px] font-medium",
            changePct > 0 ? "text-price-up" : changePct < 0 ? "text-price-down" : "text-muted-foreground"
          )}>
            {changePct > 0 ? '+' : ''}{changePct.toFixed(2)}%
          </div>
        </div>
      </div>
    </div>
  );
}

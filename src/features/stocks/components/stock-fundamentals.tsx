import { useTranslation } from "react-i18next";
import { ExternalLink } from "lucide-react";
import { useNews } from "@/features/news/api/news-queries";
import { formatPrice, formatMarketCap } from "@/lib/formatters";
import { formatDate } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import type { StockDetail } from "@/types/stock";

interface StockFundamentalsProps {
  stock: StockDetail;
}

export function StockFundamentals({ stock }: StockFundamentalsProps) {
  const { t } = useTranslation("stocks");
  const { data: allNews } = useNews();
  const relatedNews = allNews
    ? allNews.filter((a) => a.ticker === stock.ticker).slice(0, 5)
    : [];

  // 52-week range bar position
  const rangeWidth = stock.high52w - stock.low52w;
  const pricePosition = rangeWidth > 0
    ? ((stock.price - stock.low52w) / rangeWidth) * 100
    : 50;

  return (
    <div className="space-y-4">
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
          value={stock.marketCapM > 0 ? formatMarketCap(stock.marketCapM) : "N/A"}
        />
        <MetricItem
          label={t("detail.pe")}
          value={stock.peRatio !== null ? stock.peRatio.toFixed(1) : "N/A"}
        />
        <MetricItem
          label={t("detail.dividendYield")}
          value={stock.dividendYield !== null ? `${stock.dividendYield.toFixed(2)}%` : "N/A"}
        />
        <MetricItem
          label={t("detail.shares")}
          value={stock.sharesM > 0 ? `${stock.sharesM.toFixed(1)}M` : "N/A"}
        />
        <MetricItem
          label={t("detail.founded")}
          value={stock.founded || "N/A"}
        />
        <MetricItem
          label={t("detail.isin")}
          value={stock.isin}
          mono
        />
      </div>

      {/* 52-week range bar */}
      <div>
        <h4 className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          52-Week Range
        </h4>
        <div className="space-y-1">
          <div className="flex justify-between font-data text-[10px] tabular-nums text-muted-foreground">
            <span>{formatPrice(stock.low52w)}</span>
            <span>{formatPrice(stock.high52w)}</span>
          </div>
          <div className="relative h-2 rounded-full bg-muted">
            <div
              className="absolute top-0 h-2 rounded-full bg-primary"
              style={{ width: `${Math.min(Math.max(pricePosition, 2), 98)}%` }}
            />
            <div
              className="absolute -top-0.5 h-3 w-0.5 rounded-full bg-foreground"
              style={{ left: `${Math.min(Math.max(pricePosition, 1), 99)}%` }}
            />
          </div>
          <div className="text-center font-data text-[10px] text-foreground">
            {formatPrice(stock.price)} EUR
          </div>
        </div>
      </div>

      {/* Related news */}
      {relatedNews.length > 0 && (
        <div>
          <h4 className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            Latest News
          </h4>
          <div className="space-y-1.5">
            {relatedNews.map((article) => (
              <a
                key={article.id}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start justify-between gap-2 rounded-sm border border-border/50 bg-card px-2 py-1.5 hover:border-border hover:bg-accent/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-[10px] font-medium text-foreground group-hover:text-primary">
                    {article.title}
                  </p>
                  <p className="text-[9px] text-muted-foreground">
                    {formatDate(article.publishedAt)} · {article.source}
                  </p>
                </div>
                <ExternalLink className="mt-0.5 h-2.5 w-2.5 shrink-0 text-muted-foreground/50" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
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

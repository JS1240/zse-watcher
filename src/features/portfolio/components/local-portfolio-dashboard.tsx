import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus } from "lucide-react";
import { useLocalTransactions } from "@/features/portfolio/hooks/use-local-transactions";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { AddPositionForm } from "@/features/portfolio/components/add-position-form";
import { Button } from "@/components/ui/button";
import { ChangeBadge } from "@/components/shared/change-badge";
import { formatPrice, formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/utils";

export function LocalPortfolioDashboard() {
  const { t } = useTranslation("portfolio");
  const { transactions, hasLocalTransactions } = useLocalTransactions();
  const { data: stocksResult } = useStocksLive();
  const stocks = stocksResult?.stocks ?? null;
  const [showAddForm, setShowAddForm] = useState(false);

  // Calculate holdings from local transactions
  const holdingsMap = new Map<string, { totalShares: number; totalCost: number; name: string }>();

  for (const tx of transactions) {
    const stock = stocks?.find((s) => s.ticker === tx.ticker);
    const current = holdingsMap.get(tx.ticker) ?? {
      totalShares: 0,
      totalCost: 0,
      name: stock?.name ?? tx.ticker,
    };

    if (tx.transactionType === "buy") {
      current.totalShares += tx.shares;
      current.totalCost += tx.totalAmount;
    } else if (tx.transactionType === "sell") {
      current.totalShares -= tx.shares;
      current.totalCost -= tx.shares * (current.totalCost / (current.totalShares + tx.shares));
    }

    holdingsMap.set(tx.ticker, current);
  }

  const enrichedHoldings = Array.from(holdingsMap.entries())
    .filter(([_, h]) => h.totalShares > 0)
    .map(([ticker, h]) => {
      const stock = stocks?.find((s) => s.ticker === ticker);
      const currentPrice = stock?.price ?? h.totalCost / h.totalShares;
      const totalValue = h.totalShares * currentPrice;
      const totalGain = totalValue - h.totalCost;
      const gainPct = h.totalCost > 0 ? (totalGain / h.totalCost) * 100 : 0;

      return {
        ticker,
        totalShares: h.totalShares,
        avgPrice: h.totalCost / h.totalShares,
        currentPrice,
        totalValue,
        totalGain,
        gainPct,
        name: h.name,
      };
    });

  const totalPortfolioValue = enrichedHoldings.reduce((sum, h) => sum + h.totalValue, 0);
  const totalPortfolioGain = enrichedHoldings.reduce((sum, h) => sum + h.totalGain, 0);
  const totalGainPct =
    totalPortfolioValue > 0
      ? (totalPortfolioGain / (totalPortfolioValue - totalPortfolioGain)) * 100
      : 0;

  return (
    <div className="space-y-4">
      {/* Local indicator */}
      <div className="flex items-center gap-2 rounded-sm bg-muted/50 px-2 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span className="text-[10px] text-muted-foreground">
          Portfolio saved locally — sign in to sync across devices
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="rounded-md border border-border bg-card p-3">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("totalValue")}
          </span>
          <div className="mt-1 font-data text-lg font-bold tabular-nums text-foreground">
            {formatCurrency(totalPortfolioValue)}
          </div>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("totalGain")}
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span
              className={cn(
                "font-data text-lg font-bold tabular-nums",
                totalPortfolioGain >= 0 ? "text-price-up" : "text-price-down",
              )}
            >
              {formatCurrency(totalPortfolioGain)}
            </span>
            <ChangeBadge value={totalGainPct} showIcon={false} />
          </div>
        </div>
        <div className="rounded-md border border-border bg-card p-3">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("holdings")}
          </span>
          <div className="mt-1 font-data text-lg font-bold tabular-nums text-foreground">
            {enrichedHoldings.length}
          </div>
        </div>
      </div>

      {/* Add position button */}
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-3.5 w-3.5" />
          {t("addPosition")}
        </Button>
      </div>

      {/* Add position form */}
      {showAddForm && (
        <AddPositionForm onClose={() => setShowAddForm(false)} />
      )}

      {/* Holdings table */}
      {enrichedHoldings.length > 0 ? (
        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 text-left font-medium">{t("fields.ticker")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("fields.shares")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("fields.avgPrice")}</th>
                <th className="px-3 py-2 text-right font-medium">{t("fields.currentPrice")}</th>
                <th className="hidden px-3 py-2 text-right font-medium md:table-cell">
                  {t("fields.value")}
                </th>
                <th className="px-3 py-2 text-right font-medium">{t("fields.gain")}</th>
              </tr>
            </thead>
            <tbody>
              {enrichedHoldings.map((h) => (
                <tr
                  key={h.ticker}
                  className="border-b border-border/50 last:border-b-0"
                >
                  <td className="px-3 py-2">
                    <div>
                      <span className="font-data font-semibold text-foreground">{h.ticker}</span>
                      <span className="ml-1 text-[10px] text-muted-foreground">{h.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-data tabular-nums text-foreground">
                    {h.totalShares.toFixed(0)}
                  </td>
                  <td className="px-3 py-2 text-right font-data tabular-nums text-muted-foreground">
                    {formatPrice(h.avgPrice)}
                  </td>
                  <td className="px-3 py-2 text-right font-data tabular-nums text-foreground">
                    {formatPrice(h.currentPrice)}
                  </td>
                  <td className="hidden px-3 py-2 text-right font-data tabular-nums text-foreground md:table-cell">
                    {formatCurrency(h.totalValue)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <ChangeBadge value={h.gainPct} showIcon={false} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-md border border-border bg-card py-12 text-center">
          <p className="text-xs text-muted-foreground">
            {hasLocalTransactions ? "No holdings after sells" : t("empty")}
          </p>
        </div>
      )}
    </div>
  );
}

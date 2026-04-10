import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Download, Wallet } from "lucide-react";
import { usePortfolio } from "@/features/portfolio/api/portfolio-queries";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { useLocalTransactions } from "@/features/portfolio/hooks/use-local-transactions";
import { AddPositionForm } from "@/features/portfolio/components/add-position-form";
import { PortfolioSkeleton } from "@/features/portfolio/components/portfolio-skeleton";
import { Button } from "@/components/ui/button";
import { ChangeBadge } from "@/components/shared/change-badge";
import { formatPrice, formatCurrency } from "@/lib/formatters";
import { exportToCsv } from "@/lib/export";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { useSelectedStock } from "@/hooks/use-selected-stock";
import type { Holding } from "@/features/portfolio/api/portfolio-queries";

interface EnrichedHolding extends Holding {
  currentPrice: number;
  totalValue: number;
  totalGain: number;
  gainPct: number;
  name: string;
}

interface PortfolioDashboardProps {
  isLocal?: boolean;
}

export function PortfolioDashboard({ isLocal = false }: PortfolioDashboardProps) {
  const { t } = useTranslation("portfolio");
  const { isLoading, data: portfolioData } = usePortfolio();
  const { data: stocksResult } = useStocksLive();
  const stocks = stocksResult?.stocks ?? null;
  const { transactions: localTxs, hasLocalTransactions } = useLocalTransactions();
  const { select } = useSelectedStock();

  const [showAddForm, setShowAddForm] = useState(false);

  const holdings = useMemo(() => {
    return computeHoldings(portfolioData?.transactions ?? [], localTxs);
  }, [portfolioData?.transactions, localTxs]);

  const enrichedHoldings = computeEnrichedHoldings(holdings, stocks);

  const totalPortfolioValue = enrichedHoldings.reduce((sum, h) => sum + h.totalValue, 0);
  const totalPortfolioGain = enrichedHoldings.reduce((sum, h) => sum + h.totalGain, 0);
  const totalGainPct =
    totalPortfolioValue > 0
      ? (totalPortfolioGain / (totalPortfolioValue - totalPortfolioGain)) * 100
      : 0;

  const handleExportCsv = () => {
    const headers = [
      "Ticker",
      "Name",
      "Shares",
      "Avg Price (EUR)",
      "Current Price (EUR)",
      "Value (EUR)",
      "Gain (EUR)",
      "Gain (%)",
    ];
    const rows = enrichedHoldings.map((h) => [
      h.ticker,
      h.name,
      h.totalShares.toString(),
      h.avgPrice.toFixed(2),
      h.currentPrice.toFixed(2),
      h.totalValue.toFixed(2),
      h.totalGain.toFixed(2),
      h.gainPct.toFixed(2),
    ]);
    exportToCsv(`zse-portfolio-${new Date().toISOString().split("T")[0]}`, headers, rows);
  };

  if (isLoading) {
    return <PortfolioSkeleton />;
  }

  return (
    <div className="space-y-4">
      {/* Local indicator */}
      {(isLocal || hasLocalTransactions) && (
        <div className="flex items-center gap-2 rounded-sm bg-muted/50 px-2 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-[10px] text-muted-foreground">
            {isLocal
              ? "Portfolio saved locally — sign in to sync across devices"
              : "Portfolio synced with your account"}
          </span>
        </div>
      )}

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
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportCsv}
            disabled={enrichedHoldings.length === 0}
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
          <Button size="sm" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="h-3.5 w-3.5" />
            {t("addPosition")}
          </Button>
        </div>
      </div>

      {/* Add position form */}
      {showAddForm && <AddPositionForm onClose={() => setShowAddForm(false)} />}

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
                  className="border-b border-border/50 last:border-b-0 cursor-pointer hover:bg-accent/50"
                  onClick={() => select(h.ticker)}
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
        <div className="rounded-md border border-border bg-card">
          <EmptyState
            icon={<Wallet className="h-8 w-8" />}
            title={t("empty")}
            description={t("emptyDescription")}
            action={{ label: t("addPosition"), onClick: () => setShowAddForm(true) }}
          />
        </div>
      )}
    </div>
  );
}

function computeEnrichedHoldings(
  holdings: Holding[],
  stocks: Array<{ ticker: string; price: number; name: string }> | null,
): EnrichedHolding[] {
  return holdings.map((h) => {
    const stock = stocks?.find((s) => s.ticker === h.ticker);
    const currentPrice = stock?.price ?? h.avgPrice;
    const totalValue = h.totalShares * currentPrice;
    const totalGain = totalValue - h.totalCost;
    const gainPct = h.totalCost > 0 ? (totalGain / h.totalCost) * 100 : 0;

    return { ...h, currentPrice, totalValue, totalGain, gainPct, name: stock?.name ?? h.ticker };
  });
}

function computeHoldings(
  remoteTxs: Array<{
    ticker: string;
    transaction_type: string;
    shares: number;
    total_amount: number;
  }>,
  localTxs: Array<{
    ticker: string;
    transactionType: string;
    shares: number;
    totalAmount: number;
  }>,
): Holding[] {
  const allTransactions = [
    ...remoteTxs.map((tx) => ({
      ticker: tx.ticker,
      transactionType: tx.transaction_type as "buy" | "sell" | "dividend",
      shares: tx.shares,
      totalAmount: tx.total_amount,
    })),
    ...localTxs.map((tx) => ({
      ticker: tx.ticker,
      transactionType: tx.transactionType as "buy" | "sell" | "dividend",
      shares: tx.shares,
      totalAmount: tx.totalAmount,
    })),
  ];

  if (!allTransactions.length) return [];

  const holdingsMap = new Map<string, { totalShares: number; totalCost: number }>();

  for (const txn of allTransactions) {
    const current = holdingsMap.get(txn.ticker) ?? { totalShares: 0, totalCost: 0 };

    if (txn.transactionType === "buy") {
      current.totalShares += txn.shares;
      current.totalCost += txn.totalAmount;
    } else if (txn.transactionType === "sell") {
      current.totalShares -= txn.shares;
      current.totalCost -= txn.shares * (current.totalCost / (current.totalShares + txn.shares));
    }

    holdingsMap.set(txn.ticker, current);
  }

  return Array.from(holdingsMap.entries())
    .filter(([_, h]) => h.totalShares > 0)
    .map(([ticker, h]) => ({
      ticker,
      totalShares: h.totalShares,
      avgPrice: h.totalCost / h.totalShares,
      totalCost: h.totalCost,
    }));
}

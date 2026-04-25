import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Download, Keyboard, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { exportToCsv } from "@/lib/export";
import { useReceivedDividends } from "@/features/portfolio/hooks/use-received-dividends";
import { usePortfolioHoldings } from "@/features/portfolio/api/portfolio-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { DividendsCalendarEmptyIllustration } from "@/components/shared/empty-illustrations";
import { DividendsSkeleton } from "@/features/dividends/components/dividends-skeleton";
import { formatCurrency, formatDate } from "@/lib/formatters";

export function ReceivedDividends() {
  const { t } = useTranslation("portfolio");
  const { dividends, addDividend, removeDividend, hasDividends } = useReceivedDividends();
  const holdings = usePortfolioHoldings();
  const [showForm, setShowForm] = useState(false);
  const [sort, setSort] = useState<{ column: "ticker" | "amount" | "date"; direction: "asc" | "desc" } | null>({ column: "date", direction: "desc" });
  const [form, setForm] = useState({
    ticker: "",
    shares: "",
    amountPerShare: "",
    currency: "EUR" as "EUR" | "HRK",
    payDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const holdingTickers = holdings.map((h) => h.ticker);
  const isHoldingsLoading = !holdings.length && !dividends.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.ticker || !form.shares || !form.amountPerShare) return;

    const shares = parseFloat(form.shares);
    const amountPerShare = parseFloat(form.amountPerShare);

    addDividend({
      ticker: form.ticker.toUpperCase(),
      shares,
      amountPerShare,
      totalAmount: shares * amountPerShare,
      currency: form.currency,
      payDate: form.payDate,
      notes: form.notes || null,
    });

    setForm({ ticker: "", shares: "", amountPerShare: "", currency: "EUR", payDate: new Date().toISOString().split("T")[0], notes: "" });
    setShowForm(false);
  };

  const totalReceived = dividends.reduce((sum, d) => {
    const eur = d.currency === "HRK" ? d.totalAmount / 7.5 : d.totalAmount;
    return sum + eur;
  }, 0);

  const sortedDividends = useMemo(() => {
    if (!sort) return [...dividends].sort((a, b) => b.payDate.localeCompare(a.payDate));
    return [...dividends].sort((a, b) => {
      if (sort.column === "ticker") {
        return sort.direction === "asc" 
          ? a.ticker.localeCompare(b.ticker)
          : b.ticker.localeCompare(a.ticker);
      }
      if (sort.column === "amount") {
        const aAmt = a.currency === "HRK" ? a.totalAmount / 7.5 : a.totalAmount;
        const bAmt = b.currency === "HRK" ? b.totalAmount / 7.5 : b.totalAmount;
        return sort.direction === "asc" ? aAmt - bAmt : bAmt - aAmt;
      }
      // date
      return sort.direction === "asc" 
        ? a.payDate.localeCompare(b.payDate)
        : b.payDate.localeCompare(a.payDate);
    });
  }, [dividends, sort]);

  const handleSort = (col: "ticker" | "amount" | "date") => {
    setSort((prev) => {
      if (prev?.column !== col) return { column: col, direction: "desc" };
      if (prev.direction === "desc") return { column: col, direction: "asc" };
      return null;
    });
  };

  const handleExportCsv = () => {
    const headers = ["Ticker", "Shares", "Per Share", "Total Amount", "Currency", "Date Paid", "Notes"];
    const rows = sortedDividends
      .map((d) => [
        d.ticker,
        d.shares.toString(),
        d.amountPerShare.toFixed(4),
        d.totalAmount.toFixed(2),
        d.currency,
        d.payDate,
        d.notes ?? "",
      ]);
    exportToCsv(`zse-dividends-${new Date().toISOString().split("T")[0]}`, headers, rows);
    toast.success(t("toast.exported"));
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DividendsCalendarEmptyIllustration className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">{t("dividendsReceived")}</span>
          {hasDividends && !isHoldingsLoading && (
            <span className="font-data text-[10px] text-muted-foreground">
              {t("dividends.form.total")} {formatCurrency(totalReceived)} EUR
            </span>
          )}
          {isHoldingsLoading && (
            <DividendsSkeleton rows={2} />
          )}
        </div>
        <div className="flex gap-2">
          {hasDividends && (
            <Button size="sm" variant="outline" onClick={handleExportCsv} className="h-6 text-[10px]">
              <Download className="h-3 w-3" />
              CSV
            </Button>
          )}
          <Button
            size="sm"
            variant={hasDividends ? "default" : "outline"}
            onClick={() => setShowForm(!showForm)}
            className="h-6 text-[10px]"
          >
            <Plus className="h-3 w-3" />
            {t("dividends.buttons.record")}
          </Button>
        </div>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-md border border-border bg-card p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-[9px] uppercase text-muted-foreground">{t("dividends.form.ticker")}</label>
              <Input
                list="dividend-tickers"
                value={form.ticker}
                onChange={(e) => setForm((f) => ({ ...f, ticker: e.target.value }))}
                className="h-7 text-[11px]"
                placeholder="HT-R-A"
              />
              <datalist id="dividend-tickers">
                {holdingTickers.map((t) => <option key={t} value={t} />)}
              </datalist>
            </div>
            <div>
              <label className="mb-1 block text-[9px] uppercase text-muted-foreground">{t("dividends.form.datePaid")}</label>
              <Input
                type="date"
                value={form.payDate}
                onChange={(e) => setForm((f) => ({ ...f, payDate: e.target.value }))}
                className="h-7 text-[11px]"
              />
            </div>
            <div>
              <label className="mb-1 block text-[9px] uppercase text-muted-foreground">{t("dividends.form.shares")}</label>
              <Input
                type="number"
                step="0.0001"
                value={form.shares}
                onChange={(e) => setForm((f) => ({ ...f, shares: e.target.value }))}
                className="h-7 text-[11px]"
                placeholder="100"
              />
            </div>
            <div className="flex gap-1">
              <div className="flex-1">
                <label className="mb-1 block text-[9px] uppercase text-muted-foreground">{t("dividends.form.perShare")}</label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.amountPerShare}
                  onChange={(e) => setForm((f) => ({ ...f, amountPerShare: e.target.value }))}
                  className="h-7 text-[11px]"
                  placeholder="1.53"
                />
              </div>
              <div>
                <label className="mb-1 block text-[9px] uppercase text-muted-foreground">{t("dividends.form.currency")}</label>
                <select
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value as "EUR" | "HRK" }))}
                  className="flex h-7 w-14 items-center rounded-md border border-input bg-background px-1 py-1 font-data text-[11px] text-foreground"
                >
                  <option value="EUR">EUR</option>
                  <option value="HRK">HRK</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Input
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="h-7 text-[11px]"
              placeholder={t("dividends.form.notes")}
            />
            <Button type="submit" size="sm" className="h-7 text-[11px]">{t("dividends.buttons.save")}</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setShowForm(false)} className="h-7 text-[11px]">{t("dividends.buttons.cancel")}</Button>
          </div>
        </form>
      )}

      {/* Dividends list with sortable table headers for keyboard navigation */}
      {!hasDividends ? (
        <EmptyState
          icon={<DividendsCalendarEmptyIllustration className="h-8 w-8" />}
          title={t("dividends.empty", "No dividends recorded yet")}
          description={t("dividends.emptyDescription", "Record your first dividends to start tracking your investment returns.")}
          action={{ label: t("dividends.recordAction", "Record"), onClick: () => setShowForm(true) }}
          className="rounded-md border border-border"
        />
      ) : (
        <div className="rounded-md border border-border bg-card overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr className="border-b border-border text-[9px] uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-2 text-left font-medium">
                  <button
                    onClick={() => handleSort("ticker")}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSort("ticker"); }}}
                    tabIndex={0}
                    role="columnheader"
                    aria-sort={sort?.column === "ticker" ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
                    className="flex items-center gap-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background rounded-sm"
                  >
                    <span>Ticker</span>
                    {sort?.column === "ticker" ? (
                      sort.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />}
                  </button>
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  <button
                    onClick={() => handleSort("amount")}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSort("amount"); }}}
                    tabIndex={0}
                    role="columnheader"
                    aria-sort={sort?.column === "amount" ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
                    className="flex items-center gap-1 ml-auto hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background rounded-sm"
                  >
                    <span>Iznos (EUR)</span>
                    {sort?.column === "amount" ? (
                      sort.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />}
                  </button>
                </th>
                <th className="px-3 py-2 text-right font-medium">
                  <button
                    onClick={() => handleSort("date")}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSort("date"); }}}
                    tabIndex={0}
                    role="columnheader"
                    aria-sort={sort?.column === "date" ? (sort.direction === "asc" ? "ascending" : "descending") : "none"}
                    className="flex items-center gap-1 ml-auto hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background rounded-sm"
                  >
                    <span>Datum</span>
                    {sort?.column === "date" ? (
                      sort.direction === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                    ) : <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />}
                  </button>
                </th>
                <th className="w-10 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {sortedDividends.map((d) => {
                const eurAmount = d.currency === "HRK" ? d.totalAmount / 7.5 : d.totalAmount;
                return (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-accent/30">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="font-data text-[11px] font-semibold text-foreground">{d.ticker}</span>
                        <span className="text-[10px] text-muted-foreground">{d.shares} × {formatCurrency(d.amountPerShare)}</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground/60">{d.notes || formatDate(d.payDate)}</div>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="font-data text-[11px] tabular-nums text-price-up">
                        +{formatCurrency(eurAmount)} EUR
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span className="font-data text-[10px] text-muted-foreground">{formatDate(d.payDate)}</span>
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        onClick={() => removeDividend(d.id)}
                        className="text-muted-foreground/40 hover:text-price-down"
                        title={t("shortcut.delete")}
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Always-visible keyboard shortcuts hint for discoverability - matching stocks/watchlist/portfolio pattern */}
      {dividends.length > 0 && (
        <div className="flex items-center justify-between rounded-md border-t border-border/50 px-3 py-2 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-2">
            <kbd className="rounded bg-muted px-1.5 py-0.5 font-sans text-[8px]">Del</kbd>
            <span className="hidden sm:inline">{t("shortcut.delete") || "obriši"}</span>
          </span>
          <span className="flex items-center gap-1">
            <Keyboard className="h-2.5 w-2.5" />
            <span>N {t("shortcut.new") || "novi unos"}</span>
          </span>
        </div>
      )}
    </div>
  );
}
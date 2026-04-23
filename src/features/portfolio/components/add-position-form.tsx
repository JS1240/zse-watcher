import { useEffect, useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { X, Keyboard, AlertCircle, CheckCircle2, TrendingUp, Euro } from "lucide-react";
import { toast } from "sonner";
import { useAddTransaction } from "@/features/portfolio/api/portfolio-queries";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TickerSelect } from "@/components/shared/ticker-select";
import { normalizeNumberInput, formatInputNumber, parseLocalizedNumber } from "@/lib/format-input";
import { formatPrice } from "@/lib/formatters";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

const positionSchema = z.object({
  ticker: z.string().min(1, "validation.required"),
  transactionType: z.enum(["buy", "sell", "dividend"]),
  shares: z.string().min(1, "validation.required"),
  pricePerShare: z.string().min(1, "validation.required"),
  transactionDate: z.string().min(1, "validation.required"),
  notes: z.string().optional(),
});

const translateError = (key: string | undefined, t: (key: string) => string) => {
  if (!key) return "";
  return key.includes(".") ? t(key) : key;
};

type PositionValues = z.infer<typeof positionSchema>;

interface AddPositionFormProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddPositionForm({ onClose, onSuccess }: AddPositionFormProps) {
  const { t } = useTranslation("portfolio");
  const addTransaction = useAddTransaction();

  // Check if stocks are still loading (no data yet = loading)
  const { data: stocksResult } = useStocksLive();
  const stocks = useMemo(() => stocksResult?.stocks ?? [], [stocksResult]);
  const isLoading = !stocksResult?.stocks && stocksResult === undefined;

  // Focus state for validation timing
  const [focused, setFocused] = useState({ ticker: false, shares: false, price: false });
  const [touched, setTouched] = useState({ ticker: false, shares: false, price: false });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PositionValues>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      transactionType: "buy",
      transactionDate: new Date().toISOString().slice(0, 10),
    },
  });

  const tickerValue = watch("ticker");
  const sharesValue = watch("shares");
  const priceValue = watch("pricePerShare");
  const transactionTypeValue = watch("transactionType");

  // Debounce for real-time validation
  const debouncedShares = useDebounce(sharesValue, 300);
  const debouncedPrice = useDebounce(priceValue, 300);

  // Get current price for selected ticker - moved before callback to fix hoisting issue
  const currentPrice = useMemo(() => {
    if (!tickerValue) return null;
    const stock = stocks.find((s) => s.ticker.toUpperCase() === tickerValue.toUpperCase());
    return stock?.price ?? null;
  }, [tickerValue, stocks]);

  // Common investment amounts for quick-fill buttons
  const quickAmounts = [500, 1000, 2500, 5000, 10000];

  // Quick share amount buttons for fills
  const quickShares = [10, 25, 50, 100, 250];

  // Quick percentage buttons for price
  const quickPricePcts = [
    { pct: -10, label: "-10%" },
    { pct: -5, label: "-5%" },
    { pct: 0, label: "0%" },
    { pct: 5, label: "+5%" },
    { pct: 10, label: "+10%" },
  ];

  // Calculate total investment value from shares × price
  const totalInvestment = useMemo(() => {
    if (!sharesValue || !priceValue) return null;
    const shares = parseLocalizedNumber(sharesValue);
    const price = parseLocalizedNumber(priceValue);
    if (isNaN(shares) || isNaN(price) || shares <= 0 || price <= 0) return null;
    return shares * price;
  }, [sharesValue, priceValue]);

  // Handle investment amount input → calculate shares
  const handleInvestmentAmount = useCallback((amount: number | string) => {
    const amountStr = typeof amount === "number" ? amount.toString() : amount;
    const amountParsed = parseLocalizedNumber(amountStr);
    if (isNaN(amountParsed) || amountParsed <= 0) return;
    
    // Use price from form if entered, otherwise fall back to current price
    const price = priceValue ? parseLocalizedNumber(priceValue) : currentPrice;
    if (price && price > 0) {
      const shares = Math.floor(amountParsed / price);
      if (shares > 0) {
        setValue("shares", shares.toString(), { shouldValidate: true });
        setTouched((prev) => ({ ...prev, shares: true }));
      }
    }
  }, [priceValue, currentPrice, setValue]);

  // Handle quick share amount buttons
  const handleQuickShares = useCallback((shares: number) => {
    setValue("shares", shares.toString(), { shouldValidate: true });
    setTouched((prev) => ({ ...prev, shares: true }));
  }, [setValue]);

  // Handle quick price percentage buttons
  const handleQuickPrice = useCallback((pct: number) => {
    if (!currentPrice) return;
    const newPrice = currentPrice * (1 + pct / 100);
    const formatted = formatPrice(newPrice).replace("EUR", "").trim();
    setValue("pricePerShare", formatted, { shouldValidate: true });
    setTouched((prev) => ({ ...prev, price: true }));
  }, [currentPrice, setValue]);

  // Suggested price based on current price (5% bump for buy, 5% drop for sell)
  const suggestedPrice = useMemo(() => {
    if (!currentPrice || !transactionTypeValue) return null;
    const bump = transactionTypeValue === "buy" ? currentPrice * 1.05 : currentPrice * 0.95;
    return formatPrice(bump).replace("EUR", "").trim();
  }, [currentPrice, transactionTypeValue]);

  // Real-time validation checks
  const isTickerFormatValid = useMemo(() => {
    if (!tickerValue) return false;
    return /^[A-Z0-9_-]{3,10}$/i.test(tickerValue);
  }, [tickerValue]);

  const isTickerValid = useMemo(() => {
    if (!tickerValue) return false;
    if (!isTickerFormatValid) return false;
    return stocks.some((s) => s.ticker.toUpperCase() === tickerValue.toUpperCase());
  }, [tickerValue, stocks, isTickerFormatValid]);

  // Track if ticker format is valid but not in stocks list
  const showTickerNotFound = useMemo(() => {
    return isTickerFormatValid && !isTickerValid && tickerValue.length >= 3;
  }, [isTickerFormatValid, isTickerValid, tickerValue]);

  const isSharesValid = useMemo(() => {
    if (!debouncedShares) return false;
    const parsed = parseLocalizedNumber(debouncedShares);
    return !isNaN(parsed) && parsed > 0;
  }, [debouncedShares]);

  const isPriceValid = useMemo(() => {
    if (!debouncedPrice) return false;
    const parsed = parseLocalizedNumber(debouncedPrice);
    return !isNaN(parsed) && parsed > 0;
  }, [debouncedPrice]);

  // Show errors: field was touched AND (has error OR valid check failed when not focused)
  // Combined ticker error message
  const tickerErrorMessage = showTickerNotFound
    ? t("tickerNotFound") || "Ticker nije pronađen na ZSE"
    : translateError(errors.ticker?.message, t) || t("validation.selectTicker");

  const showTickerError = touched.ticker && (errors.ticker || (tickerValue && !isTickerFormatValid));
  const showSharesError = touched.shares && (errors.shares || (debouncedShares && !isSharesValid));
  const showPriceError = touched.price && (errors.pricePerShare || (debouncedPrice && !isPriceValid));

  // Show calculated total investment value
  const showTotalInvestment = totalInvestment !== null && totalInvestment > 0;

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const input = document.getElementById("position-ticker-input");
      input?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const onSubmit = async (data: PositionValues) => {
    // Support both Croatian (150,00) and English (150.00) decimal formats
    const shares = parseLocalizedNumber(data.shares);
    const pricePerShare = parseLocalizedNumber(data.pricePerShare);
    if (isNaN(shares) || shares <= 0 || isNaN(pricePerShare) || pricePerShare <= 0) return;

    await addTransaction.mutateAsync({
      ticker: data.ticker,
      transactionType: data.transactionType,
      shares,
      pricePerShare,
      transactionDate: data.transactionDate,
      notes: data.notes,
    });
    onSuccess?.();
    toast.success(t("toast.positionAdded"));
    onClose();
  };

  // Handle localized input display for price field
  const handlePriceBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const normalized = normalizeNumberInput(e.target.value);
    const parsed = parseLocalizedNumber(normalized);
    if (!isNaN(parsed)) {
      e.target.value = formatInputNumber(parsed, 2);
    }
  };

  // Render skeleton while loading (hooks all called above)
  if (isLoading) {
    return (
      <div className="rounded-md border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <Skeleton className="h-4 w-24 animate-shimmer" />
          <Skeleton className="h-4 w-4 rounded animate-shimmer" />
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {/* Ticker field */}
          <div>
            <Skeleton className="mb-1 h-3 w-10 animate-shimmer" />
            <Skeleton className="h-8 w-full animate-shimmer" />
            <Skeleton className="mt-1.5 h-4 w-28 animate-shimmer" />
          </div>

          {/* Transaction type select */}
          <div>
            <Skeleton className="mb-1 h-3 w-8 animate-shimmer" />
            <Skeleton className="h-8 w-full animate-shimmer" />
          </div>

          {/* Shares field with quick fill buttons */}
          <div>
            <Skeleton className="mb-1 h-3 w-12 animate-shimmer" />
            <Skeleton className="h-8 w-full animate-shimmer" />
            <div className="mt-1 flex flex-wrap gap-1">
              <Skeleton className="h-5 w-12 animate-shimmer" />
              <Skeleton className="h-5 w-12 animate-shimmer" />
              <Skeleton className="h-5 w-12 animate-shimmer" />
              <Skeleton className="h-5 w-12 animate-shimmer" />
              <Skeleton className="h-5 w-12 animate-shimmer" />
            </div>
          </div>

          {/* Price field with quick percentage buttons */}
          <div>
            <Skeleton className="mb-1 h-3 w-20 animate-shimmer" />
            <Skeleton className="h-8 w-full animate-shimmer" />
            <div className="mt-1 flex flex-wrap gap-1">
              <Skeleton className="h-5 w-8 animate-shimmer" />
              <Skeleton className="h-5 w-8 animate-shimmer" />
              <Skeleton className="h-5 w-8 animate-shimmer" />
              <Skeleton className="h-5 w-8 animate-shimmer" />
              <Skeleton className="h-5 w-8 animate-shimmer" />
            </div>
          </div>

          {/* Date field */}
          <div>
            <Skeleton className="mb-1 h-3 w-8 animate-shimmer" />
            <Skeleton className="h-8 w-full animate-shimmer" />
          </div>

          {/* Submit button */}
          <div className="flex items-end md:col-span-1 col-span-2">
            <Skeleton className="h-8 w-full animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground">{t("addPosition")}</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">{t("fields.ticker")}</label>
          <TickerSelect
            id="position-ticker-input"
            value={tickerValue ?? ""}
            onChange={(v) => {
              setValue("ticker", v);
              if (v) {
                setTouched((prev) => ({ ...prev, ticker: true }));
                setFocused((prev) => ({ ...prev, ticker: true }));
              }
            }}
            placeholder="KOEI-R-A"
            error={!!showTickerError}
            className={cn(
              showTickerError && "ring-1 ring-destructive border-destructive",
              isTickerValid && !showTickerError && "ring-1 ring-emerald-500 border-emerald-500",
              showTickerNotFound && "ring-1 ring-amber-400 border-amber-400"
            )}
          />
          {showTickerError ? (
            <p className="mt-1.5 flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/15 px-2.5 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {tickerErrorMessage}
            </p>
          ) : showTickerNotFound ? (
            <p className="mt-1.5 flex items-center gap-1.5 rounded-md border border-amber-400/30 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-700/30">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {tickerErrorMessage}
            </p>
          ) : isTickerValid && currentPrice ? (
            <p className="mt-1.5 flex items-center gap-1.5 rounded-md border border-emerald-400/30 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700/30">
              <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{formatPrice(currentPrice)}</span>
              {suggestedPrice && <span className="text-muted-foreground">·</span>}
              {suggestedPrice && (
                <button
                  type="button"
                  onClick={() => {
                    const clean = suggestedPrice.replace("%", "").replace("+", "");
                    setValue("pricePerShare", clean, { shouldValidate: true });
                    setTouched((prev) => ({ ...prev, price: true }));
                  }}
                  className="ml-auto underline hover:no-underline"
                >
                  {t("useSuggested", { value: suggestedPrice }) || `Koristi ${suggestedPrice}`}
                </button>
              )}
            </p>
          ) : isTickerValid ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              {t("validation.tickerValid")}
            </p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">Type</label>
          <select
            {...register("transactionType")}
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1.5 font-data text-xs text-foreground"
          >
            <option value="buy">{t("type.buy")}</option>
            <option value="sell">{t("type.sell")}</option>
            <option value="dividend">{t("type.dividend")}</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="mb-1 block text-[10px] text-muted-foreground">{t("fields.shares")}</label>
          <Input
            type="number"
            step="1"
            placeholder="100"
            {...register("shares", {
              onBlur: () => {
                setFocused((prev) => ({ ...prev, shares: false }));
                setTouched((prev) => ({ ...prev, shares: true }));
              },
              onChange: () => {
                setFocused((prev) => ({ ...prev, shares: true }));
              },
            })}
            className={cn(
              showSharesError && "ring-1 ring-destructive border-destructive",
              isSharesValid && !focused.shares && !showSharesError && "ring-1 ring-emerald-500 border-emerald-500"
            )}
          />
          {/* Quick-fill investment amount buttons */}
          {currentPrice && (
            <div className="flex flex-wrap gap-1">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleInvestmentAmount(amount)}
                  className="rounded-sm bg-muted/60 px-2 py-0.5 text-[9px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  €{amount.toLocaleString("de-DE")}
                </button>
              ))}
            </div>
          )}
          {/* Quick share amount buttons */}
          {currentPrice && (
            <div className="flex flex-wrap gap-1">
              {quickShares.map((shares) => (
                <button
                  key={shares}
                  type="button"
                  onClick={() => handleQuickShares(shares)}
                  className="rounded-sm bg-muted/60 px-2 py-0.5 text-[9px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {shares}
                </button>
              ))}
            </div>
          )}
          {showSharesError ? (
            <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {translateError(errors.shares?.message, t) || t("validation.positiveNumber")}
            </p>
          ) : isSharesValid && showTotalInvestment ? (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <Euro className="h-3 w-3 flex-shrink-0" />
              {t("totalInvestment") || `Ukupno: ${formatPrice(totalInvestment)}`}
            </p>
          ) : isSharesValid && !focused.shares ? (
            <p className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              {t("fields.valid") || "Ispravno"}
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
              <Keyboard className="h-3 w-3 flex-shrink-0" />
              {t("fields.sharesHint") || "unesite broj dionica"}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">{t("fields.avgPrice")}</label>
          <Input
            type="text"
            inputMode="decimal"
            placeholder="142,00"
            {...register("pricePerShare", {
              onBlur: handlePriceBlur,
              onChange: (e) => {
                const normalized = normalizeNumberInput(e.target.value);
                e.target.value = normalized;
                setFocused((prev) => ({ ...prev, price: true }));
              },
            })}
            error={!!showPriceError}
            className={cn(
              showPriceError && "ring-1 ring-destructive border-destructive",
              isPriceValid && !focused.price && !showPriceError && "ring-1 ring-emerald-500 border-emerald-500"
            )}
          />
          {currentPrice && (
            <div className="mt-1 flex flex-wrap gap-1">
              {quickPricePcts.map(({ pct, label }) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleQuickPrice(pct)}
                  className={cn(
                    "rounded-sm px-2 py-0.5 text-[9px] font-medium transition-colors",
                    pct >= 0
                      ? "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {showPriceError ? (
            <p className="mt-1.5 flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {translateError(errors.pricePerShare?.message, t) || t("validation.positiveNumber")}
            </p>
          ) : isPriceValid && !focused.price ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              {t("fields.valid") || "Ispravno"}
            </p>
          ) : (
            <p className="mt-1.5 flex items-center gap-1.5 text-[9px] text-muted-foreground">
              <Keyboard className="h-3 w-3 flex-shrink-0" />
              {t("fields.priceHint") || "cijena po dionici (npr. 142,50)"}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">{t("fields.date")}</label>
          <Input type="date" {...register("transactionDate")} />
        </div>

        <div className="flex items-end">
          <Button type="submit" className="w-full" loading={isSubmitting}>
            {t("addPosition")}
          </Button>
        </div>
      </form>
    </div>
  );
}
import { useMemo, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Keyboard, TrendingUp, TrendingDown, Minus, Layers } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useAddTransaction } from "@/features/portfolio/api/portfolio-queries";
import { useLocalTransactions } from "@/features/portfolio/hooks/use-local-transactions";
import { normalizeNumberInput, parseLocalizedNumber } from "@/lib/format-input";
import { formatPrice } from "@/lib/formatters";
import { cn } from "@/lib/utils";

const inlineTransactionSchema = z.object({
  transactionType: z.enum(["buy", "sell", "dividend"]),
  shares: z.string().min(1, "validation.required"),
  pricePerShare: z.string().min(1, "validation.required"),
  transactionDate: z.string().min(1, "validation.required"),
  notes: z.string().optional(),
});

type InlineTransactionValues = z.infer<typeof inlineTransactionSchema>;

interface InlineTransactionFormProps {
  ticker: string;
  currentPrice: number;
  onClose: () => void;
  onSuccess?: () => void;
  ownedShares?: number;
}

export function InlineTransactionForm({
  ticker,
  currentPrice,
  onClose,
  onSuccess,
  ownedShares,
}: InlineTransactionFormProps) {
  const { t } = useTranslation("portfolio");
  const { isAuthenticated } = useAuth();
  const addTransaction = useAddTransaction();
  const { addTransaction: addLocalTransaction } = useLocalTransactions();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InlineTransactionValues>({
    resolver: zodResolver(inlineTransactionSchema),
    defaultValues: {
      transactionType: "buy",
      transactionDate: new Date().toISOString().slice(0, 10),
    },
  });

  // Keyboard shortcut: Esc to close, focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const sharesInput = document.getElementById("inline-shares-input");
      sharesInput?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const sharesValue = watch("shares");
  const priceValue = watch("pricePerShare");
  const transactionType = watch("transactionType");

  // Validate sell quantity against owned shares
  const parsedShares = useMemo(() => {
    if (!sharesValue) return null;
    const parsed = parseLocalizedNumber(sharesValue);
    return isNaN(parsed) ? null : parsed;
  }, [sharesValue]);

  const hasInsufficientShares = useMemo(() => {
    if (!ownedShares || !parsedShares) return false;
    if (transactionType !== "sell") return false;
    return parsedShares > ownedShares;
  }, [ownedShares, parsedShares, transactionType]);

  const total = useMemo(() => {
    if (!sharesValue || !priceValue) return null;
    const shares = parseLocalizedNumber(sharesValue);
    const price = parseLocalizedNumber(priceValue);
    if (isNaN(shares) || isNaN(price) || shares <= 0 || price <= 0) return null;
    return shares * price;
  }, [sharesValue, priceValue]);

  const onSubmit = async (data: InlineTransactionValues) => {
    const shares = parseLocalizedNumber(data.shares);
    const pricePerShare = parseLocalizedNumber(data.pricePerShare);
    if (isNaN(shares) || shares <= 0 || isNaN(pricePerShare) || pricePerShare <= 0) return;

    const tx = {
      ticker,
      transactionType: data.transactionType,
      shares,
      pricePerShare,
      totalAmount: shares * pricePerShare,
      transactionDate: data.transactionDate,
      notes: data.notes ?? null,
    };

    if (isAuthenticated) {
      await addTransaction.mutateAsync({
        ...tx,
        notes: data.notes,
      });
    } else {
      addLocalTransaction(tx);
    }

    toast.success(t("toast.positionAdded"), {
      icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
    });
    onSuccess?.();
    onClose();
  };

  const handlePriceBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const normalized = normalizeNumberInput(e.target.value);
    const parsed = parseLocalizedNumber(normalized);
    if (!isNaN(parsed)) {
      e.target.value = formatPrice(parsed).replace("EUR", "").trim();
    }
  };

  // Quick fill share amount buttons
  const quickShares = [5, 10, 25, 50, 100];
  // Quick fill investment amount buttons — helps investors fill by total investment and auto-calculate shares
  const quickAmounts = [500, 1000, 2500, 5000, 10000];

  const handleQuickShares = useCallback((shares: number) => {
    setValue("shares", shares.toString(), { shouldValidate: true });
  }, [setValue]);

  // Handle investment amount → calculate shares using current market price
  const handleQuickAmount = useCallback((amount: number) => {
    if (currentPrice && currentPrice > 0) {
      const shares = Math.floor(amount / currentPrice);
      setValue("shares", shares.toString(), { shouldValidate: true });
    }
  }, [currentPrice, setValue]);

  // Quick fill buttons using current price
  const quickPricePcts = [
    { pct: 0, label: t("quickPrice.market") || "Market" },
    { pct: -5, label: "-5%" },
    { pct: +5, label: "+5%" },
    { pct: -10, label: "-10%" },
    { pct: +10, label: "+10%" },
  ];

  const handleQuickPrice = useCallback((pct: number) => {
    const newPrice = currentPrice * (1 + pct / 100);
    setValue("pricePerShare", formatPrice(newPrice).replace("EUR", "").trim(), { shouldValidate: true });
  }, [currentPrice, setValue]);

  // P&L preview: compare input price vs current market price
  // Helps investors understand if they're over/underpaying before committing
  // Uses debounced price to prevent flicker while typing
  const debouncedPrice = useMemo(() => priceValue, [priceValue]);
  
  const plPreview = useMemo((): {
    diff: number;
    diffPct: number;
    direction: "up" | "down" | "neutral";
    label: string;
    color: string;
    borderColor: string;
    bgColor: string;
    barColor: string;
    barWidth: string;
  } | null => {
    if (!currentPrice || !debouncedPrice) return null;
    const inputPrice = parseLocalizedNumber(debouncedPrice);
    if (isNaN(inputPrice) || inputPrice <= 0) return null;
    const diff = inputPrice - currentPrice;
    const diffPct = (diff / currentPrice) * 100;
    const direction: "up" | "down" | "neutral" = Math.abs(diffPct) < 0.1 ? "neutral" : diff > 0 ? "up" : "down";
    let label: string;
    if (direction === "neutral") {
      label = t("plPreview.atMarket") || "At market price";
    } else if (direction === "up") {
      label = t("plPreview.aboveMarket", { pct: diffPct.toFixed(1) }) || `+${diffPct.toFixed(1)}% above market`;
    } else {
      label = t("plPreview.belowMarket", { pct: Math.abs(diffPct).toFixed(1) }) || `${Math.abs(diffPct).toFixed(1)}% below market`;
    }
    const color = direction === "neutral" ? "text-muted-foreground" : direction === "up" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400";
    const borderColor = direction === "neutral" ? "border-muted-foreground/20" : direction === "up" ? "border-red-500/20" : "border-emerald-500/20";
    const bgColor = direction === "neutral" ? "bg-muted/30" : direction === "up" ? "bg-red-500/5" : "bg-emerald-500/5";
    const barColor = direction === "neutral" ? "bg-muted-foreground/40" : direction === "up" ? "bg-red-500/60" : "bg-emerald-500/60";
    const barWidth = direction === "neutral" ? "50%" : direction === "up" ? `${Math.min(100, 50 + Math.min(diffPct * 2, 50))}%` : `${Math.max(0, 50 - Math.min(Math.abs(diffPct) * 2, 50))}%`;
    return { diff, diffPct, direction, label, color, borderColor, bgColor, barColor, barWidth };
  }, [currentPrice, debouncedPrice, t]);

  // Show P&L preview between quick price buttons and submit row
  const showPlPreview = plPreview && transactionType === "buy";

  return (
    <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
      <div className="mb-2.5 flex items-center justify-between">
        <h4 className="text-[11px] font-semibold text-foreground">
          {t("addPosition")} — {ticker}
        </h4>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-2.5">
        {/* Type selector */}
        <div className="flex rounded-md border border-input bg-background p-0.5">
          {(["buy", "sell", "dividend"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setValue("transactionType", type)}
              className={cn(
                "flex-1 rounded-sm px-2 py-1 text-[10px] font-medium transition-colors",
                watch("transactionType") === type
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t(`type.${type}`)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Shares */}
          <div>
            <label className="mb-1 block text-[9px] text-muted-foreground">{t("fields.shares")}</label>
            <Input
              id="inline-shares-input"
              type="text"
              inputMode="decimal"
              placeholder="100"
              {...register("shares")}
              error={!!errors.shares || hasInsufficientShares}
              aria-describedby={errors.shares ? "inline-shares-error" : hasInsufficientShares ? "inline-shares-warning" : undefined}
              aria-invalid={errors.shares || hasInsufficientShares ? "true" : undefined}
              className={cn(
                "h-7 text-[11px]",
                hasInsufficientShares && "ring-1 ring-amber-500 border-amber-500"
              )}
            />
            {errors.shares ? (
              <p id="inline-shares-error" className="mt-0.5 flex items-center gap-1 text-[9px] text-destructive" role="alert">
                <AlertCircle className="h-3 w-3" />
                {t("validation.positiveNumber")}
              </p>
            ) : hasInsufficientShares ? (
              <p id="inline-shares-warning" className="mt-0.5 flex items-center gap-1 text-[9px] text-amber-600 dark:text-amber-400" role="alert">
                <AlertTriangle className="h-3 w-3" />
                {t("validation.exceedsShares")} — {t("validation.maxSell", { max: ownedShares })}
              </p>
            ) : null}
          </div>

          {/* Price */}
          <div>
            <label className="mb-1 block text-[9px] text-muted-foreground">{t("fields.avgPrice")}</label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder={formatPrice(currentPrice).replace("EUR", "").trim()}
              {...register("pricePerShare", { onBlur: handlePriceBlur })}
              error={!!errors.pricePerShare}
              aria-describedby={errors.pricePerShare ? "inline-price-error" : undefined}
              aria-invalid={errors.pricePerShare ? "true" : undefined}
              className="h-7 text-[11px]"
            />
            {errors.pricePerShare && (
              <p id="inline-price-error" className="mt-0.5 flex items-center gap-1 text-[9px] text-destructive" role="alert">
                <AlertCircle className="h-3 w-3" />
                {t("validation.positiveNumber")}
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="mb-1 block text-[9px] text-muted-foreground">{t("fields.date")}</label>
            <Input
              type="date"
              {...register("transactionDate")}
              className="h-7 text-[11px]"
            />
          </div>
        </div>

        {/* Quick price buttons */}
        <div className="flex flex-wrap gap-1">
          {quickPricePcts.map(({ pct, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => handleQuickPrice(pct)}
              className="rounded-sm bg-muted/60 px-2 py-0.5 text-[9px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {label} ({formatPrice(currentPrice * (1 + pct / 100)).replace("EUR", "").trim()})
            </button>
          ))}
        </div>

        {/* Quick share amount buttons — helps investors fill qty without typing */}
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
          {ownedShares != null && transactionType === "sell" && (
            <button
              type="button"
              onClick={() => {
                setValue("shares", Math.floor(ownedShares).toString(), { shouldValidate: true });
              }}
              className="rounded-sm bg-amber-500/10 px-2 py-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
              title={t("validation.sellAll", { total: ownedShares }) || "Prodaj sve"}
            >
              <Layers className="mr-0.5 inline h-2.5 w-2.5" />
              {t("sellAll") || "Sve"}
            </button>
          )}
        </div>

        {/* Investment amount quick-fill buttons — auto-calculate shares from total investment */}
        {currentPrice && (
          <div className="flex flex-wrap gap-1">
            {quickAmounts.map((amount) => {
              const sharesFromAmount = Math.floor(amount / currentPrice);
              return (
                <button
                  key={amount}
                  type="button"
                  onClick={() => handleQuickAmount(amount)}
                  className="rounded-sm bg-muted/60 px-2 py-0.5 text-[9px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  title={`€${amount.toLocaleString("de-DE")} → ~${sharesFromAmount} dionica`}
                >
                  €{amount.toLocaleString("de-DE")}
                </button>
              );
            })}
          </div>
        )}


        {/* Rich P&L preview strip — shows market comparison before committing */}
        {showPlPreview && (
          <div className={cn(
            "flex flex-col gap-1.5 rounded-md border px-3 py-2.5 transition-colors duration-200",
            plPreview.borderColor,
            plPreview.bgColor
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {plPreview.direction === "up" ? (
                  <TrendingDown className={cn("h-3.5 w-3.5", plPreview.color)} />
                ) : plPreview.direction === "down" ? (
                  <TrendingUp className={cn("h-3.5 w-3.5", plPreview.color)} />
                ) : (
                  <Minus className={cn("h-3.5 w-3.5", plPreview.color)} />
                )}
                <span className="text-[10px] font-medium text-muted-foreground">
                  {t("plPreview.title") || "Market comparison"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="font-data">{currentPrice?.toFixed(2)}</span>
                  <span className="text-muted-foreground/60">EUR</span>
                  <span className="mx-0.5 text-muted-foreground/40">→</span>
                  <span className="font-data">{parseLocalizedNumber(debouncedPrice)?.toFixed(2)}</span>
                  <span className="text-muted-foreground/60">EUR</span>
                </div>
                <span className={cn("text-[10px] font-semibold", plPreview.color)}>
                  {plPreview.label}
                </span>
              </div>
            </div>
            {/* Visual comparison bar with market price marker */}
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-border">
              <div
                className={cn(
                  "absolute left-0 top-0 h-full rounded-full transition-all duration-300",
                  plPreview.barColor
                )}
                style={{ width: plPreview.barWidth }}
              />
              {/* Market price marker at center */}
              <div className="absolute left-1/2 top-1/2 h-3 w-px -translate-y-1/2 bg-primary" />
            </div>
            <p className="text-[9px] text-muted-foreground/70">
              {plPreview.direction === "neutral"
                ? t("plPreview.atMarketDesc") || "Your price matches market — buying at fair value"
                : plPreview.direction === "up"
                ? t("plPreview.aboveMarketDesc") || "Buying above market — check why (premium, limit order...)"
                : t("plPreview.belowMarketDesc") || "Buying below market — good opportunity!"}
            </p>
          </div>
        )}

        {/* Total + Submit */}
        <div className="flex items-center justify-between">
          {total !== null ? (
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              {t("totalInvestment", { value: formatPrice(total) })}
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <Keyboard className="h-2.5 w-2.5" />
              <span>Esc {t("cancelHint")} · Enter {t("submitHint")}</span>
            </span>
          )}
          <Button
            type="submit"
            size="sm"
            className="h-7 text-[11px]"
            loading={isSubmitting}
            disabled={hasInsufficientShares}
          >
            {t("addPosition")}
          </Button>
        </div>
      </form>
    </div>
  );
}
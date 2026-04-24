import { useMemo, useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { X, CheckCircle2, AlertCircle, AlertTriangle, Keyboard } from "lucide-react";
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

  // Quick fill buttons using current price
  const quickPricePcts = [
    { pct: 0, label: "Market" },
    { pct: -5, label: "-5%" },
    { pct: +5, label: "+5%" },
  ];

  const handleQuickPrice = useCallback((pct: number) => {
    const newPrice = currentPrice * (1 + pct / 100);
    setValue("pricePerShare", formatPrice(newPrice).replace("EUR", "").trim(), { shouldValidate: true });
  }, [currentPrice, setValue]);

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
              className={cn(
                "h-7 text-[11px]",
                hasInsufficientShares && "ring-1 ring-amber-500 border-amber-500"
              )}
            />
            {errors.shares ? (
              <p className="mt-0.5 flex items-center gap-1 text-[9px] text-destructive">
                <AlertCircle className="h-3 w-3" />
                {t("validation.positiveNumber")}
              </p>
            ) : hasInsufficientShares ? (
              <p className="mt-0.5 flex items-center gap-1 text-[9px] text-amber-600 dark:text-amber-400">
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
              className="h-7 text-[11px]"
            />
            {errors.pricePerShare && (
              <p className="mt-0.5 flex items-center gap-1 text-[9px] text-destructive">
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
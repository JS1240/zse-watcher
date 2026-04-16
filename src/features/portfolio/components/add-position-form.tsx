import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { X, Keyboard, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAddTransaction } from "@/features/portfolio/api/portfolio-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TickerSelect } from "@/components/shared/ticker-select";
import { normalizeNumberInput, formatInputNumber, parseLocalizedNumber } from "@/lib/format-input";
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

  // Debounce for real-time validation
  const debouncedShares = useDebounce(sharesValue, 300);
  const debouncedPrice = useDebounce(priceValue, 300);

  // Real-time validation checks
  const isTickerValid = useMemo(() => {
    if (!tickerValue) return false;
    return /^[A-Z0-9_-]{3,10}$/i.test(tickerValue);
  }, [tickerValue]);

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
  const showTickerError = touched.ticker && (errors.ticker || (tickerValue && !isTickerValid));
  const showSharesError = touched.shares && (errors.shares || (debouncedShares && !isSharesValid));
  const showPriceError = touched.price && (errors.pricePerShare || (debouncedPrice && !isPriceValid));

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
              isTickerValid && !showTickerError && "ring-1 ring-emerald-500 border-emerald-500"
            )}
          />
          {showTickerError ? (
            <p className="mt-1.5 flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {translateError(errors.ticker?.message, t) || t("validation.selectTicker")}
            </p>
          ) : isTickerValid ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              {t("fields.tickerValid") || "Odabrano"}
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

        <div>
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
          {showSharesError ? (
            <p className="mt-1.5 flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {translateError(errors.shares?.message, t) || t("validation.positiveNumber")}
            </p>
          ) : isSharesValid && !focused.shares ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              {t("fields.valid") || "Ispravno"}
            </p>
          ) : (
            <p className="mt-1.5 flex items-center gap-1.5 text-[9px] text-muted-foreground">
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
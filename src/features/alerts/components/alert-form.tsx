import { useEffect, useState, useMemo, useCallback } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { X, Keyboard, AlertCircle, CheckCircle2, TrendingUp } from "lucide-react";
import { useCreateAlert } from "@/features/alerts/api/alerts-queries";
import { useStocksLive } from "@/features/stocks/api/stocks-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TickerSelect } from "@/components/shared/ticker-select";
import { normalizeNumberInput, formatInputNumber, parseLocalizedNumber } from "@/lib/format-input";
import { formatPrice } from "@/lib/formatters";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import type { AlertCondition } from "@/types/alert";

const translateError = (key: string | undefined, t: (key: string) => string) => {
  if (!key) return "";
  return key.includes(".") ? t(key) : key;
};

const alertSchema = z.object({
  ticker: z.string().min(1, "validation.required"),
  condition: z.enum(["above", "below", "percent_change_up", "percent_change_down"]),
  targetValue: z.string().min(1, "validation.required"),
});

type AlertFormData = z.infer<typeof alertSchema>;

interface AlertFormProps {
  onClose: () => void;
  defaultTicker?: string;
  onSuccess?: () => void;
}

export function AlertForm({ onClose, defaultTicker, onSuccess }: AlertFormProps) {
  const { t } = useTranslation("alerts");
  const createAlert = useCreateAlert();
  const { data: stocksResult } = useStocksLive();
  const stocks = useMemo(() => stocksResult?.stocks ?? [], [stocksResult]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<AlertFormData>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      ticker: defaultTicker ?? "",
      condition: "above",
    },
  });

  const tickerValue = watch("ticker");
  const conditionValue = watch("condition");
  const targetInputValue = watch("targetValue");
  const isPercentCondition = conditionValue?.includes("percent");

  // Get current price for selected ticker (moved after form values are defined)
  const currentPrice = useMemo(() => {
    if (!tickerValue) return null;
    const stock = stocks.find((s) => s.ticker.toUpperCase() === tickerValue.toUpperCase());
    return stock?.price ?? null;
  }, [tickerValue, stocks]);

  // Suggested target based on current price (5% bump for quick setting)
  const suggestedTarget = useMemo(() => {
    if (!currentPrice || !conditionValue) return null;
    const isPercent = conditionValue.includes("percent");
    if (isPercent) return "+5.00%";
    const bump = conditionValue === "above" || conditionValue === "percent_change_up" ? currentPrice * 1.05 : currentPrice * 0.95;
    return formatPrice(bump).replace("EUR", "").trim();
  }, [currentPrice, conditionValue]);

  // Focus state for validation timing
  const [focused, setFocused] = useState({ ticker: false, target: false });
  const [touched, setTouched] = useState({ ticker: false, target: false });

  // Debounce target value for real-time validation
  const debouncedTarget = useDebounce(targetInputValue, 300);

  // Real-time validation checks
  const isTickerValid = useMemo(() => {
    if (!tickerValue) return false;
    // Valid ticker: 3-10 chars, alphanumeric with optional - and _
    return /^[A-Z0-9_-]{3,10}$/i.test(tickerValue);
  }, [tickerValue]);

  const isTargetValid = useMemo(() => {
    if (!debouncedTarget) return false;
    const parsed = parseLocalizedNumber(debouncedTarget);
    return !isNaN(parsed) && parsed > 0;
  }, [debouncedTarget]);

  // Show errors: field was touched AND (has error OR valid check failed when not focused)
  const showTickerError = touched.ticker && (errors.ticker || (tickerValue && !isTickerValid));
  const showTargetError = touched.target && (errors.targetValue || (debouncedTarget && !isTargetValid));

  // Keyboard hint based on condition
  const keyboardHint = isPercentCondition
    ? t("fields.targetHint").replace("Primjer", "npr.") + " — " + t("pressEnter")
    : t("fields.targetHint") + " — " + t("pressEnter");

  // Handle focus for real-time validation
  const handleTargetFocus = useCallback(() => {
    setFocused((prev) => ({ ...prev, target: true }));
  }, []);

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const input = document.getElementById("alert-target-input");
      input?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const onSubmit = async (data: AlertFormData) => {
    const parsed = parseLocalizedNumber(data.targetValue);
    if (isNaN(parsed) || parsed <= 0) return;
    await createAlert.mutateAsync({
      ticker: data.ticker,
      condition: data.condition as AlertCondition,
      targetValue: parsed,
    });
    onSuccess?.();
    onClose();
  };

  // Format display value on load and when condition changes
  const targetValueDisplay = (() => {
    const currentValue = watch("targetValue");
    if (!currentValue) return "";
    const parsed = parseLocalizedNumber(currentValue);
    if (isNaN(parsed)) return currentValue;
    return formatInputNumber(parsed, isPercentCondition ? 2 : 2);
  })();

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground">{t("create")}</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">{t("fields.ticker")}</label>
          <TickerSelect
            value={tickerValue}
            onChange={(v) => {
              setValue("ticker", v, { shouldValidate: true });
              setTouched((prev) => ({ ...prev, ticker: true }));
              if (v) setFocused((prev) => ({ ...prev, ticker: true }));
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
          ) : isTickerValid && currentPrice ? (
            <p className="mt-1.5 flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{formatPrice(currentPrice)}</span>
              {suggestedTarget && (
                <span className="text-muted-foreground">·</span>
              )}
              {suggestedTarget && (
                <button
                  type="button"
                  onClick={() => {
                    const clean = suggestedTarget.replace("%", "").replace("+", "");
                    setValue("targetValue", clean, { shouldValidate: true });
                    setTouched((prev) => ({ ...prev, target: true }));
                  }}
                  className="ml-auto underline hover:no-underline"
                >
                  {t("useSuggested") || `Koristi ${suggestedTarget}`}
                </button>
              )}
            </p>
          ) : isTickerValid ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              {t("fields.tickerValid") || "Odabrano"}
            </p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">{t("fields.condition")}</label>
          <select
            {...register("condition")}
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1.5 font-data text-xs text-foreground"
          >
            <option value="above">{t("condition.above")}</option>
            <option value="below">{t("condition.below")}</option>
            <option value="percent_change_up">{t("condition.percentUp")}</option>
            <option value="percent_change_down">{t("condition.percentDown")}</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">{t("fields.target")}</label>
          <Input
            id="alert-target-input"
            type="text"
            inputMode="decimal"
            placeholder={isPercentCondition ? "10,50" : "150,00"}
            defaultValue={targetValueDisplay}
            onFocus={handleTargetFocus}
            {...register("targetValue", {
              onBlur: (e) => {
                setFocused((prev) => ({ ...prev, target: false }));
                setTouched((prev) => ({ ...prev, target: true }));
                // Format on blur
                const normalized = normalizeNumberInput(e.target.value);
                const parsed = parseLocalizedNumber(normalized);
                if (!isNaN(parsed)) {
                  e.target.value = formatInputNumber(parsed, 2);
                }
              },
              onChange: (e) => {
                const normalized = normalizeNumberInput(e.target.value);
                e.target.value = normalized;
              },
            })}
            error={!!showTargetError}
            className={cn(
              showTargetError && "ring-1 ring-destructive border-destructive",
              isTargetValid && !focused.target && !showTargetError && "ring-1 ring-emerald-500 border-emerald-500"
            )}
          />
          {showTargetError ? (
            <p className="mt-1.5 flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {translateError(errors.targetValue?.message, t) || t("validation.positiveNumber")}
            </p>
          ) : isTargetValid && !focused.target ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              {t("fields.targetValid") || "Ispravno"}
            </p>
          ) : (
            <p className="mt-1.5 flex items-center gap-1.5 text-[9px] text-muted-foreground">
              <Keyboard className="h-3 w-3 flex-shrink-0" />
              {keyboardHint}
            </p>
          )}
        </div>

        <div className="flex items-end">
          <Button type="submit" className="w-full" loading={isSubmitting}>
            {t("create")}
          </Button>
        </div>
      </form>
    </div>
  );
}
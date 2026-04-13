import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { X, Keyboard, AlertCircle, CheckCircle2 } from "lucide-react";
import { useCreateAlert } from "@/features/alerts/api/alerts-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TickerSelect } from "@/components/shared/ticker-select";
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
  const isPercentCondition = conditionValue?.includes("percent");
  const [touched, setTouched] = useState({ ticker: false, target: false });

  // Check if a field has been interacted with
  const showTickerError = touched.ticker && errors.ticker;
  const showTargetError = touched.target && errors.targetValue;

  // Keyboard hint based on condition
  const keyboardHint = isPercentCondition
    ? t("fields.targetHint").replace("Primjer", "npr.") + " — " + t("pressEnter")
    : t("fields.targetHint") + " — " + t("pressEnter");

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      const input = document.getElementById("alert-target-input");
      input?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const onSubmit = async (data: AlertFormData) => {
    const parsed = parseFloat(data.targetValue.replace(",", "."));
    if (isNaN(parsed) || parsed <= 0) return;
    await createAlert.mutateAsync({
      ticker: data.ticker,
      condition: data.condition as AlertCondition,
      targetValue: parsed,
    });
    onSuccess?.();
    onClose();
  };

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
            }}
            placeholder="KOEI-R-A"
            error={!!showTickerError}
          />
          {showTickerError ? (
            <p className="mt-1.5 flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {translateError(errors.ticker?.message, t)}
            </p>
          ) : tickerValue && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              {tickerValue}
            </p>
          )}
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
            type="number"
            step={isPercentCondition ? "0.01" : "0.01"}
            placeholder={isPercentCondition ? "10.5" : "150.00"}
            {...register("targetValue", {
              onBlur: () => setTouched((prev) => ({ ...prev, target: true })),
            })}
            error={!!showTargetError}
          />
          {showTargetError ? (
            <p className="mt-1.5 flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs font-medium text-destructive">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {translateError(errors.targetValue?.message, t)}
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

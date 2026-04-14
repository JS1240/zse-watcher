import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { useAddTransaction } from "@/features/portfolio/api/portfolio-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TickerSelect } from "@/components/shared/ticker-select";
import { normalizeNumberInput, formatInputNumber, parseLocalizedNumber } from "@/lib/format-input";

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
            value={tickerValue ?? ""}
            onChange={(v) => setValue("ticker", v)}
            placeholder="KOEI-R-A"
            error={!!errors.ticker}
          />
          {errors.ticker && (
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-destructive">
              <span className="text-xs">⚠</span>{translateError(errors.ticker.message, t)}
            </p>
          )}
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
          <Input type="number" step="1" placeholder="100" {...register("shares")} error={!!errors.shares} />
          {errors.shares && (
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-destructive">
              <span className="text-xs">⚠</span>{translateError(errors.shares.message, t)}
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
            })}
            error={!!errors.pricePerShare}
          />
          {errors.pricePerShare && (
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-destructive">
              <span className="text-xs">⚠</span>{translateError(errors.pricePerShare.message, t)}
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
import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { useCreateAlert } from "@/features/alerts/api/alerts-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AlertCondition } from "@/types/alert";

const alertSchema = z.object({
  ticker: z.string().min(1, "Required"),
  condition: z.enum(["above", "below", "percent_change_up", "percent_change_down"]),
  targetValue: z.string().min(1, "Required"),
});

type AlertValues = z.infer<typeof alertSchema>;

interface AlertFormProps {
  onClose: () => void;
  defaultTicker?: string;
}

export function AlertForm({ onClose, defaultTicker }: AlertFormProps) {
  const { t } = useTranslation("alerts");
  const createAlert = useCreateAlert();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AlertValues>({
    resolver: zodResolver(alertSchema),
    defaultValues: {
      ticker: defaultTicker ?? "",
      condition: "above",
    },
  });

  const onSubmit = async (data: AlertValues) => {
    await createAlert.mutateAsync({
      ticker: data.ticker,
      condition: data.condition as AlertCondition,
      targetValue: parseFloat(data.targetValue),
    });
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
          <Input placeholder="KOEI-R-A" {...register("ticker")} />
          {errors.ticker && <p className="mt-0.5 text-[10px] text-destructive">{errors.ticker.message}</p>}
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
          <Input type="number" step="0.01" placeholder="150.00" {...register("targetValue")} />
          {errors.targetValue && <p className="mt-0.5 text-[10px] text-destructive">{errors.targetValue.message}</p>}
        </div>

        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : t("create")}
          </Button>
        </div>
      </form>
    </div>
  );
}

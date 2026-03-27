import { useForm } from "react-hook-form";
import { z } from "zod/v4";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { useAddTransaction } from "@/features/portfolio/api/portfolio-queries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const positionSchema = z.object({
  ticker: z.string().min(1, "Required"),
  transactionType: z.enum(["buy", "sell", "dividend"]),
  shares: z.string().min(1, "Required"),
  pricePerShare: z.string().min(1, "Required"),
  transactionDate: z.string().min(1, "Required"),
  notes: z.string().optional(),
});

type PositionValues = z.infer<typeof positionSchema>;

interface AddPositionFormProps {
  onClose: () => void;
}

export function AddPositionForm({ onClose }: AddPositionFormProps) {
  const { t } = useTranslation("portfolio");
  const addTransaction = useAddTransaction();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PositionValues>({
    resolver: zodResolver(positionSchema),
    defaultValues: {
      transactionType: "buy",
      transactionDate: new Date().toISOString().slice(0, 10),
    },
  });

  const onSubmit = async (data: PositionValues) => {
    await addTransaction.mutateAsync({
      ticker: data.ticker,
      transactionType: data.transactionType,
      shares: parseFloat(data.shares),
      pricePerShare: parseFloat(data.pricePerShare),
      transactionDate: data.transactionDate,
      notes: data.notes,
    });
    onClose();
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
          <Input placeholder="KOEI-R-A" {...register("ticker")} />
          {errors.ticker && <p className="mt-0.5 text-[10px] text-destructive">{errors.ticker.message}</p>}
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
          <Input type="number" step="1" placeholder="100" {...register("shares")} />
          {errors.shares && <p className="mt-0.5 text-[10px] text-destructive">{errors.shares.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">{t("fields.avgPrice")}</label>
          <Input type="number" step="0.01" placeholder="142.00" {...register("pricePerShare")} />
          {errors.pricePerShare && <p className="mt-0.5 text-[10px] text-destructive">{errors.pricePerShare.message}</p>}
        </div>

        <div>
          <label className="mb-1 block text-[10px] text-muted-foreground">{t("fields.date")}</label>
          <Input type="date" {...register("transactionDate")} />
        </div>

        <div className="flex items-end">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : t("addPosition")}
          </Button>
        </div>
      </form>
    </div>
  );
}

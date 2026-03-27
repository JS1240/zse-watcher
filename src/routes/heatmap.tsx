import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { MarketStatus } from "@/features/market/components/market-status";
import { Heatmap } from "@/features/market/components/heatmap";

export const Route = createFileRoute("/heatmap")({
  component: HeatmapPage,
});

function HeatmapPage() {
  const { t } = useTranslation("heatmap");

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-4">
      <div className="flex items-center justify-between">
        <h1 className="font-data text-lg font-bold">{t("title")}</h1>
        <MarketStatus />
      </div>
      <Heatmap />
    </div>
  );
}

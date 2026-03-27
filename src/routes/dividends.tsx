import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { DividendsCalendar } from "@/features/dividends/components/dividends-calendar";

export const Route = createFileRoute("/dividends")({
  component: DividendsPage,
});

function DividendsPage() {
  const { t } = useTranslation("common");

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-4">
      <h1 className="font-data text-lg font-bold">{t("nav.dividends")}</h1>
      <DividendsCalendar />
    </div>
  );
}

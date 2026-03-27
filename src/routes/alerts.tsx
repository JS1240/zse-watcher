import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { AlertsDashboard } from "@/features/alerts/components/alerts-dashboard";

export const Route = createFileRoute("/alerts")({
  component: AlertsPage,
});

function AlertsPage() {
  const { t } = useTranslation("alerts");

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-4">
      <h1 className="font-data text-lg font-bold">{t("title")}</h1>
      <AuthGuard>
        <AlertsDashboard />
      </AuthGuard>
    </div>
  );
}

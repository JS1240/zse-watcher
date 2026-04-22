import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { AlertsDashboard } from "@/features/alerts/components/alerts-dashboard";

export const Route = createFileRoute("/alerts")({
  component: AlertsPage,
  validateSearch: (search: Record<string, unknown>) => {
    return search as { status?: "all" | "active" | "triggered" | "paused" };
  },
});

function AlertsPage() {
  const { t } = useTranslation("alerts");
  const search = Route.useSearch();

  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-4">
      <h1 className="font-data text-lg font-bold">{t("title")}</h1>
      <AuthGuard>
        <AlertsDashboard initialStatusFilter={search.status} />
      </AuthGuard>
    </div>
  );
}

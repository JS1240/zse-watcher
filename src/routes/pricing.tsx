import { createFileRoute } from "@tanstack/react-router";
import { PricingPage } from "@/features/premium/components/pricing-page";

export const Route = createFileRoute("/pricing")({
  component: PricingRoute,
});

function PricingRoute() {
  return (
    <div className="flex h-full flex-col overflow-auto p-4">
      <PricingPage />
    </div>
  );
}

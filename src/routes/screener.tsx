import { createFileRoute } from "@tanstack/react-router";
import { PremiumGate } from "@/features/premium/components/premium-gate";
import { StockScreener } from "@/features/stocks/components/stock-screener";

export const Route = createFileRoute("/screener")({
  component: ScreenerPage,
});

function ScreenerPage() {
  return (
    <div className="flex h-full flex-col gap-3 overflow-auto p-4">
      <h1 className="font-data text-lg font-bold">Stock Screener</h1>
      <PremiumGate
        feature="stockScreener"
        fallbackTitle="Stock Screener"
        fallbackDescription="Filter stocks by sector, price range, performance, and more. Upgrade to Premium to unlock."
      >
        <StockScreener />
      </PremiumGate>
    </div>
  );
}

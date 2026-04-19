import type { ReactNode } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { Footer } from "@/components/layout/footer";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { StockDetailDrawer } from "@/features/stocks/components/stock-detail-drawer";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { useSelectedStock } from "@/hooks/use-selected-stock";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { selectedTicker, clear } = useSelectedStock();

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      <Header />
      <OfflineBanner />
      <div className="flex flex-1 overflow-hidden pb-16 lg:pb-0">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>
      <Footer className="hidden lg:flex" />
      <MobileNav />
      <StockDetailDrawer ticker={selectedTicker} onClose={clear} />
    </div>
  );
}

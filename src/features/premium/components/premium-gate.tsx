import { type ReactNode, useState } from "react";
import { Crown, Keyboard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PremiumLockedIllustration } from "@/components/shared/empty-illustrations";
import { UpgradeModal } from "@/features/premium/components/upgrade-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PremiumFeature } from "@/features/premium/config/tiers";
import { useSubscription } from "@/features/premium/hooks/use-subscription";

interface PremiumGateProps {
  feature: PremiumFeature;
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

export function PremiumGate({ feature, children, fallbackTitle, fallbackDescription }: PremiumGateProps) {
  const { t } = useTranslation("premium");
  const { canAccess, loading } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const title = fallbackTitle ?? t("premiumGate.defaultTitle");
  const description = fallbackDescription ?? t("premiumGate.defaultDescription");

  // Loading skeleton state — shows polished skeleton while subscription is being checked
  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-lg">
        {/* Skeleton preview of content */}
        <div className="space-y-3 p-4">
          {/* Simulated content lines */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-md animate-shimmer" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-32 animate-shimmer" />
              <Skeleton className="h-3 w-20 animate-shimmer" />
            </div>
          </div>
          <Skeleton className="h-4 w-full animate-shimmer" />
          <Skeleton className="h-4 w-4/5 animate-shimmer" />
          <Skeleton className="h-4 w-3/5 animate-shimmer" />
          {/* Chart skeleton placeholder */}
          <div className="mt-4 rounded-md border border-border bg-card p-4">
            <Skeleton className="h-[120px] w-full animate-shimmer" />
          </div>
        </div>

        {/* Loading overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            {/* Skeleton crown icon */}
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Skeleton className="h-6 w-6 rounded-full animate-shimmer" />
            </div>
            <Skeleton className="h-3 w-24 animate-shimmer" />
          </div>
        </div>
      </div>
    );
  }

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Blurred preview */}
      <div className="pointer-events-none select-none blur-sm brightness-50">
        {children}
      </div>

      {/* Gradient fade at edges */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />

      {/* Lock overlay */}
      <div className="relative flex flex-col items-center justify-center gap-4 bg-background/60 backdrop-blur-xl">
        {/* PremiumLocked custom illustration */}
        <PremiumLockedIllustration className="h-16 w-16" />
        
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="max-w-xs text-center text-sm text-muted-foreground">
          {description}
        </p>

        <Button
          onClick={() => setShowUpgrade(true)}
          className="gap-2 bg-amber hover:bg-amber/90"
        >
          <Crown className="h-4 w-4" />
          {t("premiumGate.upgrade")}
        </Button>

        {/* Always-visible keyboard shortcuts hint — matches premium page pattern */}
        <div className="mt-2 flex items-center gap-2 text-[9px] text-muted-foreground">
          <Keyboard className="h-2.5 w-2.5" />
          <span className="flex items-center gap-0.5">
            <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">↑↓</kbd>
            <span>pregledaj</span>
          </span>
          <span className="flex items-center gap-0.5">
            <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Enter</kbd>
            <span>nadogradi</span>
          </span>
          <span className="flex items-center gap-0.5">
            <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[8px]">Esc</kbd>
            <span>zatvori</span>
          </span>
        </div>
      </div>

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        featureContext={title}
      />
    </div>
  );
}
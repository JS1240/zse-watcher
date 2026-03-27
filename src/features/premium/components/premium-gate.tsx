import { type ReactNode, useState } from "react";
import { Crown, Lock } from "lucide-react";
import { useSubscription } from "@/features/premium/hooks/use-subscription";
import { UpgradeModal } from "@/features/premium/components/upgrade-modal";
import { Button } from "@/components/ui/button";
import type { PremiumFeature } from "@/features/premium/config/tiers";

interface PremiumGateProps {
  feature: PremiumFeature;
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

export function PremiumGate({
  feature,
  children,
  fallbackTitle = "Premium Feature",
  fallbackDescription = "Upgrade to Premium to unlock this feature.",
}: PremiumGateProps) {
  const { canAccess } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  if (canAccess(feature)) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Blurred preview */}
      <div className="pointer-events-none select-none blur-sm brightness-50">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-md bg-background/60 backdrop-blur-[2px]">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber/10">
          <Lock className="h-5 w-5 text-amber" />
        </div>
        <h3 className="text-sm font-semibold text-foreground">{fallbackTitle}</h3>
        <p className="max-w-xs text-center text-xs text-muted-foreground">
          {fallbackDescription}
        </p>
        <Button size="sm" className="gap-1.5" onClick={() => setShowUpgrade(true)}>
          <Crown className="h-3.5 w-3.5" />
          Upgrade to Premium
        </Button>
      </div>

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        featureContext={fallbackTitle}
      />
    </div>
  );
}

import { type ReactNode, useState } from "react";
import { Crown, Lock } from "lucide-react";
import { UpgradeModal } from "@/features/premium/components/upgrade-modal";
import { Button } from "@/components/ui/button";
import type { PremiumFeature } from "@/features/premium/config/tiers";
import { useSubscription } from "@/features/premium/hooks/use-subscription";

interface PremiumGateProps {
  feature: PremiumFeature;
  children: ReactNode;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

export function PremiumGate({ feature, children, fallbackTitle = "Premium Feature", fallbackDescription = "Upgrade to unlock this feature." }: PremiumGateProps) {
  const { canAccess } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

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
        {/* Animated lock badge */}
        <div className="relative">
          <div className="absolute inset-0 animate-pulse rounded-full bg-amber-500/30" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-full border-2 border-amber-500/50 bg-amber-500/10 shadow-lg shadow-amber-500/20">
            <Lock className="h-6 w-6 text-amber-500" />
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-foreground">{fallbackTitle}</h3>
        <p className="max-w-xs text-center text-sm text-muted-foreground">
          {fallbackDescription}
        </p>

        <Button 
          onClick={() => setShowUpgrade(true)}
          className="gap-2 bg-amber hover:bg-amber/90"
        >
          <Crown className="h-4 w-4" />
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
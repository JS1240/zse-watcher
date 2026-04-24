import { type ReactNode, useState } from "react";
import { Crown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PremiumLockedIllustration } from "@/components/shared/empty-illustrations";
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

export function PremiumGate({ feature, children, fallbackTitle, fallbackDescription }: PremiumGateProps) {
  const { t } = useTranslation("premium");
  const { canAccess } = useSubscription();
  const [showUpgrade, setShowUpgrade] = useState(false);

  const title = fallbackTitle ?? t("premiumGate.defaultTitle");
  const description = fallbackDescription ?? t("premiumGate.defaultDescription");

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
      </div>

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        featureContext={title}
      />
    </div>
  );
}
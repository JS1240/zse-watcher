import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/config/supabase";
import { hasFeature, TIER_CONFIG, type PremiumFeature, type TierLimits } from "@/features/premium/config/tiers";
import type { SubscriptionTier } from "@/types/user";

interface SubscriptionInfo {
  tier: SubscriptionTier;
  limits: TierLimits;
  isPremium: boolean;
  canAccess: (feature: PremiumFeature) => boolean;
  loading: boolean;
}

async function fetchSubscriptionTier(userId: string): Promise<SubscriptionTier> {
  const { data } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", userId)
    .single();

  return (data?.subscription_tier as SubscriptionTier) ?? "free";
}

export function useSubscription(): SubscriptionInfo {
  const { user } = useAuth();

  const { data: tier = "free" as SubscriptionTier, isLoading } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: () => fetchSubscriptionTier(user!.id),
    enabled: !!user,
    staleTime: 60_000,
  });

  return {
    tier,
    limits: TIER_CONFIG[tier],
    isPremium: tier === "premium",
    canAccess: (feature: PremiumFeature) => hasFeature(tier, feature),
    loading: isLoading,
  };
}

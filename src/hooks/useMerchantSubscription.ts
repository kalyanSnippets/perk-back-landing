import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { hasFeatureAccess, CUSTOMER_LIMIT, type PlanTier } from "@/lib/features";

interface Subscription {
  current_plan: string;
  status: string;
  billing_cycle: string | null;
  start_date: string;
  end_date: string | null;
  trial_start_date: string | null;
  trial_end_date: string | null;
}

interface Overrides {
  allow_campaigns: boolean;
  allow_rewards: boolean;
  allow_analytics: boolean;
  allow_ai_suggestions: boolean;
  allow_pos_integration: boolean;
  allow_advanced_reports: boolean;
  allow_gamification: boolean;
  allow_birthday_offers: boolean;
  allow_monthly_offers: boolean;
  allow_priority_support: boolean;
}

export function useMerchantSubscription(merchantId: string | undefined) {
  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ["merchant_subscription", merchantId],
    queryFn: async () => {
      if (!merchantId) return null;
      const { data } = await supabase
        .from("merchant_subscriptions")
        .select("*")
        .eq("merchant_id", merchantId)
        .maybeSingle();
      return data as Subscription | null;
    },
    enabled: !!merchantId,
    staleTime: 60_000,
  });

  const { data: overrides, isLoading: overLoading } = useQuery({
    queryKey: ["merchant_overrides", merchantId],
    queryFn: async () => {
      if (!merchantId) return null;
      const { data } = await supabase
        .from("merchant_feature_overrides")
        .select("*")
        .eq("merchant_id", merchantId)
        .maybeSingle();
      return data as Overrides | null;
    },
    enabled: !!merchantId,
    staleTime: 60_000,
  });

  const plan: PlanTier = (subscription?.current_plan as PlanTier) || "free";
  const status = subscription?.status || "active";
  const loading = subLoading || overLoading;

  const canAccess = (featureKey: string): boolean => {
    return hasFeatureAccess(plan, featureKey, overrides as Record<string, boolean> | null);
  };

  const customerLimit = CUSTOMER_LIMIT[plan];

  return {
    plan,
    status,
    subscription,
    overrides,
    loading,
    canAccess,
    customerLimit,
  };
}

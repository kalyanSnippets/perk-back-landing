import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Campaign, Merchant, Reward } from '../types/database';

export type ExploreMerchant = Merchant & {
  distanceLabel?: string | null;
  campaignTitle?: string | null;
  rewardTitle?: string | null;
};

function normalizeMerchant(raw: any): ExploreMerchant {
  return {
    ...raw,
    id: raw.id,
    user_id: raw.user_id ?? '',
    name: raw.name ?? raw.store_name ?? raw.business_name ?? raw.merchant_name ?? raw.display_name ?? 'PerkBack Store',
    slug: raw.slug ?? raw.id,
    category: raw.category ?? raw.industry_type ?? null,
    logo_url: raw.logo_url ?? raw.profile_image_url ?? null,
    address: raw.address ?? null,
    lat: raw.lat ?? raw.latitude ?? null,
    lng: raw.lng ?? raw.longitude ?? null,
    is_active: raw.is_active ?? true,
    distanceLabel: raw.distance_label ?? raw.distanceLabel ?? null,
    campaignTitle: raw.campaign_title ?? null,
    rewardTitle: raw.reward_title ?? null,
  };
}

export function useExploreData() {
  const merchants = useQuery({
    queryKey: ['explore-merchants'],
    queryFn: async () => {
      const publicRes = await supabase
        .from('merchants_public')
        .select('*')
        .limit(20);

      let rows = publicRes.data ?? [];
      if (publicRes.error) {
        const merchantRes = await supabase
          .from('merchants')
          .select('*')
          .limit(20);
        rows = merchantRes.data ?? [];
      }

      return rows.map(normalizeMerchant);
    },
  });

  const campaigns = useQuery({
    queryKey: ['explore-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, merchant_id, title, description, active')
        .eq('active', true)
        .limit(10);
      if (error) return [] as Campaign[];
      return (data ?? []) as Campaign[];
    },
  });

  const discoveryRewards = useQuery({
    queryKey: ['explore-discovery-rewards'],
    queryFn: async () => {
      const { data } = await supabase.rpc('get_discovery_rewards');
      return (Array.isArray(data) ? data : []) as Reward[];
    },
  });

  return { merchants, campaigns, discoveryRewards, fallbackMerchants: [] as ExploreMerchant[] };
}

export function useJoinMerchant(customerId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ merchantId, slug }: { merchantId?: string; slug?: string }) => {
      if (!customerId) throw new Error('Sign in as a customer before joining stores.');
      const { data, error } = slug
        ? await supabase.rpc('join_merchant_by_slug', { _slug: slug, _source: 'mobile' })
        : await supabase.rpc('join_merchant', { _merchant_id: merchantId, _source: 'mobile' });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-wallet', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customer-rewards', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customer-stamps', customerId] });
      queryClient.invalidateQueries({ queryKey: ['explore-merchants'] });
    },
  });
}

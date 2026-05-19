import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Campaign, Merchant, Reward } from '../types/database';

export type ExploreMerchant = Merchant & {
  distanceLabel?: string | null;
  campaignTitle?: string | null;
  rewardTitle?: string | null;
};

const FALLBACK_MERCHANTS: ExploreMerchant[] = [
  {
    id: 'sample-bondi-beans',
    user_id: '',
    name: 'Bondi Beans',
    slug: 'bondi-beans',
    category: 'Coffee',
    logo_url: null,
    address: '237 Campbell Pde, Bondi',
    lat: null,
    lng: null,
    is_active: true,
    distanceLabel: '140m',
    campaignTitle: 'Double points all weekend',
    rewardTitle: 'Free Flat White',
  },
  {
    id: 'sample-maison',
    user_id: '',
    name: 'Maison Patisserie',
    slug: 'maison-patisserie',
    category: 'Bakery',
    logo_url: null,
    address: 'Local favourite',
    lat: null,
    lng: null,
    is_active: true,
    distanceLabel: '450m',
    campaignTitle: 'Birthday cake bonus',
    rewardTitle: 'Buy 1 get 1 pastry',
  },
  {
    id: 'sample-field-vine',
    user_id: '',
    name: 'Field & Vine',
    slug: 'field-vine',
    category: 'Eats',
    logo_url: null,
    address: 'Dinner rewards',
    lat: null,
    lng: null,
    is_active: true,
    distanceLabel: '1.2km',
    campaignTitle: '$15 off dinner',
    rewardTitle: '$15 voucher',
  },
];

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

      const normalized = rows.map(normalizeMerchant);
      return normalized.length > 0 ? normalized : FALLBACK_MERCHANTS;
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

  return { merchants, campaigns, discoveryRewards, fallbackMerchants: FALLBACK_MERCHANTS };
}

export function useJoinMerchant(customerId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ merchantId, slug }: { merchantId?: string; slug?: string }) => {
      if (!customerId) throw new Error('Sign in as a customer before joining stores.');
      if (merchantId?.startsWith('sample-') || slug?.startsWith('sample-')) return { ok: true };

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

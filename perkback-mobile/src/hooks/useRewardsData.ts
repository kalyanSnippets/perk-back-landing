import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { CustomerStamp, Redemption, Reward } from '../types/database';
import { useCustomerWallet } from './useCustomerWallet';

export type RewardWithMeta = Reward & {
  merchant_name?: string | null;
  merchant_category?: string | null;
  customer_points?: number;
};

const FALLBACK_REWARDS: RewardWithMeta[] = [
  {
    id: 'sample-flat-white',
    merchant_id: 'sample-bondi-beans',
    title: 'Free Flat White',
    description: 'Any size, any milk. One per visit.',
    points_required: 300,
    reward_type: 'coffee',
    is_active: true,
    merchant_name: 'Bondi Beans',
    merchant_category: 'Coffee Shop',
    customer_points: 480,
  },
  {
    id: 'sample-pastry',
    merchant_id: 'sample-maison',
    title: 'Buy 1 get 1 pastry',
    description: 'A sweet little treat for your next visit.',
    points_required: 420,
    reward_type: 'bakery',
    is_active: true,
    merchant_name: 'Maison Patisserie',
    merchant_category: 'Bakery',
    customer_points: 220,
  },
  {
    id: 'sample-voucher',
    merchant_id: 'sample-field-vine',
    title: '$15 off Field & Vine',
    description: 'A cashback-style voucher for dinner.',
    points_required: 1200,
    reward_type: 'cashback',
    is_active: true,
    merchant_name: 'Field & Vine',
    merchant_category: 'Restaurant',
    customer_points: 980,
  },
];

function normalizeReward(raw: any): RewardWithMeta {
  const merchant = raw.merchants ?? raw.merchant ?? null;
  return {
    id: raw.id,
    merchant_id: raw.merchant_id,
    title: raw.title ?? raw.name ?? 'Reward',
    description: raw.description ?? null,
    points_required: Number(raw.points_required ?? raw.points_cost ?? raw.cost_points ?? 0),
    reward_type: raw.reward_type ?? raw.type ?? null,
    expires_at: raw.expires_at ?? raw.end_date ?? null,
    image_url: raw.image_url ?? null,
    is_active: raw.is_active ?? raw.active ?? true,
    merchants: merchant ?? undefined,
    merchant_name: merchant?.name ?? merchant?.store_name ?? raw.merchant_name ?? null,
    merchant_category: merchant?.category ?? merchant?.industry_type ?? raw.merchant_category ?? null,
  };
}

export function useRewardsData(customerId?: string) {
  const wallet = useCustomerWallet(customerId);
  const merchantIds = wallet.data?.map((item) => item.merchant_id).filter(Boolean) ?? [];

  const rewards = useQuery({
    queryKey: ['customer-rewards', customerId, merchantIds.join(',')],
    enabled: Boolean(customerId),
    queryFn: async () => {
      let joinedRewards: RewardWithMeta[] = [];

      if (merchantIds.length > 0) {
        const { data, error } = await supabase
          .from('rewards')
          .select('id, merchant_id, title, description, points_required, reward_type, expires_at, image_url, active, merchants(id, store_name, industry_type, logo_url, address, slug)')
          .in('merchant_id', merchantIds)
          .eq('active', true)
          .limit(24);

        if (!error && data) joinedRewards = data.map(normalizeReward);
      }

      const unique = joinedRewards.filter((reward, index, list) => list.findIndex((item) => item.id === reward.id) === index);

      if (unique.length === 0) return [] as RewardWithMeta[];

      return unique.map((reward) => {
        const membership = wallet.data?.find((item) => item.merchant_id === reward.merchant_id);
        return {
          ...reward,
          merchant_name: reward.merchant_name ?? membership?.merchant?.name,
          merchant_category: reward.merchant_category ?? membership?.merchant?.category,
          customer_points: Number(membership?.points_balance ?? membership?.points ?? 0),
        };
      });
    },
  });

  const redemptions = useQuery({
    queryKey: ['customer-redemptions', customerId],
    enabled: Boolean(customerId),
    queryFn: async () => {
      if (!customerId) return [] as Redemption[];
      const { data, error } = await supabase
        .from('redemptions')
        .select('id, customer_id, merchant_id, reward_id, redemption_code, reward_title, points_spent, status, expires_at, created_at, redeemed_at, rewards(id, merchant_id, title, description, points_required, active)')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) return [] as Redemption[];
      return (data ?? []) as unknown as Redemption[];
    },
  });

  const stamps = useQuery({
    queryKey: ['customer-stamps', customerId],
    enabled: Boolean(customerId),
    queryFn: async () => {
      if (!customerId) return [] as CustomerStamp[];
      const { data, error } = await supabase
        .from('customer_stamps')
        .select('*')
        .eq('customer_id', customerId)
        .limit(12);
      if (error) return [] as CustomerStamp[];
      return (data ?? []) as CustomerStamp[];
    },
  });

  return {
    wallet,
    rewards,
    redemptions,
    stamps,
    fallbackRewards: FALLBACK_REWARDS,
  };
}

export function useRedeemReward(customerId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rewardId: string) => {
      if (!customerId) throw new Error('Customer profile is required before redeeming.');
      if (rewardId.startsWith('sample-')) {
        return {
          id: 'sample-redemption',
          code: '4PXQ-21',
          status: 'active',
          reward_id: rewardId,
          customer_id: customerId,
          expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
        } as Redemption;
      }
      const { data, error } = await supabase.rpc('redeem_reward', {
        _customer_id: customerId,
        _reward_id: rewardId,
      });
      if (error) throw error;
      return data as Redemption | Redemption[];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-redemptions', customerId] });
      queryClient.invalidateQueries({ queryKey: ['customer-wallet', customerId] });
    },
  });
}

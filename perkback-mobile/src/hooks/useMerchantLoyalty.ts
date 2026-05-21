import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Campaign, CustomerStamp, Transaction } from '../types/database';
import { useCustomerWallet } from './useCustomerWallet';
import { RewardWithMeta } from './useRewardsData';

function normalizeReward(raw: any): RewardWithMeta {
  return {
    id: raw.id,
    merchant_id: raw.merchant_id,
    title: raw.title ?? 'Reward',
    description: raw.description ?? null,
    points_required: Number(raw.points_required ?? 0),
    reward_type: raw.reward_type ?? null,
    expires_at: raw.expires_at ?? null,
    image_url: raw.image_url ?? null,
    is_active: raw.active ?? raw.is_active ?? true,
    merchant_name: raw.merchants?.store_name ?? raw.merchant_name ?? null,
    merchant_category: raw.merchants?.industry_type ?? null,
  };
}

export function useMerchantLoyalty(customerId?: string, merchantId?: string) {
  const wallet = useCustomerWallet(customerId);
  const membership = useMemo(
    () => wallet.data?.find((item) => item.merchant_id === merchantId) ?? null,
    [merchantId, wallet.data]
  );

  const rewards = useQuery({
    queryKey: ['merchant-rewards', merchantId],
    enabled: Boolean(merchantId),
    queryFn: async () => {
      if (!merchantId) return [] as RewardWithMeta[];
      const { data, error } = await supabase
        .from('rewards')
        .select('id, merchant_id, title, description, points_required, reward_type, expires_at, image_url, active, merchants(store_name, industry_type)')
        .eq('merchant_id', merchantId)
        .eq('active', true)
        .order('points_required', { ascending: true });
      if (error) return [] as RewardWithMeta[];
      return (data ?? []).map(normalizeReward);
    },
  });

  const campaigns = useQuery({
    queryKey: ['merchant-campaigns', merchantId],
    enabled: Boolean(merchantId),
    queryFn: async () => {
      if (!merchantId) return [] as Campaign[];
      const { data, error } = await supabase
        .from('campaigns')
        .select('id, merchant_id, title, description, active, created_at')
        .eq('merchant_id', merchantId)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) return [] as Campaign[];
      return (data ?? []) as Campaign[];
    },
  });

  const stamps = useQuery({
    queryKey: ['merchant-stamps', customerId, merchantId],
    enabled: Boolean(customerId && merchantId),
    queryFn: async () => {
      if (!customerId || !merchantId) return [] as CustomerStamp[];
      const { data, error } = await supabase
        .from('customer_stamps')
        .select('*')
        .eq('customer_id', customerId)
        .eq('merchant_id', merchantId)
        .limit(5);
      if (error) return [] as CustomerStamp[];
      return (data ?? []) as CustomerStamp[];
    },
  });

  const activity = useQuery({
    queryKey: ['merchant-activity', customerId, merchantId],
    enabled: Boolean(customerId && merchantId),
    queryFn: async () => {
      if (!customerId || !merchantId) return [] as Transaction[];
      const { data, error } = await supabase
        .from('transactions')
        .select('id, customer_id, merchant_id, merchant_name, purchase_amount, points_awarded, source, transaction_date, created_at, refunded_at')
        .eq('customer_id', customerId)
        .eq('merchant_id', merchantId)
        .order('transaction_date', { ascending: false })
        .limit(12);
      if (error) return [] as Transaction[];
      return (data ?? []) as Transaction[];
    },
  });

  return { wallet, membership, rewards, campaigns, stamps, activity };
}

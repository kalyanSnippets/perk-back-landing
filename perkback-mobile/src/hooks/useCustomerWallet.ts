import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { CustomerMerchant, Merchant, MerchantCardDesign } from '../types/database';

export type WalletMerchant = CustomerMerchant & {
  merchant: Merchant | null;
  cardDesign: MerchantCardDesign | null;
};

async function fetchMerchantsByIds(merchantIds: string[]) {
  if (merchantIds.length === 0) return [];

  const publicRes = await supabase
    .from('merchants_public')
    .select('*')
    .in('id', merchantIds);

  if (!publicRes.error && publicRes.data) return publicRes.data as Merchant[];

  const merchantRes = await supabase
    .from('merchants')
    .select('*')
    .in('id', merchantIds);

  if (merchantRes.error) throw merchantRes.error;
  return (merchantRes.data ?? []) as Merchant[];
}

async function fetchCardDesigns(merchantIds: string[]) {
  if (merchantIds.length === 0) return [];

  const { data, error } = await supabase
    .from('merchant_card_designs')
    .select('*')
    .in('merchant_id', merchantIds);

  if (error) return [];
  return (data ?? []) as MerchantCardDesign[];
}

export function useCustomerWallet(customerId?: string) {
  return useQuery({
    queryKey: ['customer-wallet', customerId],
    enabled: Boolean(customerId),
    queryFn: async () => {
      if (!customerId) return [] as WalletMerchant[];

      const { data: customerMerchants, error } = await supabase
        .from('customer_merchants')
        .select('id, customer_id, merchant_id, points, visits, total_spend, created_at')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const memberships = (customerMerchants ?? []) as CustomerMerchant[];
      const merchantIds = [...new Set(memberships.map((item) => item.merchant_id).filter(Boolean))];
      const [merchants, designs] = await Promise.all([
        fetchMerchantsByIds(merchantIds),
        fetchCardDesigns(merchantIds),
      ]);

      return memberships.map((membership) => ({
        ...membership,
        merchant: merchants.find((merchant) => merchant.id === membership.merchant_id) ?? null,
        cardDesign: designs.find((design) => design.merchant_id === membership.merchant_id) ?? null,
      }));
    },
  });
}

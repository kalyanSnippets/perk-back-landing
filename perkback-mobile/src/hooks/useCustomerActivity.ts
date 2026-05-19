import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Transaction } from '../types/database';

export function useCustomerActivity(customerId?: string) {
  return useQuery({
    queryKey: ['customer-activity', customerId],
    enabled: Boolean(customerId),
    queryFn: async () => {
      if (!customerId) return [] as Transaction[];

      const { data, error } = await supabase
        .from('transactions')
        .select('id, customer_id, merchant_id, merchant_name, purchase_amount, points_awarded, source, transaction_date, created_at, refunded_at')
        .eq('customer_id', customerId)
        .order('transaction_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data ?? []) as Transaction[];
    },
  });
}

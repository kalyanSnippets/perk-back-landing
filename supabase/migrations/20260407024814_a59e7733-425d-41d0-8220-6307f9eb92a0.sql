
-- 1. Create customer_merchants table
CREATE TABLE public.customer_merchants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  points_balance integer NOT NULL DEFAULT 0,
  total_spend numeric NOT NULL DEFAULT 0,
  visit_count integer NOT NULL DEFAULT 0,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  last_visit_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(customer_id, merchant_id)
);

-- 2. Enable RLS
ALTER TABLE public.customer_merchants ENABLE ROW LEVEL SECURITY;

-- 3. RLS: Customers can view their own merchant relationships
CREATE POLICY "Customers can view own merchant relationships"
  ON public.customer_merchants FOR SELECT TO authenticated
  USING (customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()));

-- 4. RLS: Merchants can view their customers
CREATE POLICY "Merchants can view own customer relationships"
  ON public.customer_merchants FOR SELECT TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- 5. RLS: Service role full access
CREATE POLICY "Service role full access customer_merchants"
  ON public.customer_merchants FOR ALL TO public
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- 6. Updated_at trigger
CREATE TRIGGER update_customer_merchants_updated_at
  BEFORE UPDATE ON public.customer_merchants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Backfill from existing transactions
INSERT INTO public.customer_merchants (customer_id, merchant_id, points_balance, total_spend, visit_count, joined_at, last_visit_at)
SELECT
  t.customer_id,
  t.merchant_id,
  SUM(t.points_awarded)::integer AS points_balance,
  SUM(t.purchase_amount) AS total_spend,
  COUNT(*)::integer AS visit_count,
  MIN(t.transaction_date) AS joined_at,
  MAX(t.transaction_date) AS last_visit_at
FROM public.transactions t
WHERE t.merchant_id IS NOT NULL
GROUP BY t.customer_id, t.merchant_id
ON CONFLICT (customer_id, merchant_id) DO NOTHING;

-- 8. Subtract redeemed points from backfilled balances
UPDATE public.customer_merchants cm
SET points_balance = cm.points_balance - COALESCE(r.total_spent, 0)
FROM (
  SELECT customer_id, merchant_id, SUM(points_spent) AS total_spent
  FROM public.redemptions
  WHERE status IN ('pending', 'verified')
  GROUP BY customer_id, merchant_id
) r
WHERE cm.customer_id = r.customer_id AND cm.merchant_id = r.merchant_id;

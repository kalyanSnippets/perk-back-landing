
-- receipt_items table
CREATE TABLE public.receipt_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id uuid NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  sku text,
  category text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.receipt_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own receipt items" ON public.receipt_items FOR SELECT TO authenticated
  USING (transaction_id IN (SELECT t.id FROM public.transactions t JOIN public.customers c ON c.id = t.customer_id WHERE c.user_id = auth.uid()));
CREATE POLICY "Merchants can view own receipt items" ON public.receipt_items FOR SELECT TO authenticated
  USING (transaction_id IN (SELECT t.id FROM public.transactions t WHERE t.merchant_id IN (SELECT m.id FROM public.merchants m WHERE m.user_id = auth.uid())));
CREATE POLICY "Merchants can insert own receipt items" ON public.receipt_items FOR INSERT TO authenticated
  WITH CHECK (transaction_id IN (SELECT t.id FROM public.transactions t WHERE t.merchant_id IN (SELECT m.id FROM public.merchants m WHERE m.user_id = auth.uid())));
CREATE POLICY "Service role full access receipt_items" ON public.receipt_items FOR ALL TO public
  USING (auth.role() = 'service_role'::text) WITH CHECK (auth.role() = 'service_role'::text);

-- product_offers table
CREATE TABLE public.product_offers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  product_name text NOT NULL,
  sku text,
  category text,
  discount_type text NOT NULL DEFAULT 'percent',
  discount_value numeric NOT NULL DEFAULT 10,
  description text,
  active boolean NOT NULL DEFAULT true,
  valid_from timestamptz,
  valid_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage own product offers" ON public.product_offers FOR ALL TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));
CREATE POLICY "Authenticated users can view active product offers" ON public.product_offers FOR SELECT TO authenticated
  USING (active = true);
CREATE TRIGGER update_product_offers_updated_at BEFORE UPDATE ON public.product_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Merchants policy refresh
DROP POLICY IF EXISTS "Authenticated users can view merchant store names" ON public.merchants;
CREATE POLICY "Authenticated users can view public merchant info" ON public.merchants FOR SELECT TO authenticated USING (true);

-- Storage: drop old permissive policies, add path-based
DROP POLICY IF EXISTS "Authenticated users can upload profile images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile images" ON storage.objects;

CREATE POLICY "Owner can upload profile images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner can update profile images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Owner can delete profile images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Realtime cleanup
DO $$ BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.customers; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.transactions; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.redemptions; EXCEPTION WHEN OTHERS THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime DROP TABLE public.customer_stamps; EXCEPTION WHEN OTHERS THEN NULL; END;
END $$;

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_transactions_merchant_date ON public.transactions(merchant_id, transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_customer ON public.transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_merchants_customer ON public.customer_merchants(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_stamps_customer_completed ON public.customer_stamps(customer_id, completed);
CREATE INDEX IF NOT EXISTS idx_redemptions_customer_status ON public.redemptions(customer_id, status);
CREATE INDEX IF NOT EXISTS idx_receipt_items_transaction ON public.receipt_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_product_offers_merchant_active ON public.product_offers(merchant_id, active);

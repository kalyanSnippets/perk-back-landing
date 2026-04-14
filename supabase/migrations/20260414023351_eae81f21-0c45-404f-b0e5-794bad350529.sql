
-- Create wallet_passes table to track wallet integrations
CREATE TABLE public.wallet_passes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  wallet_type text NOT NULL CHECK (wallet_type IN ('google', 'apple')),
  pass_id text,
  device_token text,
  push_token text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (customer_id, wallet_type)
);

-- Enable RLS
ALTER TABLE public.wallet_passes ENABLE ROW LEVEL SECURITY;

-- Customers can view their own wallet passes
CREATE POLICY "Customers can view own wallet passes"
ON public.wallet_passes
FOR SELECT
TO authenticated
USING (customer_id IN (
  SELECT id FROM public.customers WHERE user_id = auth.uid()
));

-- Customers can insert their own wallet passes
CREATE POLICY "Customers can insert own wallet passes"
ON public.wallet_passes
FOR INSERT
TO authenticated
WITH CHECK (customer_id IN (
  SELECT id FROM public.customers WHERE user_id = auth.uid()
));

-- Customers can update their own wallet passes
CREATE POLICY "Customers can update own wallet passes"
ON public.wallet_passes
FOR UPDATE
TO authenticated
USING (customer_id IN (
  SELECT id FROM public.customers WHERE user_id = auth.uid()
));

-- Service role full access
CREATE POLICY "Service role full access wallet_passes"
ON public.wallet_passes
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Auto-update updated_at
CREATE TRIGGER update_wallet_passes_updated_at
BEFORE UPDATE ON public.wallet_passes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

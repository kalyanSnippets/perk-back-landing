
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS external_payment_id text;

CREATE UNIQUE INDEX IF NOT EXISTS transactions_external_payment_id_key ON public.transactions (external_payment_id) WHERE external_payment_id IS NOT NULL;

ALTER TABLE public.pos_connections
  ADD COLUMN IF NOT EXISTS provider_account_id text;

ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;

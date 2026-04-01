
-- 1. Add token lifecycle columns to pos_connections
ALTER TABLE public.pos_connections
  ADD COLUMN IF NOT EXISTS token_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS token_refreshed_at timestamptz,
  ADD COLUMN IF NOT EXISTS connection_status text NOT NULL DEFAULT 'active';

-- Add check constraint separately to avoid issues with existing rows
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pos_connections_connection_status_check'
  ) THEN
    ALTER TABLE public.pos_connections
      ADD CONSTRAINT pos_connections_connection_status_check
      CHECK (connection_status IN ('active','token_expired','error','disconnected'));
  END IF;
END $$;

-- 2. Create external_customer_mappings table
CREATE TABLE IF NOT EXISTS public.external_customer_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'square',
  external_customer_id text NOT NULL,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  match_method text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, external_customer_id, merchant_id)
);

ALTER TABLE public.external_customer_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own external_customer_mappings"
  ON public.external_customer_mappings FOR SELECT TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Merchants can manage own external_customer_mappings"
  ON public.external_customer_mappings FOR ALL TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Service role full access external_customer_mappings"
  ON public.external_customer_mappings FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 3. Create integration_events table
CREATE TABLE IF NOT EXISTS public.integration_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'square',
  event_type text NOT NULL,
  external_event_id text,
  merchant_id uuid,
  status text NOT NULL DEFAULT 'received',
  payload jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.integration_events ENABLE ROW LEVEL SECURITY;

-- Add check constraint via DO block
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'integration_events_status_check'
  ) THEN
    ALTER TABLE public.integration_events
      ADD CONSTRAINT integration_events_status_check
      CHECK (status IN ('received','processed','skipped','failed'));
  END IF;
END $$;

CREATE POLICY "Service role full access integration_events"
  ON public.integration_events FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 4. Create unmatched_transactions table
CREATE TABLE IF NOT EXISTS public.unmatched_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'square',
  external_payment_id text,
  purchase_amount numeric NOT NULL,
  external_customer_id text,
  match_attempted jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.unmatched_transactions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unmatched_transactions_status_check'
  ) THEN
    ALTER TABLE public.unmatched_transactions
      ADD CONSTRAINT unmatched_transactions_status_check
      CHECK (status IN ('pending','linked','expired'));
  END IF;
END $$;

CREATE POLICY "Merchants can view own unmatched_transactions"
  ON public.unmatched_transactions FOR SELECT TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Service role full access unmatched_transactions"
  ON public.unmatched_transactions FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

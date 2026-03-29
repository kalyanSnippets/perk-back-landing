
-- Create pos_connections table
CREATE TABLE public.pos_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'square',
  access_token text,
  refresh_token text,
  location_id text,
  webhook_signature_key text,
  is_active boolean NOT NULL DEFAULT false,
  connected_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (merchant_id, provider)
);

-- Enable RLS
ALTER TABLE public.pos_connections ENABLE ROW LEVEL SECURITY;

-- RLS: merchants can view their own connections
CREATE POLICY "Merchants can view own pos_connections"
  ON public.pos_connections FOR SELECT
  TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- RLS: merchants can insert their own connections
CREATE POLICY "Merchants can insert own pos_connections"
  ON public.pos_connections FOR INSERT
  TO authenticated
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- RLS: merchants can update their own connections
CREATE POLICY "Merchants can update own pos_connections"
  ON public.pos_connections FOR UPDATE
  TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- RLS: merchants can delete their own connections
CREATE POLICY "Merchants can delete own pos_connections"
  ON public.pos_connections FOR DELETE
  TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- Service role access for edge functions
CREATE POLICY "Service role full access pos_connections"
  ON public.pos_connections FOR ALL
  TO public
  USING (auth.role() = 'service_role'::text)
  WITH CHECK (auth.role() = 'service_role'::text);

-- Updated_at trigger
CREATE TRIGGER update_pos_connections_updated_at
  BEFORE UPDATE ON public.pos_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

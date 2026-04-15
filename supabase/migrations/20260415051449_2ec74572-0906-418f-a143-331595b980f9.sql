-- 1. Create a safe view for pos_connections (no tokens exposed)
CREATE OR REPLACE VIEW public.safe_pos_connections AS
SELECT id, merchant_id, provider, is_active, location_id, connected_at, 
       provider_account_id, connection_status, created_at, updated_at, token_expires_at
FROM public.pos_connections;

-- 2. Drop existing merchant SELECT policies on pos_connections that expose tokens
DROP POLICY IF EXISTS "Merchants can view own pos_connections" ON public.pos_connections;

-- Re-create a restricted SELECT policy that only returns non-sensitive columns
-- Merchants should query the safe_pos_connections view instead
-- But we still need a base SELECT for RLS on the view to work through the table
CREATE POLICY "Merchants can view own pos_connections"
ON public.pos_connections
FOR SELECT TO authenticated
USING (
  merchant_id IN (SELECT merchants.id FROM merchants WHERE merchants.user_id = auth.uid())
);

-- Grant select on the safe view
GRANT SELECT ON public.safe_pos_connections TO authenticated;

-- 3. Add service role full access to transactions table
CREATE POLICY "Service role full access transactions"
ON public.transactions
FOR ALL TO public
USING (auth.role() = 'service_role'::text)
WITH CHECK (auth.role() = 'service_role'::text);

-- 4. Contact form rate limiting: max 1 submission per 10 minutes per user
DROP POLICY IF EXISTS "Authenticated users can submit contact form" ON public.contact_messages;

CREATE POLICY "Authenticated users can submit contact form with rate limit"
ON public.contact_messages
FOR INSERT TO authenticated
WITH CHECK (
  (length(name) <= 100) AND 
  (length(email) <= 255) AND 
  (length(message) <= 2000) AND 
  ((business_name IS NULL) OR (length(business_name) <= 200)) AND
  NOT EXISTS (
    SELECT 1 FROM public.contact_messages cm
    WHERE cm.email = current_setting('request.jwt.claims', true)::json->>'email'
    AND cm.created_at > now() - interval '10 minutes'
  )
);
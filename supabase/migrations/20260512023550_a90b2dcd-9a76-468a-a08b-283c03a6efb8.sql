
-- 1. Schema additions to merchants
ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS owner_name text,
  ADD COLUMN IF NOT EXISTS api_key_hash text,
  ADD COLUMN IF NOT EXISTS api_key_prefix text,
  ADD COLUMN IF NOT EXISTS api_key_created_at timestamptz,
  ADD COLUMN IF NOT EXISTS api_key_last_used_at timestamptz;

-- 2. API key activity log
CREATE TABLE IF NOT EXISTS public.merchant_api_key_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('created','rotated','revoked','used')),
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_merchant_api_key_log_merchant ON public.merchant_api_key_log(merchant_id, created_at DESC);
ALTER TABLE public.merchant_api_key_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Merchants can view own api key log" ON public.merchant_api_key_log;
CREATE POLICY "Merchants can view own api key log"
  ON public.merchant_api_key_log FOR SELECT TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role full access merchant_api_key_log" ON public.merchant_api_key_log;
CREATE POLICY "Service role full access merchant_api_key_log"
  ON public.merchant_api_key_log FOR ALL TO public
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- 3. Tighten RLS: rewards / monthly_offers / product_offers / promotion_rules
DROP POLICY IF EXISTS "Authenticated users can view active rewards" ON public.rewards;
CREATE POLICY "Customers view rewards of enrolled merchants"
  ON public.rewards FOR SELECT TO authenticated
  USING (
    active = true AND merchant_id IN (
      SELECT cm.merchant_id FROM public.customer_merchants cm
      JOIN public.customers c ON c.id = cm.customer_id
      WHERE c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can view active monthly_offers" ON public.monthly_offers;
CREATE POLICY "Customers view monthly_offers of enrolled merchants"
  ON public.monthly_offers FOR SELECT TO authenticated
  USING (
    active = true AND merchant_id IN (
      SELECT cm.merchant_id FROM public.customer_merchants cm
      JOIN public.customers c ON c.id = cm.customer_id
      WHERE c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can view active product offers" ON public.product_offers;
CREATE POLICY "Customers view product offers of enrolled merchants"
  ON public.product_offers FOR SELECT TO authenticated
  USING (
    active = true AND merchant_id IN (
      SELECT cm.merchant_id FROM public.customer_merchants cm
      JOIN public.customers c ON c.id = cm.customer_id
      WHERE c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can view active promotions" ON public.promotion_rules;
CREATE POLICY "Customers view promotions of enrolled merchants"
  ON public.promotion_rules FOR SELECT TO authenticated
  USING (
    active = true AND merchant_id IN (
      SELECT cm.merchant_id FROM public.customer_merchants cm
      JOIN public.customers c ON c.id = cm.customer_id
      WHERE c.user_id = auth.uid()
    )
  );

-- 4. Discovery RPC: returns marketing-safe fields for active rewards/offers across all merchants
CREATE OR REPLACE FUNCTION public.get_discovery_rewards()
RETURNS TABLE (
  id uuid,
  merchant_id uuid,
  title text,
  description text,
  points_required integer,
  reward_type text,
  image_url text
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, merchant_id, title, description, points_required, reward_type, image_url
  FROM public.rewards
  WHERE active = true;
$$;

CREATE OR REPLACE FUNCTION public.get_discovery_monthly_offers()
RETURNS TABLE (
  id uuid,
  merchant_id uuid,
  title text,
  description text,
  valid_from date,
  valid_to date
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id, merchant_id, title, description, valid_from, valid_to
  FROM public.monthly_offers
  WHERE active = true;
$$;

GRANT EXECUTE ON FUNCTION public.get_discovery_rewards() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_discovery_monthly_offers() TO authenticated;

-- 5. Update handle_new_user to capture owner_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.customers (user_id, full_name, phone, date_of_birth)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'phone',
    CASE WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL
         THEN (NEW.raw_user_meta_data->>'date_of_birth')::date ELSE NULL END
  )
  ON CONFLICT DO NOTHING;

  IF NEW.raw_user_meta_data->>'role' = 'merchant' THEN
    INSERT INTO public.merchants (user_id, store_name, owner_name, address, contact_number, industry_type)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'My Store'),
      NEW.raw_user_meta_data->>'owner_name',
      NEW.raw_user_meta_data->>'address',
      NEW.raw_user_meta_data->>'contact_number',
      NEW.raw_user_meta_data->>'industry_type'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- 6. API key generation / revocation RPCs
CREATE OR REPLACE FUNCTION public.generate_merchant_api_key()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
AS $$
DECLARE
  _merchant_id uuid;
  _raw_key text;
  _hash text;
  _prefix text;
  _was_rotated boolean;
BEGIN
  SELECT id INTO _merchant_id FROM public.merchants WHERE user_id = auth.uid();
  IF _merchant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a merchant');
  END IF;

  _raw_key := 'pk_live_' || encode(extensions.gen_random_bytes(24), 'hex');
  _prefix := substring(_raw_key, 1, 14);
  _hash := encode(extensions.digest(_raw_key, 'sha256'), 'hex');

  SELECT api_key_hash IS NOT NULL INTO _was_rotated FROM public.merchants WHERE id = _merchant_id;

  UPDATE public.merchants
  SET api_key_hash = _hash,
      api_key_prefix = _prefix,
      api_key_created_at = now(),
      api_key_last_used_at = NULL
  WHERE id = _merchant_id;

  INSERT INTO public.merchant_api_key_log (merchant_id, action)
  VALUES (_merchant_id, CASE WHEN _was_rotated THEN 'rotated' ELSE 'created' END);

  RETURN jsonb_build_object(
    'success', true,
    'api_key', _raw_key,
    'prefix', _prefix,
    'created_at', now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_merchant_api_key()
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _merchant_id uuid;
BEGIN
  SELECT id INTO _merchant_id FROM public.merchants WHERE user_id = auth.uid();
  IF _merchant_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a merchant');
  END IF;

  UPDATE public.merchants
  SET api_key_hash = NULL, api_key_prefix = NULL, api_key_created_at = NULL, api_key_last_used_at = NULL
  WHERE id = _merchant_id;

  INSERT INTO public.merchant_api_key_log (merchant_id, action)
  VALUES (_merchant_id, 'revoked');

  RETURN jsonb_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.generate_merchant_api_key() TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_merchant_api_key() TO authenticated;

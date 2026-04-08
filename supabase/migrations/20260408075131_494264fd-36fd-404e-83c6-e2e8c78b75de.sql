
-- =============================================
-- 1. New tables: customer_stamps, promotion_rules, nfc_tap_tokens
-- =============================================

CREATE TABLE public.customer_stamps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  stamps_collected integer NOT NULL DEFAULT 0,
  stamps_required integer NOT NULL DEFAULT 10,
  reward_text text NOT NULL DEFAULT 'Free item',
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_customer_stamps_active ON public.customer_stamps (customer_id, merchant_id) WHERE completed = false;

CREATE TABLE public.promotion_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  rule_type text NOT NULL DEFAULT 'visit_x_get_y',
  trigger_count integer NOT NULL DEFAULT 10,
  reward_description text NOT NULL DEFAULT 'Free item',
  reward_type text NOT NULL DEFAULT 'free_item',
  reward_value text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.nfc_tap_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

-- =============================================
-- 2. RLS policies
-- =============================================

ALTER TABLE public.customer_stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfc_tap_tokens ENABLE ROW LEVEL SECURITY;

-- customer_stamps: customers can view own
CREATE POLICY "Customers can view own stamps" ON public.customer_stamps
  FOR SELECT TO authenticated
  USING (customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()));

-- customer_stamps: merchants can manage own
CREATE POLICY "Merchants can manage own customer stamps" ON public.customer_stamps
  FOR ALL TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- customer_stamps: service role
CREATE POLICY "Service role full access customer_stamps" ON public.customer_stamps
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- promotion_rules: merchants manage own
CREATE POLICY "Merchants can manage own promotion rules" ON public.promotion_rules
  FOR ALL TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- promotion_rules: authenticated can view active
CREATE POLICY "Authenticated users can view active promotions" ON public.promotion_rules
  FOR SELECT TO authenticated
  USING (active = true);

-- nfc_tap_tokens: merchants manage own
CREATE POLICY "Merchants can manage own nfc tokens" ON public.nfc_tap_tokens
  FOR ALL TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- nfc_tap_tokens: service role
CREATE POLICY "Service role full access nfc_tap_tokens" ON public.nfc_tap_tokens
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- =============================================
-- 3. Add override columns to merchant_feature_overrides
-- =============================================

ALTER TABLE public.merchant_feature_overrides
  ADD COLUMN IF NOT EXISTS allow_promotions boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_nfc_tap boolean NOT NULL DEFAULT false;

-- =============================================
-- 4. process_stamp function
-- =============================================

CREATE OR REPLACE FUNCTION public.process_stamp(_customer_id uuid, _merchant_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _stamp RECORD;
  _settings RECORD;
  _new_count integer;
  _completed boolean := false;
BEGIN
  -- Get gamification settings for this merchant
  SELECT stamp_card_enabled, stamps_required, stamp_reward
  INTO _settings
  FROM public.gamification_settings
  WHERE merchant_id = _merchant_id;

  IF _settings IS NULL OR NOT _settings.stamp_card_enabled THEN
    RETURN jsonb_build_object('success', false, 'error', 'Stamp card not enabled for this merchant');
  END IF;

  -- Find or create active stamp card
  SELECT * INTO _stamp
  FROM public.customer_stamps
  WHERE customer_id = _customer_id AND merchant_id = _merchant_id AND completed = false
  FOR UPDATE;

  IF _stamp IS NULL THEN
    INSERT INTO public.customer_stamps (customer_id, merchant_id, stamps_collected, stamps_required, reward_text)
    VALUES (_customer_id, _merchant_id, 1, _settings.stamps_required, COALESCE(_settings.stamp_reward, 'Free item'))
    RETURNING * INTO _stamp;

    RETURN jsonb_build_object(
      'success', true,
      'stamps_collected', 1,
      'stamps_required', _stamp.stamps_required,
      'reward_text', _stamp.reward_text,
      'completed', false
    );
  END IF;

  _new_count := _stamp.stamps_collected + 1;

  IF _new_count >= _stamp.stamps_required THEN
    -- Complete the card
    UPDATE public.customer_stamps
    SET stamps_collected = _new_count, completed = true, completed_at = now(), updated_at = now()
    WHERE id = _stamp.id;

    -- Award bonus points (50 points as reward)
    UPDATE public.customer_merchants
    SET points_balance = points_balance + 50, updated_at = now()
    WHERE customer_id = _customer_id AND merchant_id = _merchant_id;

    UPDATE public.customers
    SET points_balance = points_balance + 50
    WHERE id = _customer_id;

    _completed := true;
  ELSE
    UPDATE public.customer_stamps
    SET stamps_collected = _new_count, updated_at = now()
    WHERE id = _stamp.id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'stamps_collected', _new_count,
    'stamps_required', _stamp.stamps_required,
    'reward_text', _stamp.reward_text,
    'completed', _completed,
    'bonus_points', CASE WHEN _completed THEN 50 ELSE 0 END
  );
END;
$$;

-- Updated_at triggers
CREATE TRIGGER trg_customer_stamps_updated_at BEFORE UPDATE ON public.customer_stamps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_promotion_rules_updated_at BEFORE UPDATE ON public.promotion_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for customer_stamps
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_stamps;

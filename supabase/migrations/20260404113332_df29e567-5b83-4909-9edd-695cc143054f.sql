
-- Create redemptions table
CREATE TABLE public.redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  reward_title text NOT NULL,
  points_spent integer NOT NULL,
  redemption_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  redeemed_at timestamp with time zone DEFAULT now(),
  verified_at timestamp with time zone,
  verified_by uuid,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.redemptions ENABLE ROW LEVEL SECURITY;

-- Customers can view own redemptions
CREATE POLICY "Customers can view own redemptions"
ON public.redemptions FOR SELECT TO authenticated
USING (customer_id IN (
  SELECT id FROM public.customers WHERE user_id = auth.uid()
));

-- Merchants can view redemptions for their store
CREATE POLICY "Merchants can view own redemptions"
ON public.redemptions FOR SELECT TO authenticated
USING (merchant_id IN (
  SELECT id FROM public.merchants WHERE user_id = auth.uid()
));

-- Merchants can update redemptions for their store (verify)
CREATE POLICY "Merchants can update own redemptions"
ON public.redemptions FOR UPDATE TO authenticated
USING (merchant_id IN (
  SELECT id FROM public.merchants WHERE user_id = auth.uid()
));

-- Service role full access
CREATE POLICY "Service role full access redemptions"
ON public.redemptions FOR ALL TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.redemptions;

-- redeem_reward function
CREATE OR REPLACE FUNCTION public.redeem_reward(
  _customer_id uuid,
  _reward_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _customer RECORD;
  _reward RECORD;
  _code text;
  _redemption_id uuid;
BEGIN
  -- Lock customer row to prevent double-spend
  SELECT id, points_balance, full_name, user_id INTO _customer
  FROM public.customers
  WHERE id = _customer_id
  FOR UPDATE;

  IF _customer IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Customer not found');
  END IF;

  -- Verify caller owns this customer
  IF _customer.user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Get reward
  SELECT * INTO _reward
  FROM public.rewards
  WHERE id = _reward_id AND active = true;

  IF _reward IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reward not found or inactive');
  END IF;

  -- Check points
  IF _customer.points_balance < _reward.points_required THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough points');
  END IF;

  -- Generate unique 8-char code
  _code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  -- Deduct points
  UPDATE public.customers
  SET points_balance = points_balance - _reward.points_required
  WHERE id = _customer_id;

  -- Insert redemption
  INSERT INTO public.redemptions (customer_id, merchant_id, reward_id, reward_title, points_spent, redemption_code, status, expires_at)
  VALUES (_customer_id, _reward.merchant_id, _reward_id, _reward.title, _reward.points_required, _code, 'pending', now() + interval '48 hours')
  RETURNING id INTO _redemption_id;

  RETURN jsonb_build_object(
    'success', true,
    'redemption_id', _redemption_id,
    'redemption_code', _code,
    'reward_title', _reward.title,
    'points_spent', _reward.points_required,
    'expires_at', (now() + interval '48 hours')::text
  );
END;
$$;

-- verify_redemption function
CREATE OR REPLACE FUNCTION public.verify_redemption(
  _redemption_code text,
  _merchant_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _redemption RECORD;
  _customer_name text;
  _merchant RECORD;
BEGIN
  -- Verify caller owns the merchant
  SELECT id, user_id INTO _merchant
  FROM public.merchants
  WHERE id = _merchant_id;

  IF _merchant IS NULL OR _merchant.user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized merchant');
  END IF;

  -- Find redemption
  SELECT * INTO _redemption
  FROM public.redemptions
  WHERE redemption_code = upper(trim(_redemption_code))
    AND merchant_id = _merchant_id;

  IF _redemption IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid redemption code');
  END IF;

  IF _redemption.status = 'verified' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This code has already been used');
  END IF;

  IF _redemption.status = 'expired' OR _redemption.expires_at < now() THEN
    -- Mark as expired if not already
    UPDATE public.redemptions SET status = 'expired' WHERE id = _redemption.id AND status = 'pending';
    RETURN jsonb_build_object('success', false, 'error', 'This code has expired');
  END IF;

  -- Get customer name
  SELECT full_name INTO _customer_name FROM public.customers WHERE id = _redemption.customer_id;

  -- Verify
  UPDATE public.redemptions
  SET status = 'verified', verified_at = now(), verified_by = auth.uid()
  WHERE id = _redemption.id;

  RETURN jsonb_build_object(
    'success', true,
    'customer_name', COALESCE(_customer_name, 'Customer'),
    'reward_title', _redemption.reward_title,
    'points_spent', _redemption.points_spent,
    'redeemed_at', _redemption.redeemed_at::text
  );
END;
$$;


-- 1. Update sync_points_on_transaction to write to customer_merchants
CREATE OR REPLACE FUNCTION public.sync_points_on_transaction()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  -- Update global balance (backward compat)
  UPDATE public.customers
  SET points_balance = points_balance + NEW.points_awarded
  WHERE id = NEW.customer_id;

  -- Upsert customer_merchants relationship
  INSERT INTO public.customer_merchants (customer_id, merchant_id, points_balance, total_spend, visit_count, last_visit_at)
  VALUES (NEW.customer_id, NEW.merchant_id, NEW.points_awarded, NEW.purchase_amount, 1, NEW.transaction_date)
  ON CONFLICT (customer_id, merchant_id) DO UPDATE SET
    points_balance = customer_merchants.points_balance + NEW.points_awarded,
    total_spend = customer_merchants.total_spend + NEW.purchase_amount,
    visit_count = customer_merchants.visit_count + 1,
    last_visit_at = GREATEST(customer_merchants.last_visit_at, NEW.transaction_date),
    updated_at = now();

  RETURN NEW;
END;
$function$;

-- 2. Recreate the trigger (in case it was dropped)
DROP TRIGGER IF EXISTS trg_sync_points_on_transaction ON public.transactions;
CREATE TRIGGER trg_sync_points_on_transaction
  AFTER INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_points_on_transaction();

-- 3. Update redeem_reward to use per-merchant balance
CREATE OR REPLACE FUNCTION public.redeem_reward(_customer_id uuid, _reward_id uuid)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  _customer RECORD;
  _reward RECORD;
  _code text;
  _redemption_id uuid;
  _merchant_balance integer;
BEGIN
  -- Lock customer row
  SELECT id, points_balance, full_name, user_id INTO _customer
  FROM public.customers
  WHERE id = _customer_id
  FOR UPDATE;

  IF _customer IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Customer not found');
  END IF;

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

  -- Check per-merchant points balance
  SELECT points_balance INTO _merchant_balance
  FROM public.customer_merchants
  WHERE customer_id = _customer_id AND merchant_id = _reward.merchant_id
  FOR UPDATE;

  IF _merchant_balance IS NULL OR _merchant_balance < _reward.points_required THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough points at this merchant');
  END IF;

  -- Generate unique 8-char code
  _code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  -- Deduct from per-merchant balance
  UPDATE public.customer_merchants
  SET points_balance = points_balance - _reward.points_required, updated_at = now()
  WHERE customer_id = _customer_id AND merchant_id = _reward.merchant_id;

  -- Deduct from global balance (backward compat)
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
$function$;

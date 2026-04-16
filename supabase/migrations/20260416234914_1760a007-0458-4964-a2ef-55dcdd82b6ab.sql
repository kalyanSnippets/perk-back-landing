-- 1) Merchant points-per-dollar setting
ALTER TABLE public.merchants
  ADD COLUMN IF NOT EXISTS points_per_dollar numeric NOT NULL DEFAULT 0.5;

-- 2) Refund tracking on transactions
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS refunded_at timestamptz,
  ADD COLUMN IF NOT EXISTS refunded_by uuid;

CREATE INDEX IF NOT EXISTS idx_transactions_refunded_at ON public.transactions(refunded_at);

-- 3) Universal customer search RPC
CREATE OR REPLACE FUNCTION public.search_customer_universal(_merchant_id uuid, _query text)
RETURNS TABLE(
  customer_id uuid,
  full_name text,
  loyalty_card_number text,
  crn text,
  phone text,
  email text,
  is_linked boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  _q text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.merchants WHERE id = _merchant_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  _q := trim(_query);
  IF _q IS NULL OR length(_q) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT
      c.id AS customer_id,
      c.full_name,
      c.loyalty_card_number,
      c.crn,
      c.phone,
      au.email::text AS email,
      EXISTS (
        SELECT 1 FROM public.customer_merchants cm
        WHERE cm.customer_id = c.id AND cm.merchant_id = _merchant_id
      ) AS is_linked
    FROM public.customers c
    LEFT JOIN auth.users au ON au.id = c.user_id
    WHERE
      c.full_name ILIKE '%' || _q || '%'
      OR c.phone ILIKE '%' || _q || '%'
      OR c.loyalty_card_number ILIKE '%' || _q || '%'
      OR c.crn ILIKE '%' || _q || '%'
      OR au.email ILIKE '%' || _q || '%'
    ORDER BY
      (CASE WHEN c.loyalty_card_number = _q OR c.crn = _q THEN 0 ELSE 1 END),
      c.full_name NULLS LAST
    LIMIT 15;
END;
$$;

-- 4) Update add_points_to_customer to use merchant.points_per_dollar
CREATE OR REPLACE FUNCTION public.add_points_to_customer(
  _loyalty_card_number text,
  _purchase_amount numeric,
  _merchant_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _customer_id uuid;
  _customer_name text;
  _points integer;
  _merchant RECORD;
  _tx_id uuid;
  _ppd numeric;
BEGIN
  SELECT id, store_name, points_per_dollar INTO _merchant
  FROM public.merchants
  WHERE id = _merchant_id AND user_id = auth.uid();

  IF _merchant.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized merchant');
  END IF;

  IF _purchase_amount IS NULL OR _purchase_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid purchase amount');
  END IF;

  SELECT id, full_name INTO _customer_id, _customer_name
  FROM public.customers
  WHERE loyalty_card_number = _loyalty_card_number;

  IF _customer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Customer not found');
  END IF;

  _ppd := COALESCE(_merchant.points_per_dollar, 0.5);
  _points := GREATEST(0, floor(_purchase_amount * _ppd));

  INSERT INTO public.transactions (customer_id, merchant_id, merchant_name, purchase_amount, points_awarded, source)
  VALUES (_customer_id, _merchant_id, _merchant.store_name, _purchase_amount, _points, 'dashboard')
  RETURNING id INTO _tx_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', _tx_id,
    'customer_name', _customer_name,
    'points_awarded', _points,
    'points_per_dollar', _ppd
  );
END;
$$;

-- 5) Refund transaction RPC
CREATE OR REPLACE FUNCTION public.refund_transaction(_tx_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tx RECORD;
  _merchant_user uuid;
  _stamp RECORD;
BEGIN
  SELECT t.*, m.user_id AS merchant_user
  INTO _tx
  FROM public.transactions t
  JOIN public.merchants m ON m.id = t.merchant_id
  WHERE t.id = _tx_id
  FOR UPDATE;

  IF _tx.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction not found');
  END IF;

  IF _tx.merchant_user != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  IF _tx.refunded_at IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Transaction already refunded');
  END IF;

  -- Reverse points on per-merchant relationship
  UPDATE public.customer_merchants
  SET points_balance = GREATEST(0, points_balance - COALESCE(_tx.points_awarded, 0)),
      total_spend = GREATEST(0, total_spend - COALESCE(_tx.purchase_amount, 0)),
      visit_count = GREATEST(0, visit_count - 1),
      updated_at = now()
  WHERE customer_id = _tx.customer_id AND merchant_id = _tx.merchant_id;

  -- Reverse global balance (backward compat)
  UPDATE public.customers
  SET points_balance = GREATEST(0, points_balance - COALESCE(_tx.points_awarded, 0))
  WHERE id = _tx.customer_id;

  -- Decrement active stamp card if applicable
  SELECT * INTO _stamp
  FROM public.customer_stamps
  WHERE customer_id = _tx.customer_id
    AND merchant_id = _tx.merchant_id
    AND completed = false
  FOR UPDATE;

  IF _stamp.id IS NOT NULL AND _stamp.stamps_collected > 0 THEN
    UPDATE public.customer_stamps
    SET stamps_collected = stamps_collected - 1, updated_at = now()
    WHERE id = _stamp.id;
  END IF;

  -- Mark transaction refunded
  UPDATE public.transactions
  SET refunded_at = now(), refunded_by = auth.uid()
  WHERE id = _tx_id;

  RETURN jsonb_build_object(
    'success', true,
    'points_reversed', COALESCE(_tx.points_awarded, 0),
    'amount_reversed', COALESCE(_tx.purchase_amount, 0)
  );
END;
$$;
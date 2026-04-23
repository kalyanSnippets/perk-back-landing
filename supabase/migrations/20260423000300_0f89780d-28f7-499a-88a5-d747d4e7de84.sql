CREATE OR REPLACE FUNCTION public.join_merchant(_merchant_id uuid, _source text DEFAULT 'explore')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _merchant RECORD;
  _customer RECORD;
  _new_crn text;
  _new_card text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT id, store_name, logo_url
  INTO _merchant
  FROM public.merchants
  WHERE id = _merchant_id;

  IF _merchant.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Merchant not found');
  END IF;

  SELECT id, crn, loyalty_card_number, full_name
  INTO _customer
  FROM public.customers
  WHERE user_id = auth.uid();

  IF _customer.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Customer profile missing');
  END IF;

  IF _customer.crn IS NULL OR _customer.loyalty_card_number IS NULL THEN
    LOOP
      _new_crn := lpad(floor(random() * 100000)::text, 5, '0');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.customers WHERE crn = _new_crn);
    END LOOP;

    LOOP
      _new_card := lpad(floor(random() * 10000000000)::text, 10, '0');
      EXIT WHEN NOT EXISTS (SELECT 1 FROM public.customers WHERE loyalty_card_number = _new_card);
    END LOOP;

    UPDATE public.customers
    SET crn = COALESCE(crn, _new_crn),
        loyalty_card_number = COALESCE(loyalty_card_number, _new_card),
        card_issued_at = COALESCE(card_issued_at, now())
    WHERE id = _customer.id
    RETURNING crn, loyalty_card_number INTO _customer.crn, _customer.loyalty_card_number;
  END IF;

  INSERT INTO public.customer_merchants (customer_id, merchant_id, source)
  VALUES (_customer.id, _merchant.id, _source)
  ON CONFLICT (customer_id, merchant_id) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'merchant_id', _merchant.id,
    'merchant_name', _merchant.store_name,
    'merchant_logo', _merchant.logo_url,
    'crn', _customer.crn,
    'loyalty_card_number', _customer.loyalty_card_number,
    'full_name', _customer.full_name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_merchant(uuid, text) TO authenticated;
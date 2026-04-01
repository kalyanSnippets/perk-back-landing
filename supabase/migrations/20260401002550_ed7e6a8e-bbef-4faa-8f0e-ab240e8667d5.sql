
-- Unique partial indexes to prevent duplicate loyalty cards and CRNs
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_loyalty_card_unique
ON public.customers (loyalty_card_number)
WHERE loyalty_card_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_crn_unique
ON public.customers (crn)
WHERE crn IS NOT NULL;

-- Trigger to atomically sync points balance on transaction insert
CREATE OR REPLACE FUNCTION public.sync_points_on_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.customers
  SET points_balance = points_balance + NEW.points_awarded
  WHERE id = NEW.customer_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_sync_points_on_transaction
AFTER INSERT ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.sync_points_on_transaction();

-- Remove manual points update from add_points_to_customer RPC
CREATE OR REPLACE FUNCTION public.add_points_to_customer(_loyalty_card_number text, _purchase_amount numeric, _merchant_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _customer_id uuid;
  _customer_name text;
  _points integer;
  _merchant_name text;
  _tx_id uuid;
BEGIN
  SELECT store_name INTO _merchant_name
  FROM public.merchants
  WHERE id = _merchant_id AND user_id = auth.uid();

  IF _merchant_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized merchant');
  END IF;

  SELECT id, full_name INTO _customer_id, _customer_name
  FROM public.customers
  WHERE loyalty_card_number = _loyalty_card_number;

  IF _customer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Customer not found');
  END IF;

  _points := floor(_purchase_amount / 2);

  INSERT INTO public.transactions (customer_id, merchant_id, merchant_name, purchase_amount, points_awarded, source)
  VALUES (_customer_id, _merchant_id, _merchant_name, _purchase_amount, _points, 'dashboard')
  RETURNING id INTO _tx_id;

  -- Points balance update is now handled by trg_sync_points_on_transaction trigger

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', _tx_id,
    'customer_name', _customer_name,
    'points_awarded', _points
  );
END;
$function$;

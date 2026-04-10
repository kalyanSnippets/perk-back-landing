
CREATE OR REPLACE FUNCTION public.search_customer_by_phone(_merchant_id uuid, _phone text)
RETURNS TABLE(customer_id uuid, full_name text, loyalty_card_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Verify caller owns the merchant
  IF NOT EXISTS (
    SELECT 1 FROM public.merchants WHERE id = _merchant_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
    SELECT c.id AS customer_id, c.full_name, c.loyalty_card_number
    FROM public.customers c
    INNER JOIN public.customer_merchants cm ON cm.customer_id = c.id AND cm.merchant_id = _merchant_id
    WHERE c.phone ILIKE '%' || _phone || '%'
    LIMIT 10;
END;
$$;

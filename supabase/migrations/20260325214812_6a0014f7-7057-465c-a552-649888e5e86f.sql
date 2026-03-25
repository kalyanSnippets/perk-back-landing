
-- Function to look up customer details by IDs (for merchant use)
CREATE OR REPLACE FUNCTION public.get_customers_by_ids(_ids uuid[])
RETURNS TABLE(id uuid, full_name text, loyalty_card_number text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.full_name, c.loyalty_card_number
  FROM public.customers c
  WHERE c.id = ANY(_ids);
$$;

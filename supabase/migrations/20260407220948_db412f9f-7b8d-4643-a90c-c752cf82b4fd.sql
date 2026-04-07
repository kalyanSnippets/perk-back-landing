
-- 1. Fix all negative balances to 0
UPDATE public.customer_merchants
SET points_balance = 0, updated_at = now()
WHERE points_balance < 0;

-- 2. Recalculate global customers.points_balance from customer_merchants
UPDATE public.customers c
SET points_balance = COALESCE(sub.total, 0)
FROM (
  SELECT customer_id, SUM(points_balance) AS total
  FROM public.customer_merchants
  GROUP BY customer_id
) sub
WHERE c.id = sub.customer_id;

-- 3. Add validation trigger to prevent negative points_balance
CREATE OR REPLACE FUNCTION public.validate_customer_merchants_points()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.points_balance < 0 THEN
    NEW.points_balance := 0;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_customer_merchants_points
  BEFORE INSERT OR UPDATE ON public.customer_merchants
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_customer_merchants_points();

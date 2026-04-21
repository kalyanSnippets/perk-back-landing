-- 1. Slug column on merchants
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS slug text;

-- Backfill slugs from store_name
UPDATE public.merchants
SET slug = lower(regexp_replace(regexp_replace(store_name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
WHERE slug IS NULL AND store_name IS NOT NULL;

-- Ensure uniqueness (append short id suffix where needed)
UPDATE public.merchants m
SET slug = m.slug || '-' || substr(m.id::text, 1, 6)
WHERE m.slug IN (
  SELECT slug FROM public.merchants WHERE slug IS NOT NULL GROUP BY slug HAVING count(*) > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS merchants_slug_unique ON public.merchants (slug) WHERE slug IS NOT NULL;

-- 2. source column on customer_merchants
ALTER TABLE public.customer_merchants ADD COLUMN IF NOT EXISTS source text;

-- 3. Unique constraint to make upsert work
CREATE UNIQUE INDEX IF NOT EXISTS customer_merchants_unique ON public.customer_merchants (customer_id, merchant_id);

-- 4. RPC: link customer to merchant + ensure card identity
CREATE OR REPLACE FUNCTION public.join_merchant_by_slug(_slug text, _source text DEFAULT 'qr-poster')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  SELECT id, store_name, logo_url INTO _merchant
  FROM public.merchants WHERE slug = _slug;

  IF _merchant.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Merchant not found');
  END IF;

  SELECT id, crn, loyalty_card_number, full_name INTO _customer
  FROM public.customers WHERE user_id = auth.uid();

  IF _customer.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Customer profile missing');
  END IF;

  -- Generate identity if missing
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

  -- Link customer to merchant
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

-- 5. Public lookup of a merchant by slug (for the welcome screen, before sign-in)
CREATE OR REPLACE FUNCTION public.get_merchant_by_slug(_slug text)
RETURNS TABLE(id uuid, store_name text, logo_url text, industry_type text, address text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, store_name, logo_url, industry_type, address
  FROM public.merchants WHERE slug = _slug LIMIT 1;
$$;
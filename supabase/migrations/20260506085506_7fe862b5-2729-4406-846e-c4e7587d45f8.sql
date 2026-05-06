
-- Hide merchants.contact_number (and limit broad exposure) from non-owners.
-- Strategy: tighten base-table SELECT to owners + admins only, and expose a
-- safe public view (without contact_number) for browsing/discovery.

-- 1. Drop the overly broad SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view public merchant info" ON public.merchants;

-- 2. Allow admins to view all merchants (for admin tooling)
CREATE POLICY "Admins can view all merchants"
  ON public.merchants
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. Create a public view exposing only non-sensitive merchant fields
--    (excludes contact_number). Uses the view owner's privileges so
--    authenticated users can browse merchants for discovery.
DROP VIEW IF EXISTS public.merchants_public;
CREATE VIEW public.merchants_public AS
  SELECT
    id,
    store_name,
    address,
    industry_type,
    profile_image_url,
    logo_url,
    latitude,
    longitude,
    points_per_dollar,
    slug,
    created_at,
    updated_at
  FROM public.merchants;

GRANT SELECT ON public.merchants_public TO authenticated, anon;

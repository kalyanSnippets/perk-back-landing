-- Tighten campaigns visibility: remove broad authenticated read access.
-- AI confidence_score, target_segment, and expected_impact are merchant business intelligence
-- and should not be visible to other merchants/competitors. Customers see campaigns via
-- merchant-scoped queries on the Explore/customer dashboard, which already join through
-- customer_merchants and merchants tables.
DROP POLICY IF EXISTS "Authenticated users can view active campaigns" ON public.campaigns;

-- Allow authenticated customers to view active campaigns of merchants they are enrolled with,
-- preserving the customer dashboard experience without leaking BI to competitors.
CREATE POLICY "Customers can view active campaigns of enrolled merchants"
ON public.campaigns
FOR SELECT
TO authenticated
USING (
  active = true
  AND merchant_id IN (
    SELECT cm.merchant_id
    FROM public.customer_merchants cm
    JOIN public.customers c ON c.id = cm.customer_id
    WHERE c.user_id = auth.uid()
  )
);
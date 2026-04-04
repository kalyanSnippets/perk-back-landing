CREATE POLICY "Authenticated users can view merchant store names"
ON public.merchants FOR SELECT TO authenticated
USING (true);
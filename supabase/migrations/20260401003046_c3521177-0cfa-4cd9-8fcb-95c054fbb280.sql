
-- =============================================
-- 1. Create campaigns table
-- =============================================
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage own campaigns" ON public.campaigns
  FOR ALL TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Authenticated users can view active campaigns" ON public.campaigns
  FOR SELECT TO authenticated
  USING (active = true);

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 2. Create monthly_offers table
-- =============================================
CREATE TABLE public.monthly_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  active boolean NOT NULL DEFAULT true,
  valid_from date,
  valid_to date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.monthly_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage own monthly_offers" ON public.monthly_offers
  FOR ALL TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Authenticated users can view active monthly_offers" ON public.monthly_offers
  FOR SELECT TO authenticated
  USING (active = true);

CREATE TRIGGER update_monthly_offers_updated_at
  BEFORE UPDATE ON public.monthly_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 3. Fix RLS role scoping: customers (public → authenticated)
-- =============================================
DROP POLICY IF EXISTS "Users can insert own customer record" ON public.customers;
CREATE POLICY "Users can insert own customer record" ON public.customers
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own customer record" ON public.customers;
CREATE POLICY "Users can update own customer record" ON public.customers
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own customer record" ON public.customers;
CREATE POLICY "Users can view own customer record" ON public.customers
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- 4. Fix RLS role scoping: merchants (public → authenticated)
-- =============================================
DROP POLICY IF EXISTS "Users can insert own merchant record" ON public.merchants;
CREATE POLICY "Users can insert own merchant record" ON public.merchants
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Merchants can update own record" ON public.merchants;
CREATE POLICY "Merchants can update own record" ON public.merchants
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Merchants can view own record" ON public.merchants;
CREATE POLICY "Merchants can view own record" ON public.merchants
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- =============================================
-- 5. Fix RLS role scoping: transactions (public → authenticated)
-- =============================================
DROP POLICY IF EXISTS "Merchants can insert transactions" ON public.transactions;
CREATE POLICY "Merchants can insert transactions" ON public.transactions
  FOR INSERT TO authenticated
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Merchants can view own transactions" ON public.transactions;
CREATE POLICY "Merchants can view own transactions" ON public.transactions
  FOR SELECT TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT TO authenticated
  USING (customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()));

-- =============================================
-- 6. Fix contact_messages: add constraints + restrict to authenticated
-- =============================================
ALTER TABLE public.contact_messages
  ADD CONSTRAINT chk_contact_name_length CHECK (length(name) <= 100),
  ADD CONSTRAINT chk_contact_email_length CHECK (length(email) <= 255),
  ADD CONSTRAINT chk_contact_message_length CHECK (length(message) <= 2000),
  ADD CONSTRAINT chk_contact_business_name_length CHECK (business_name IS NULL OR length(business_name) <= 200);

DROP POLICY IF EXISTS "Anyone can submit contact form" ON public.contact_messages;
CREATE POLICY "Authenticated users can submit contact form" ON public.contact_messages
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- =============================================
-- 7. Fix function search path on email queue functions
-- =============================================
CREATE OR REPLACE FUNCTION public.enqueue_email(queue_name text, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN pgmq.send(queue_name, payload);
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN pgmq.send(queue_name, payload);
END;
$function$;

CREATE OR REPLACE FUNCTION public.read_email_batch(queue_name text, batch_size integer, vt integer)
 RETURNS TABLE(msg_id bigint, read_ct integer, message jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY SELECT r.msg_id, r.read_ct, r.message FROM pgmq.read(queue_name, vt, batch_size) r;
EXCEPTION WHEN undefined_table THEN
  PERFORM pgmq.create(queue_name);
  RETURN;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_email(queue_name text, message_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN pgmq.delete(queue_name, message_id);
EXCEPTION WHEN undefined_table THEN
  RETURN FALSE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.move_to_dlq(source_queue text, dlq_name text, message_id bigint, payload jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE new_id BIGINT;
BEGIN
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  PERFORM pgmq.delete(source_queue, message_id);
  RETURN new_id;
EXCEPTION WHEN undefined_table THEN
  BEGIN
    PERFORM pgmq.create(dlq_name);
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  SELECT pgmq.send(dlq_name, payload) INTO new_id;
  BEGIN
    PERFORM pgmq.delete(source_queue, message_id);
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
  RETURN new_id;
END;
$function$;

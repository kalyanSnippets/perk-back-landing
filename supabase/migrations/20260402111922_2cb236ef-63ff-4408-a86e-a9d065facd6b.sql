
-- 1. merchant_subscriptions table
CREATE TABLE public.merchant_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE UNIQUE,
  current_plan text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'active',
  billing_cycle text,
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  trial_start_date timestamptz,
  trial_end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Validation trigger for merchant_subscriptions
CREATE OR REPLACE FUNCTION public.validate_merchant_subscription()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.current_plan NOT IN ('free', 'growth', 'pro') THEN
    RAISE EXCEPTION 'Invalid plan: %', NEW.current_plan;
  END IF;
  IF NEW.status NOT IN ('active', 'trial', 'cancelled', 'expired') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  IF NEW.billing_cycle IS NOT NULL AND NEW.billing_cycle NOT IN ('monthly', 'yearly') THEN
    RAISE EXCEPTION 'Invalid billing_cycle: %', NEW.billing_cycle;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_merchant_subscription
  BEFORE INSERT OR UPDATE ON public.merchant_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.validate_merchant_subscription();

-- updated_at trigger
CREATE TRIGGER trg_merchant_subscriptions_updated_at
  BEFORE UPDATE ON public.merchant_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.merchant_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own subscription"
  ON public.merchant_subscriptions FOR SELECT TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Admins full access merchant_subscriptions"
  ON public.merchant_subscriptions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access merchant_subscriptions"
  ON public.merchant_subscriptions FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 2. merchant_feature_overrides table
CREATE TABLE public.merchant_feature_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE UNIQUE,
  allow_campaigns boolean NOT NULL DEFAULT false,
  allow_rewards boolean NOT NULL DEFAULT false,
  allow_analytics boolean NOT NULL DEFAULT false,
  allow_ai_suggestions boolean NOT NULL DEFAULT false,
  allow_pos_integration boolean NOT NULL DEFAULT false,
  allow_advanced_reports boolean NOT NULL DEFAULT false,
  allow_gamification boolean NOT NULL DEFAULT false,
  allow_birthday_offers boolean NOT NULL DEFAULT false,
  allow_monthly_offers boolean NOT NULL DEFAULT false,
  allow_priority_support boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_merchant_feature_overrides_updated_at
  BEFORE UPDATE ON public.merchant_feature_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.merchant_feature_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own overrides"
  ON public.merchant_feature_overrides FOR SELECT TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Admins full access merchant_feature_overrides"
  ON public.merchant_feature_overrides FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access merchant_feature_overrides"
  ON public.merchant_feature_overrides FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 3. Auto-create subscription on merchant insert
CREATE OR REPLACE FUNCTION public.auto_create_merchant_subscription()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.merchant_subscriptions (merchant_id, current_plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (merchant_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_create_subscription
  AFTER INSERT ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_merchant_subscription();

-- 4. Backfill existing merchants
INSERT INTO public.merchant_subscriptions (merchant_id, current_plan, status)
SELECT id, 'free', 'active' FROM public.merchants
ON CONFLICT (merchant_id) DO NOTHING;

-- 5. Admin RPC for merchant management
CREATE OR REPLACE FUNCTION public.admin_get_all_merchants_with_plans()
RETURNS TABLE (
  merchant_id uuid,
  store_name text,
  email text,
  current_plan text,
  plan_status text,
  customer_count bigint,
  trial_end_date timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY
    SELECT
      m.id AS merchant_id,
      m.store_name,
      au.email::text,
      COALESCE(ms.current_plan, 'free') AS current_plan,
      COALESCE(ms.status, 'active') AS plan_status,
      (SELECT COUNT(DISTINCT t.customer_id) FROM public.transactions t WHERE t.merchant_id = m.id) AS customer_count,
      ms.trial_end_date,
      m.created_at,
      COALESCE(ms.updated_at, m.updated_at) AS updated_at
    FROM public.merchants m
    JOIN auth.users au ON au.id = m.user_id
    LEFT JOIN public.merchant_subscriptions ms ON ms.merchant_id = m.id
    ORDER BY m.created_at DESC;
END;
$$;

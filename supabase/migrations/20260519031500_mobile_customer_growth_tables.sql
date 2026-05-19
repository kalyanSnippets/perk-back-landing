-- Customer mobile growth tables for notifications, preferences, referrals,
-- milestones, and first-use setup state.

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  merchant_id uuid REFERENCES public.merchants(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (
    type IN (
      'points_earned',
      'reward_available',
      'offer',
      'birthday',
      'voucher_expiring',
      'system'
    )
  ),
  title text NOT NULL,
  body text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  deep_link text,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access notifications" ON public.notifications;
CREATE POLICY "Service role full access notifications"
ON public.notifications FOR ALL TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_customer
  ON public.notifications(customer_id);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  points_earned boolean NOT NULL DEFAULT true,
  nearby_offers boolean NOT NULL DEFAULT true,
  birthday_rewards boolean NOT NULL DEFAULT true,
  voucher_expiring boolean NOT NULL DEFAULT true,
  perkback_updates boolean NOT NULL DEFAULT false,
  email_digest boolean NOT NULL DEFAULT false,
  push_enabled boolean NOT NULL DEFAULT false,
  push_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can view own notification preferences"
ON public.notification_preferences FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can insert own notification preferences"
ON public.notification_preferences FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can update own notification preferences"
ON public.notification_preferences FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  appearance text NOT NULL DEFAULT 'system' CHECK (appearance IN ('light', 'dark', 'system')),
  share_location_with_merchants boolean NOT NULL DEFAULT false,
  location_enabled boolean NOT NULL DEFAULT false,
  tutorial_seen boolean NOT NULL DEFAULT false,
  checklist_collapsed boolean NOT NULL DEFAULT false,
  checklist_completed_at timestamptz,
  deleted_at timestamptz,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
CREATE POLICY "Users can view own settings"
ON public.user_settings FOR SELECT TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
CREATE POLICY "Users can insert own settings"
ON public.user_settings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings"
ON public.user_settings FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  referred_customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  referral_code text NOT NULL,
  referred_email text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'joined', 'qualified', 'rewarded', 'cancelled')),
  referrer_points_awarded integer NOT NULL DEFAULT 0,
  referred_points_awarded integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  joined_at timestamptz,
  qualified_at timestamptz,
  rewarded_at timestamptz,
  UNIQUE (referred_customer_id),
  UNIQUE (referral_code, referred_email)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own referrals" ON public.referrals;
CREATE POLICY "Customers can view own referrals"
ON public.referrals FOR SELECT TO authenticated
USING (
  referrer_customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
  OR referred_customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Customers can create own referrals" ON public.referrals;
CREATE POLICY "Customers can create own referrals"
ON public.referrals FOR INSERT TO authenticated
WITH CHECK (
  referrer_customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Service role full access referrals" ON public.referrals;
CREATE POLICY "Service role full access referrals"
ON public.referrals FOR ALL TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_referrals_referrer
  ON public.referrals(referrer_customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_referrals_referred
  ON public.referrals(referred_customer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code
  ON public.referrals(referral_code);

CREATE TABLE IF NOT EXISTS public.user_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  milestone_key text NOT NULL,
  title text NOT NULL,
  description text,
  points_value integer,
  earned_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE (customer_id, milestone_key)
);

ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own milestones" ON public.user_milestones;
CREATE POLICY "Customers can view own milestones"
ON public.user_milestones FOR SELECT TO authenticated
USING (customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Service role full access milestones" ON public.user_milestones;
CREATE POLICY "Service role full access milestones"
ON public.user_milestones FOR ALL TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_user_milestones_customer
  ON public.user_milestones(customer_id, earned_at DESC);

CREATE OR REPLACE FUNCTION public.handle_new_user_mobile_defaults()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_mobile_defaults_created ON auth.users;
CREATE TRIGGER on_auth_user_mobile_defaults_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_mobile_defaults();

INSERT INTO public.notification_preferences (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_settings (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

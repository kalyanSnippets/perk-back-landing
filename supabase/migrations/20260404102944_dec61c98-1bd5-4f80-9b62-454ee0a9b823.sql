
-- rewards table
CREATE TABLE public.rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL REFERENCES public.merchants(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  points_required integer NOT NULL DEFAULT 100,
  reward_type text NOT NULL DEFAULT 'discount',
  active boolean NOT NULL DEFAULT true,
  is_limited_time boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage own rewards"
  ON public.rewards FOR ALL TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Authenticated users can view active rewards"
  ON public.rewards FOR SELECT TO authenticated
  USING (active = true);

-- birthday_offer_settings table
CREATE TABLE public.birthday_offer_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL UNIQUE REFERENCES public.merchants(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  reward_type text NOT NULL DEFAULT 'points_bonus',
  reward_value text NOT NULL DEFAULT '50',
  message text DEFAULT 'Happy Birthday! Enjoy your special reward.',
  days_before integer NOT NULL DEFAULT 0,
  days_valid integer NOT NULL DEFAULT 7,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.birthday_offer_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage own birthday settings"
  ON public.birthday_offer_settings FOR ALL TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- gamification_settings table
CREATE TABLE public.gamification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id uuid NOT NULL UNIQUE REFERENCES public.merchants(id) ON DELETE CASCADE,
  stamp_card_enabled boolean NOT NULL DEFAULT false,
  stamps_required integer NOT NULL DEFAULT 10,
  stamp_reward text DEFAULT 'Free item',
  visit_streak_enabled boolean NOT NULL DEFAULT false,
  streak_threshold integer NOT NULL DEFAULT 5,
  streak_reward text DEFAULT 'Bonus points',
  levels_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gamification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can manage own gamification settings"
  ON public.gamification_settings FOR ALL TO authenticated
  USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
  WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- Add columns to campaigns table for AI features
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS expected_impact text,
  ADD COLUMN IF NOT EXISTS confidence_score numeric,
  ADD COLUMN IF NOT EXISTS ai_generated boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS target_segment text;

-- updated_at triggers
CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON public.rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_birthday_settings_updated_at BEFORE UPDATE ON public.birthday_offer_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gamification_settings_updated_at BEFORE UPDATE ON public.gamification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

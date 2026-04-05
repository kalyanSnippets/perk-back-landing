ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE public.merchant_subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE public.merchant_subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
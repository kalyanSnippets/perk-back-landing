
-- Create merchants table
CREATE TABLE public.merchants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants can view own record" ON public.merchants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Merchants can update own record" ON public.merchants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own merchant record" ON public.merchants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_merchants_user_id ON public.merchants(user_id);

-- Add merchant_id and source columns to transactions
ALTER TABLE public.transactions
  ADD COLUMN merchant_id uuid REFERENCES public.merchants(id),
  ADD COLUMN source text DEFAULT 'dashboard';

CREATE INDEX idx_transactions_merchant_id ON public.transactions(merchant_id);

-- Allow merchants to view their own transactions
CREATE POLICY "Merchants can view own transactions" ON public.transactions
  FOR SELECT USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- Allow merchants to insert transactions
CREATE POLICY "Merchants can insert transactions" ON public.transactions
  FOR INSERT WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

-- Security definer function for adding points atomically
CREATE OR REPLACE FUNCTION public.add_points_to_customer(
  _loyalty_card_number text,
  _purchase_amount numeric,
  _merchant_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _customer_id uuid;
  _customer_name text;
  _points integer;
  _merchant_name text;
  _tx_id uuid;
BEGIN
  -- Verify merchant ownership
  SELECT store_name INTO _merchant_name
  FROM public.merchants
  WHERE id = _merchant_id AND user_id = auth.uid();

  IF _merchant_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized merchant');
  END IF;

  -- Find customer by loyalty card number
  SELECT id, full_name INTO _customer_id, _customer_name
  FROM public.customers
  WHERE loyalty_card_number = _loyalty_card_number;

  IF _customer_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Customer not found');
  END IF;

  -- Calculate points: 1 point per $2 spent
  _points := floor(_purchase_amount / 2);

  -- Create transaction record
  INSERT INTO public.transactions (customer_id, merchant_id, merchant_name, purchase_amount, points_awarded, source)
  VALUES (_customer_id, _merchant_id, _merchant_name, _purchase_amount, _points, 'dashboard')
  RETURNING id INTO _tx_id;

  -- Update customer points balance
  UPDATE public.customers
  SET points_balance = points_balance + _points
  WHERE id = _customer_id;

  RETURN jsonb_build_object(
    'success', true,
    'transaction_id', _tx_id,
    'customer_name', _customer_name,
    'points_awarded', _points
  );
END;
$$;

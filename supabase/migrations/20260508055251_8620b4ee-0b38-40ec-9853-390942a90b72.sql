
CREATE TABLE public.merchant_card_designs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  merchant_id uuid NOT NULL UNIQUE,
  primary_color text NOT NULL DEFAULT '#0a1f5c',
  secondary_color text NOT NULL DEFAULT '#4d8fd6',
  text_color text NOT NULL DEFAULT '#ffffff',
  background_image_url text,
  card_style text NOT NULL DEFAULT 'gradient',
  show_logo boolean NOT NULL DEFAULT true,
  show_points boolean NOT NULL DEFAULT true,
  barcode_format text NOT NULL DEFAULT 'both',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT card_style_check CHECK (card_style IN ('gradient','solid','image')),
  CONSTRAINT barcode_format_check CHECK (barcode_format IN ('code128','qr','both'))
);

ALTER TABLE public.merchant_card_designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Merchants manage own card design"
ON public.merchant_card_designs
FOR ALL TO authenticated
USING (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()))
WITH CHECK (merchant_id IN (SELECT id FROM public.merchants WHERE user_id = auth.uid()));

CREATE POLICY "Customers view designs of enrolled merchants"
ON public.merchant_card_designs
FOR SELECT TO authenticated
USING (merchant_id IN (
  SELECT cm.merchant_id FROM public.customer_merchants cm
  JOIN public.customers c ON c.id = cm.customer_id
  WHERE c.user_id = auth.uid()
));

CREATE TRIGGER update_merchant_card_designs_updated_at
BEFORE UPDATE ON public.merchant_card_designs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

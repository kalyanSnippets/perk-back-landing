
-- Add new columns to customers
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS date_of_birth date;

-- Add new columns to merchants
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS contact_number text;
ALTER TABLE public.merchants ADD COLUMN IF NOT EXISTS industry_type text;

-- Update handle_new_user to store new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Always create a customer record
  INSERT INTO public.customers (user_id, full_name, phone, date_of_birth)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    NEW.raw_user_meta_data->>'phone',
    CASE 
      WHEN NEW.raw_user_meta_data->>'date_of_birth' IS NOT NULL 
      THEN (NEW.raw_user_meta_data->>'date_of_birth')::date
      ELSE NULL
    END
  )
  ON CONFLICT DO NOTHING;

  -- If merchant role, also create merchant record
  IF NEW.raw_user_meta_data->>'role' = 'merchant' THEN
    INSERT INTO public.merchants (user_id, store_name, address, contact_number, industry_type)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'My Store'),
      NEW.raw_user_meta_data->>'address',
      NEW.raw_user_meta_data->>'contact_number',
      NEW.raw_user_meta_data->>'industry_type'
    )
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;


CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Always create a customer record
  INSERT INTO public.customers (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  
  -- If role is merchant, also create a merchant record
  IF NEW.raw_user_meta_data->>'role' = 'merchant' THEN
    INSERT INTO public.merchants (user_id, store_name)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'My Store')
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

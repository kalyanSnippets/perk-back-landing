
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.customers (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  
  IF NEW.raw_user_meta_data->>'role' = 'merchant' THEN
    INSERT INTO public.merchants (user_id, store_name)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'My Store')
    );
  END IF;
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

INSERT INTO public.merchants (user_id, store_name)
SELECT '481e75f7-a198-4093-b642-fac04aa9254c', 'KK shop'
WHERE NOT EXISTS (
  SELECT 1 FROM public.merchants WHERE user_id = '481e75f7-a198-4093-b642-fac04aa9254c'
);

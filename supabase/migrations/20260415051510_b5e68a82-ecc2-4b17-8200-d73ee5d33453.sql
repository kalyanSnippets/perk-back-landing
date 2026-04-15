-- Fix: make the view use SECURITY INVOKER so RLS of the caller is enforced
ALTER VIEW public.safe_pos_connections SET (security_invoker = on);
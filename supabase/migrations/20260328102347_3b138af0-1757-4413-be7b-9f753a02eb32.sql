
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
RETURNS TABLE(user_id uuid, email text, full_name text, roles text[])
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  RETURN QUERY
    SELECT au.id AS user_id, au.email::text,
           COALESCE(c.full_name, '')::text AS full_name,
           COALESCE(ARRAY_AGG(ur.role::text) FILTER (WHERE ur.role IS NOT NULL), ARRAY[]::text[]) AS roles
    FROM auth.users au
    LEFT JOIN public.customers c ON c.user_id = au.id
    LEFT JOIN public.user_roles ur ON ur.user_id = au.id
    GROUP BY au.id, au.email, c.full_name
    ORDER BY au.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_role(
  _target_user_id uuid,
  _role app_role,
  _action text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF _action = 'grant' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_target_user_id, _role)
    ON CONFLICT DO NOTHING;
  ELSIF _action = 'revoke' THEN
    DELETE FROM public.user_roles WHERE user_id = _target_user_id AND role = _role;
  ELSE
    RAISE EXCEPTION 'Invalid action: use grant or revoke';
  END IF;
END;
$$;

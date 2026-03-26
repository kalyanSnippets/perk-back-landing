
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS: admins can view user_roles
CREATE POLICY "Admins can view user_roles"
ON public.user_roles FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS: admins can manage user_roles
CREATE POLICY "Admins can insert user_roles"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete user_roles"
ON public.user_roles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Testimonials: authenticated users can insert (unpublished only)
CREATE POLICY "Authenticated users can submit testimonials"
ON public.testimonials FOR INSERT TO authenticated
WITH CHECK (is_published = false);

-- Testimonials: admins can select all
CREATE POLICY "Admins can view all testimonials"
ON public.testimonials FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Testimonials: admins can update
CREATE POLICY "Admins can update testimonials"
ON public.testimonials FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Testimonials: admins can delete
CREATE POLICY "Admins can delete testimonials"
ON public.testimonials FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Blogs: admins can select all (including unpublished)
CREATE POLICY "Admins can view all blogs"
ON public.blogs FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Blogs: admins can insert
CREATE POLICY "Admins can insert blogs"
ON public.blogs FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Blogs: admins can update
CREATE POLICY "Admins can update blogs"
ON public.blogs FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Blogs: admins can delete
CREATE POLICY "Admins can delete blogs"
ON public.blogs FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Contact messages: admins can read
CREATE POLICY "Admins can view contact messages"
ON public.contact_messages FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

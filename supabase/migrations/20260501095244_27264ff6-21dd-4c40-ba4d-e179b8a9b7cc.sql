-- Subscription codes table
CREATE TABLE public.subscription_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  duration_days integer NOT NULL DEFAULT 30,
  is_used boolean NOT NULL DEFAULT false,
  used_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.subscription_codes ENABLE ROW LEVEL SECURITY;

-- Roles enum + user_roles table for admin checks
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS for subscription_codes
-- Admins can do everything
CREATE POLICY "Admins manage codes" ON public.subscription_codes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can read codes (needed to validate when redeeming);
-- only unused codes are exposed
CREATE POLICY "Users can read unused codes for redemption" ON public.subscription_codes
  FOR SELECT USING (auth.uid() IS NOT NULL AND is_used = false);

-- Users can mark a code as used by themselves (redemption)
CREATE POLICY "Users can redeem unused codes" ON public.subscription_codes
  FOR UPDATE USING (auth.uid() IS NOT NULL AND is_used = false)
  WITH CHECK (used_by = auth.uid() AND is_used = true);

-- Add username to profiles for unique handle + searching
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (lower(username));
CREATE INDEX IF NOT EXISTS profiles_name_idx ON public.profiles (lower(name));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_until timestamp with time zone;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS premium_seen boolean NOT NULL DEFAULT false;
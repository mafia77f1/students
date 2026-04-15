
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS duration_days integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS title text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS end_date date DEFAULT NULL;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_tour_completed boolean DEFAULT false;

-- Per-user, per-subject study target (minutes)
CREATE TABLE public.study_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  target_minutes INTEGER NOT NULL DEFAULT 240,
  last_session_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, subject)
);

ALTER TABLE public.study_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own targets"
  ON public.study_targets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_study_targets_updated
  BEFORE UPDATE ON public.study_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Per-user, per-subject resume state (Pomodoro)
CREATE TABLE public.study_resume (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  subject TEXT NOT NULL,
  session_id UUID,
  round INTEGER NOT NULL DEFAULT 1,
  round_seconds INTEGER NOT NULL DEFAULT 1500,
  time_left INTEGER NOT NULL DEFAULT 1500,
  is_break BOOLEAN NOT NULL DEFAULT false,
  studied_seconds INTEGER NOT NULL DEFAULT 0,
  break_seconds INTEGER NOT NULL DEFAULT 0,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, subject)
);

ALTER TABLE public.study_resume ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own resume"
  ON public.study_resume FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Last opened book on profile
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_book TEXT;
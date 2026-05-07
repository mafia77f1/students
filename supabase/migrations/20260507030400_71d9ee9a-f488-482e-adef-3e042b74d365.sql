
-- Notes (الملازم)
CREATE TABLE public.study_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  grade TEXT,
  title TEXT NOT NULL,
  description TEXT,
  author TEXT,
  cover_url TEXT,
  download_url TEXT,
  purchase_url TEXT,
  price NUMERIC DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  downloads_count INTEGER DEFAULT 0,
  average_rating NUMERIC DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.study_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Notes viewable by everyone" ON public.study_notes FOR SELECT USING (true);
CREATE POLICY "Admins can insert notes" ON public.study_notes FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update notes" ON public.study_notes FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete notes" ON public.study_notes FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_study_notes_updated_at BEFORE UPDATE ON public.study_notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Note ratings
CREATE TABLE public.note_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.study_notes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(note_id, user_id)
);
ALTER TABLE public.note_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Note ratings viewable by everyone" ON public.note_ratings FOR SELECT USING (true);
CREATE POLICY "Users can rate notes" ON public.note_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rating" ON public.note_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own rating" ON public.note_ratings FOR DELETE USING (auth.uid() = user_id);

-- Hidden subjects on profiles (so user can dismiss finished/unwanted subjects from progress list)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hidden_subjects TEXT[] NOT NULL DEFAULT '{}'::text[];

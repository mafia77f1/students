
-- Add role column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'student';

-- Challenges table
CREATE TABLE public.challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id uuid NOT NULL,
  challenged_id uuid NOT NULL,
  subject text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 25,
  status text NOT NULL DEFAULT 'pending',
  challenger_xp integer DEFAULT 0,
  challenged_xp integer DEFAULT 0,
  winner_id uuid,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  ended_at timestamptz
);
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their challenges" ON public.challenges FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);
CREATE POLICY "Users can create challenges" ON public.challenges FOR INSERT WITH CHECK (auth.uid() = challenger_id);
CREATE POLICY "Participants can update challenges" ON public.challenges FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = challenged_id);

-- Student grades table
CREATE TABLE public.student_grades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  grade_value numeric,
  max_grade numeric DEFAULT 100,
  semester text,
  academic_year text,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.student_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own grades" ON public.student_grades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own grades" ON public.student_grades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own grades" ON public.student_grades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own grades" ON public.student_grades FOR DELETE USING (auth.uid() = user_id);

-- Study plans (AI generated)
CREATE TABLE public.study_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subject text NOT NULL,
  plan_content text NOT NULL,
  is_active boolean DEFAULT true,
  progress integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plans" ON public.study_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own plans" ON public.study_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own plans" ON public.study_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own plans" ON public.study_plans FOR DELETE USING (auth.uid() = user_id);

-- Direct messages
CREATE TABLE public.direct_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  text text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their messages" ON public.direct_messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.direct_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receiver can update read status" ON public.direct_messages FOR UPDATE USING (auth.uid() = receiver_id);

-- Teacher profiles (extra info for teachers)
CREATE TABLE public.teacher_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  bio text,
  specialization text,
  youtube_url text,
  twitter_url text,
  instagram_url text,
  telegram_url text,
  website_url text,
  average_rating numeric DEFAULT 0,
  total_ratings integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teacher profiles viewable by everyone" ON public.teacher_profiles FOR SELECT USING (true);
CREATE POLICY "Teachers can insert own profile" ON public.teacher_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Teachers can update own profile" ON public.teacher_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Teacher ratings
CREATE TABLE public.teacher_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL,
  student_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 10),
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(teacher_id, student_id)
);
ALTER TABLE public.teacher_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ratings viewable by everyone" ON public.teacher_ratings FOR SELECT USING (true);
CREATE POLICY "Students can rate teachers" ON public.teacher_ratings FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update own rating" ON public.teacher_ratings FOR UPDATE USING (auth.uid() = student_id);

-- Enable realtime for challenges and direct messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.challenges;
ALTER PUBLICATION supabase_realtime ADD TABLE public.direct_messages;

-- Trigger for study_plans updated_at
CREATE TRIGGER update_study_plans_updated_at BEFORE UPDATE ON public.study_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_teacher_profiles_updated_at BEFORE UPDATE ON public.teacher_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- Drop study rooms entirely
DROP TABLE IF EXISTS public.room_messages CASCADE;
DROP TABLE IF EXISTS public.room_participants CASCADE;
DROP TABLE IF EXISTS public.study_rooms CASCADE;

-- Friendships
CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','blocked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (requester_id, addressee_id),
  CHECK (requester_id <> addressee_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.friendships TO authenticated;
GRANT ALL ON public.friendships TO service_role;

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fs_select_involved" ON public.friendships
  FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "fs_insert_requester" ON public.friendships
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "fs_update_addressee" ON public.friendships
  FOR UPDATE TO authenticated
  USING (auth.uid() = addressee_id OR auth.uid() = requester_id)
  WITH CHECK (auth.uid() = addressee_id OR auth.uid() = requester_id);

CREATE POLICY "fs_delete_involved" ON public.friendships
  FOR DELETE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE TRIGGER trg_friendships_updated
BEFORE UPDATE ON public.friendships
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: are two users friends (accepted)?
CREATE OR REPLACE FUNCTION public.are_friends(_a uuid, _b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.friendships
    WHERE status = 'accepted'
      AND ((requester_id = _a AND addressee_id = _b)
        OR (requester_id = _b AND addressee_id = _a))
  );
$$;

-- Tighten direct_messages: only between friends
DROP POLICY IF EXISTS "Users can send messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can view their messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update their received messages" ON public.direct_messages;
DROP POLICY IF EXISTS "dm_insert" ON public.direct_messages;
DROP POLICY IF EXISTS "dm_select" ON public.direct_messages;
DROP POLICY IF EXISTS "dm_update" ON public.direct_messages;

CREATE POLICY "dm_select" ON public.direct_messages
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "dm_insert" ON public.direct_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.are_friends(sender_id, receiver_id)
  );

CREATE POLICY "dm_update" ON public.direct_messages
  FOR UPDATE TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;

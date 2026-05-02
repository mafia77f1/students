import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { hydrateStudyState, clearStudyCache } from "@/lib/study-targets";

export interface Profile {
  id: string;
  name: string;
  country: string;
  age: number | null;
  grade: string;
  subjects: string[];
  total_hours: number;
  total_xp: number;
  weekly_xp: number;
  level: number;
  rank: string;
  role: string;
  onboarding_completed: boolean;
  avatar_url: string | null;
  is_premium?: boolean;
  premium_until?: string | null;
  premium_seen?: boolean;
  username?: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: string[];
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  roles: [],
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    const p = data as Profile | null;
    setProfile(p);
    // Hydrate study cache from cloud once we know subjects
    if (p) hydrateStudyState(userId, p.subjects || []).catch(() => {});
  };

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    setRoles(((data as any[]) || []).map((r) => r.role));
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
      await fetchRoles(user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchRoles(session.user.id);
          }, 500);
        } else {
          clearStudyCache(user?.id);
          setProfile(null);
          setRoles([]);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Realtime: keep profile + roles fresh (premium activation, role changes)
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`user-sync-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `id=eq.${user.id}` },
        (payload) => {
          if (payload.new) setProfile(payload.new as Profile);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_roles", filter: `user_id=eq.${user.id}` },
        () => fetchRoles(user.id)
      )
      .subscribe();

    // Re-check premium expiry every minute (locks features the second they expire)
    const interval = setInterval(() => {
      setProfile((p) => (p ? { ...p } : p));
    }, 60_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [user?.id]);

  return (
    <AuthContext.Provider value={{ session, user, profile, roles, loading, signOut: async () => { await supabase.auth.signOut(); }, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

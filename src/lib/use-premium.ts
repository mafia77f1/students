import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";

/** Synchronous premium check from cached profile (kept fresh by realtime). */
export function useIsPremium(): boolean {
  const { profile } = useAuth();
  return isPremiumProfile(profile);
}

/** Check if the current user has the admin role. */
export function useIsAdmin(): boolean {
  const { roles } = useAuth();
  return roles.includes("admin");
}

export function isPremiumProfile(profile: { is_premium?: boolean; premium_until?: string | null } | null): boolean {
  if (!profile?.is_premium) return false;
  if (!profile.premium_until) return true;
  return new Date(profile.premium_until).getTime() > Date.now();
}

/**
 * Authoritative server-side premium re-check. Call before unlocking or
 * persisting any premium-only data so a stale local cache cannot be used
 * to bypass gating.
 */
export async function verifyPremiumLive(userId: string): Promise<boolean> {
  if (!userId) return false;
  const { data } = await supabase
    .from("profiles")
    .select("is_premium, premium_until")
    .eq("id", userId)
    .maybeSingle();
  return isPremiumProfile(data as any);
}

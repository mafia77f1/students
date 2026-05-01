import { useAuth } from "@/lib/auth-context";

/** Helper hook — checks if the current user has an active premium subscription. */
export function useIsPremium(): boolean {
  const { profile } = useAuth();
  if (!profile?.is_premium) return false;
  if (!profile.premium_until) return true; // lifetime
  return new Date(profile.premium_until).getTime() > Date.now();
}

export function useIsAdmin(): boolean {
  const { roles } = useAuth() as any;
  return Array.isArray(roles) && roles.includes("admin");
}

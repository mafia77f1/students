import { useAuth } from "@/lib/auth-context";

/** Check if the current user has an active premium subscription. */
export function useIsPremium(): boolean {
  const { profile } = useAuth();
  if (!profile?.is_premium) return false;
  if (!profile.premium_until) return true;
  return new Date(profile.premium_until).getTime() > Date.now();
}

/** Check if the current user has the admin role. */
export function useIsAdmin(): boolean {
  const { roles } = useAuth();
  return roles.includes("admin");
}

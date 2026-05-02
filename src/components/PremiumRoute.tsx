import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useIsPremium } from "@/lib/use-premium";

/** Locks a route behind an active premium subscription; redirects to /premium otherwise. */
export function PremiumRoute({ children }: { children: ReactNode }) {
  const isPremium = useIsPremium();
  if (!isPremium) return <Navigate to="/premium" replace />;
  return <>{children}</>;
}

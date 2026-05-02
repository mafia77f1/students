import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/use-premium";
import { LoadingScreen } from "@/components/LoadingScreen";

/** Guards a route so only authenticated admins can access it. */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { loading, session } = useAuth();
  const isAdmin = useIsAdmin();

  if (loading) return <LoadingScreen label="جاري التحقق..." />;
  if (!session) return <Navigate to="/" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <>{children}</>;
}

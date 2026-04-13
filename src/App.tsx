import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { Layout } from "@/components/Layout";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Index from "./pages/Index";
import Lobby from "./pages/Lobby";
import StudyRoom from "./pages/StudyRoom";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import StartStudy from "./pages/StartStudy";
import StudySession from "./pages/StudySession";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl gradient-primary mx-auto mb-3 animate-pulse" />
          <p className="text-muted-foreground text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!session) return <Auth />;
  if (profile && !profile.onboarding_completed) return <Onboarding />;

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Index />} />
        <Route path="/lobby" element={<Lobby />} />
        <Route path="/room/:id" element={<StudyRoom />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/start-study" element={<StartStudy />} />
        <Route path="/study-session/:id" element={<StudySession />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { Layout } from "@/components/Layout";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Splash from "./pages/Splash";
import Index from "./pages/Index";
import Lobby from "./pages/Lobby";
import StudyRoom from "./pages/StudyRoom";
import Leaderboard from "./pages/Leaderboard";
import Profile from "./pages/Profile";
import StartStudy from "./pages/StartStudy";
import StudySession from "./pages/StudySession";
import Challenges from "./pages/Challenges";
import Grades from "./pages/Grades";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import UserProfile from "./pages/UserProfile";
import TeachersList from "./pages/TeachersList";
import NotFound from "./pages/NotFound";
import { LoadingScreen } from "@/components/LoadingScreen";

const queryClient = new QueryClient();

function AppRoutes() {
  const { session, profile, loading } = useAuth();
  const [splashSeen, setSplashSeen] = useState(() => localStorage.getItem("splash_seen") === "1");

  if (loading) return <LoadingScreen label="جاري تجهيز رحلتك..." />;

  if (!splashSeen) return <Splash onFinish={() => setSplashSeen(true)} />;
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
        <Route path="/challenges" element={<Challenges />} />
        <Route path="/grades" element={<Grades />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/user/:id" element={<UserProfile />} />
        <Route path="/teachers" element={<TeachersList />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

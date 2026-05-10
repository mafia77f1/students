import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, BookOpen, Trophy, User, Swords, Settings, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const navItems = [
    { label: "الرئيسية", path: "/", icon: Home },
    { label: "الملازم", path: "/notes", icon: BookOpen },
    { label: "التحدي", path: "/challenges", icon: Swords },
    { label: "الصدارة", path: "/leaderboard", icon: Trophy },
    { label: "حسابي", path: "/profile", icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="h-14 flex items-center px-4 sticky top-0 z-30 glass">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center font-black text-white text-sm glow-primary group-hover:scale-110 transition-transform">
            ط
          </div>
          <h1 className="text-lg font-black gradient-text tracking-tight">طلاب</h1>
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate("/messages")}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all"
          >
            <MessageCircle className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={() => navigate("/settings")}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all"
          >
            <Settings className="h-4.5 w-4.5" />
          </button>
          {profile?.avatar_url && (
            <button
              onClick={() => navigate("/profile")}
              className="w-9 h-9 rounded-xl overflow-hidden ring-2 ring-primary/30 hover:ring-primary transition-all ml-1"
            >
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pt-4 pb-24 overflow-x-hidden">
        <Outlet />
      </main>

      {/* Floating Bottom Nav */}
      <nav className="fixed-bottom-nav fixed bottom-3 left-3 right-3 z-40 max-w-lg mx-auto">
        <div className="glass rounded-2xl shadow-2xl border-primary/10 px-1.5 py-1.5">
          <div className="flex items-center justify-between relative">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path !== "/" && location.pathname.startsWith(item.path));
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="relative flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all"
                >
                  {isActive && (
                    <div className="absolute inset-0 gradient-primary rounded-xl shadow-sm" />
                  )}
                  <item.icon
                    className={`relative h-5 w-5 transition-colors ${
                      isActive ? "text-white" : "text-muted-foreground"
                    }`}
                  />
                  <span
                    className={`relative text-[10px] font-bold transition-colors ${
                      isActive ? "text-white" : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}

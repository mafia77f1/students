import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Home, Users, Trophy, User, Swords, Settings, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const navItems = [
    { label: "الرئيسية", path: "/", icon: Home },
    { label: "الغرف", path: "/lobby", icon: Users },
    { label: "التحدي", path: "/challenges", icon: Swords },
    { label: "الصدارة", path: "/leaderboard", icon: Trophy },
    { label: "حسابي", path: "/profile", icon: User },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-14 flex items-center border-b px-4 bg-card sticky top-0 z-10">
        <h1 className="text-lg font-bold gradient-text cursor-pointer" onClick={() => navigate("/")}>طلاب</h1>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/messages")} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <MessageCircle className="h-5 w-5 text-muted-foreground" />
          </button>
          <button onClick={() => navigate("/settings")} className="p-2 rounded-lg hover:bg-muted transition-colors">
            <Settings className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 pb-20 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t z-20">
        <div className="max-w-lg mx-auto flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg transition-colors ${isActive ? "text-primary" : "text-muted-foreground"}`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

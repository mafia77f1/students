import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "react-router-dom";
import { Trophy, Globe, MapPin, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { UserSearch } from "@/components/UserSearch";

const rankConfig: Record<string, { label: string; icon: string }> = {
  bronze: { label: "برونزي", icon: "🥉" }, silver: { label: "فضي", icon: "🥈" }, gold: { label: "ذهبي", icon: "🥇" },
  platinum: { label: "بلاتيني", icon: "💎" }, diamond: { label: "ماسي", icon: "💠" }, grandmaster: { label: "غراندماستر", icon: "👑" },
};

interface LeaderUser {
  id: string; name: string; weekly_xp: number; total_xp: number;
  level: number; rank: string; country: string; role: string; avatar_url?: string;
}

export default function Leaderboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<LeaderUser[]>([]);
  const [filter, setFilter] = useState<"global" | "country">("global");

  useEffect(() => {
    const fetchUsers = async () => {
      let query = supabase.from("profiles").select("id, name, weekly_xp, total_xp, level, rank, country, role, avatar_url")
        .order("weekly_xp", { ascending: false }).limit(50);
      if (filter === "country" && profile?.country) {
        query = query.eq("country", profile.country);
      }
      const { data } = await query;
      setUsers((data as LeaderUser[]) || []);
    };
    fetchUsers();
  }, [filter, profile]);

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary glow-primary">
          <Trophy className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-black gradient-text">لوحة الصدارة</h1>

        {/* Filter pills */}
        <div className="inline-flex p-1 bg-muted rounded-2xl">
          <button
            onClick={() => setFilter("global")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === "global" ? "gradient-primary text-white glow-primary" : "text-muted-foreground"
            }`}
          >
            <Globe className="h-3.5 w-3.5" /> عالمي
          </button>
          <button
            onClick={() => setFilter("country")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filter === "country" ? "gradient-primary text-white glow-primary" : "text-muted-foreground"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" /> بلدي
          </button>
        </div>
      </div>

      {/* Podium - Top 3 */}
      {top3.length > 0 && (
        <div className="grid grid-cols-3 gap-2 items-end">
          {/* 2nd */}
          {top3[1] && (
            <motion.button
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => navigate(`/user/${top3[1].id}`)}
              className="flex flex-col items-center"
            >
              <div className="relative">
                {top3[1].avatar_url ? (
                  <img src={top3[1].avatar_url} alt="" className="w-14 h-14 rounded-2xl object-cover ring-4 ring-slate-300" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-300 flex items-center justify-center text-white text-xl font-black ring-4 ring-slate-300">
                    {top3[1].name?.[0]}
                  </div>
                )}
                <div className="absolute -top-2 -right-2 text-2xl">🥈</div>
              </div>
              <p className="text-xs font-bold mt-2 truncate max-w-full">{top3[1].name}</p>
              <p className="text-[10px] text-muted-foreground">{top3[1].weekly_xp} XP</p>
              <div className="w-full h-16 mt-2 bg-gradient-to-b from-slate-300 to-slate-400 rounded-t-xl" />
            </motion.button>
          )}

          {/* 1st */}
          {top3[0] && (
            <motion.button
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate(`/user/${top3[0].id}`)}
              className="flex flex-col items-center"
            >
              <Crown className="h-6 w-6 text-yellow-500 mb-1 animate-float" />
              <div className="relative">
                {top3[0].avatar_url ? (
                  <img src={top3[0].avatar_url} alt="" className="w-20 h-20 rounded-2xl object-cover ring-4 ring-yellow-400" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-400 flex items-center justify-center text-white text-2xl font-black ring-4 ring-yellow-400 glow-primary">
                    {top3[0].name?.[0]}
                  </div>
                )}
                <div className="absolute -top-2 -right-2 text-3xl">🥇</div>
              </div>
              <p className="text-sm font-black mt-2 truncate max-w-full">{top3[0].name}</p>
              <p className="text-xs font-bold text-primary">{top3[0].weekly_xp} XP</p>
              <div className="w-full h-24 mt-2 bg-gradient-to-b from-yellow-400 to-amber-500 rounded-t-xl shadow-lg" />
            </motion.button>
          )}

          {/* 3rd */}
          {top3[2] && (
            <motion.button
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onClick={() => navigate(`/user/${top3[2].id}`)}
              className="flex flex-col items-center"
            >
              <div className="relative">
                {top3[2].avatar_url ? (
                  <img src={top3[2].avatar_url} alt="" className="w-14 h-14 rounded-2xl object-cover ring-4 ring-amber-700" />
                ) : (
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-700 to-amber-500 flex items-center justify-center text-white text-xl font-black ring-4 ring-amber-700">
                    {top3[2].name?.[0]}
                  </div>
                )}
                <div className="absolute -top-2 -right-2 text-2xl">🥉</div>
              </div>
              <p className="text-xs font-bold mt-2 truncate max-w-full">{top3[2].name}</p>
              <p className="text-[10px] text-muted-foreground">{top3[2].weekly_xp} XP</p>
              <div className="w-full h-12 mt-2 bg-gradient-to-b from-amber-600 to-amber-700 rounded-t-xl" />
            </motion.button>
          )}
        </div>
      )}

      {/* Rest of list */}
      <div className="space-y-1.5">
        {users.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">لا يوجد مستخدمون بعد</p>
        ) : (
          rest.map((user, i) => {
            const r = rankConfig[user.rank] || rankConfig.bronze;
            const isMe = user.id === profile?.id;
            const rank = i + 4;
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <Card
                  className={`cursor-pointer transition-all hover:border-primary/40 ${
                    isMe ? "ring-2 ring-primary/40 bg-primary/5" : ""
                  }`}
                  onClick={() => navigate(`/user/${user.id}`)}
                >
                  <CardContent className="py-2.5 px-3 flex items-center gap-3">
                    <span className="text-sm font-black w-7 text-center text-muted-foreground">{rank}</span>
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="w-9 h-9 rounded-xl object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white text-xs font-black shrink-0">
                        {user.name?.[0] || "؟"}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">
                        {user.name || "مستخدم"} {isMe && <span className="text-xs text-primary font-medium">(أنت)</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{r.icon} {r.label}</p>
                    </div>
                    <span className="font-black text-primary text-sm">{user.weekly_xp}<span className="text-[10px] opacity-60"> XP</span></span>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}

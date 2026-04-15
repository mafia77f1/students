import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "react-router-dom";
import { Trophy, Globe, MapPin } from "lucide-react";
import { motion } from "framer-motion";

const rankConfig: Record<string, { label: string; icon: string }> = {
  bronze: { label: "برونزي", icon: "🥉" }, silver: { label: "فضي", icon: "🥈" }, gold: { label: "ذهبي", icon: "🥇" },
  platinum: { label: "بلاتيني", icon: "💎" }, diamond: { label: "ماسي", icon: "💠" }, grandmaster: { label: "غراندماستر", icon: "👑" },
};

interface LeaderUser {
  id: string; name: string; weekly_xp: number; total_xp: number;
  level: number; rank: string; country: string; role: string;
}

export default function Leaderboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<LeaderUser[]>([]);
  const [filter, setFilter] = useState<"global" | "country">("global");

  useEffect(() => {
    const fetchUsers = async () => {
      let query = supabase.from("profiles").select("id, name, weekly_xp, total_xp, level, rank, country, role")
        .order("weekly_xp", { ascending: false }).limit(50);
      if (filter === "country" && profile?.country) {
        query = query.eq("country", profile.country);
      }
      const { data } = await query;
      setUsers((data as LeaderUser[]) || []);
    };
    fetchUsers();
  }, [filter, profile]);

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-secondary" /> الصدارة
        </h1>
        <div className="flex gap-1.5">
          <Button variant={filter === "global" ? "default" : "outline"} size="sm" onClick={() => setFilter("global")}
            className={`gap-1 text-xs h-8 ${filter === "global" ? "gradient-primary text-primary-foreground" : ""}`}>
            <Globe className="h-3 w-3" /> عالمي
          </Button>
          <Button variant={filter === "country" ? "default" : "outline"} size="sm" onClick={() => setFilter("country")}
            className={`gap-1 text-xs h-8 ${filter === "country" ? "gradient-primary text-primary-foreground" : ""}`}>
            <MapPin className="h-3 w-3" /> بلدي
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="space-y-1.5">
        {users.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">لا يوجد مستخدمون بعد</p>
        ) : (
          users.map((user, i) => {
            const r = rankConfig[user.rank] || rankConfig.bronze;
            const isMe = user.id === profile?.id;
            const isTop3 = i < 3;
            return (
              <motion.div key={user.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                <Card
                  className={`cursor-pointer transition-all hover:shadow-sm ${isMe ? "ring-1 ring-primary/30 bg-primary/5" : ""} ${isTop3 ? "border-secondary/20" : ""}`}
                  onClick={() => navigate(`/user/${user.id}`)}
                >
                  <CardContent className="py-3 px-4 flex items-center gap-3">
                    <span className="text-sm font-bold w-6 text-center">
                      {isTop3 ? medals[i] : <span className="text-muted-foreground">{i + 1}</span>}
                    </span>
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                      {user.name?.[0] || "؟"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {user.name || "مستخدم"} {isMe && <span className="text-xs text-primary">(أنت)</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{r.icon} {r.label}</p>
                    </div>
                    <span className="font-bold text-secondary text-sm">{user.weekly_xp} XP</span>
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

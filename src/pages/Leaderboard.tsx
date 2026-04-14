import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  id: string;
  name: string;
  weekly_xp: number;
  total_xp: number;
  level: number;
  rank: string;
  country: string;
  role: string;
}

export default function Leaderboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<LeaderUser[]>([]);
  const [filter, setFilter] = useState<"global" | "country">("global");
  const [roleFilter, setRoleFilter] = useState<"all" | "student" | "teacher">("all");

  useEffect(() => {
    const fetchUsers = async () => {
      let query = supabase.from("profiles").select("id, name, weekly_xp, total_xp, level, rank, country, role").order("weekly_xp", { ascending: false }).limit(50);
      if (filter === "country" && profile?.country) {
        query = query.eq("country", profile.country);
      }
      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter);
      }
      const { data } = await query;
      setUsers((data as LeaderUser[]) || []);
    };
    fetchUsers();
  }, [filter, roleFilter, profile]);

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Trophy className="h-6 w-6 text-secondary" /> لوحة الصدارة
      </h1>

      <div className="flex gap-2 flex-wrap">
        <Button variant={filter === "global" ? "default" : "outline"} size="sm" onClick={() => setFilter("global")}
          className={`gap-1 ${filter === "global" ? "gradient-primary text-primary-foreground" : ""}`}>
          <Globe className="h-3.5 w-3.5" /> عالمي
        </Button>
        <Button variant={filter === "country" ? "default" : "outline"} size="sm" onClick={() => setFilter("country")}
          className={`gap-1 ${filter === "country" ? "gradient-primary text-primary-foreground" : ""}`}>
          <MapPin className="h-3.5 w-3.5" /> {profile?.country || "بلدي"}
        </Button>
        <div className="w-px bg-border mx-1" />
        {(["all", "student", "teacher"] as const).map(r => (
          <Button key={r} variant={roleFilter === r ? "default" : "outline"} size="sm" onClick={() => setRoleFilter(r)}
            className={roleFilter === r ? "gradient-primary text-primary-foreground" : ""}>
            {r === "all" ? "الكل" : r === "student" ? "طلاب" : "أساتذة"}
          </Button>
        ))}
      </div>

      {/* Top 3 */}
      {users.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[1, 0, 2].map((idx) => {
            const user = users[idx];
            if (!user) return null;
            const r = rankConfig[user.rank] || rankConfig.bronze;
            const medals = ["🥇", "🥈", "🥉"];
            return (
              <motion.div key={user.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                <Card className={`text-center cursor-pointer hover:shadow-md transition ${idx === 0 ? "ring-2 ring-secondary/50 glow-neon" : ""}`}
                  onClick={() => navigate(`/user/${user.id}`)}>
                  <CardContent className="pt-5">
                    <span className="text-2xl">{medals[idx]}</span>
                    <div className="w-10 h-10 rounded-full gradient-primary mx-auto my-2 flex items-center justify-center text-primary-foreground font-bold">
                      {user.name?.[0] || "؟"}
                    </div>
                    <p className="font-bold text-sm truncate">{user.name || "طالب"}</p>
                    <p className="text-xs text-muted-foreground">{r.icon} {r.label}</p>
                    <p className="text-lg font-bold text-secondary mt-1">{user.weekly_xp} XP</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Full List */}
      <Card>
        <CardHeader><CardTitle className="text-base">الترتيب الكامل</CardTitle></CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground text-sm">لا يوجد مستخدمون بعد</p>
          ) : (
            <div className="space-y-2">
              {users.map((user, i) => {
                const r = rankConfig[user.rank] || rankConfig.bronze;
                const isMe = user.id === profile?.id;
                return (
                  <motion.div key={user.id} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition ${isMe ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-muted/50"}`}
                    onClick={() => navigate(`/user/${user.id}`)}>
                    <span className="text-sm font-bold text-muted-foreground w-6 text-center">
                      {i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}
                    </span>
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                      {user.name?.[0] || "؟"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {user.name || "طالب"} {isMe && <span className="text-xs text-primary">(أنت)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{r.icon} {r.label} • المستوى {user.level}</p>
                    </div>
                    <span className="font-bold text-secondary text-sm">{user.weekly_xp} XP</span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

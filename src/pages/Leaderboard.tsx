import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "react-router-dom";
import { Trophy, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { UserSearch } from "@/components/UserSearch";

const rankConfig: Record<string, { label: string; icon: string }> = {
  bronze: { label: "برونزي", icon: "🥉" }, silver: { label: "فضي", icon: "🥈" }, gold: { label: "ذهبي", icon: "🥇" },
  platinum: { label: "بلاتيني", icon: "💎" }, diamond: { label: "ماسي", icon: "💠" }, grandmaster: { label: "غراندماستر", icon: "👑" },
};

type Period = "weekly" | "monthly" | "all";

interface LeaderUser {
  id: string; name: string; xp: number;
  level: number; rank: string; avatar_url?: string;
}

const periodInfo: Record<Period, { label: string; sub: string }> = {
  weekly:  { label: "أسبوعي", sub: "آخر 7 أيام" },
  monthly: { label: "شهري", sub: "آخر 30 يوم" },
  all:     { label: "العام",  sub: "كل الأوقات" },
};

export default function Leaderboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<LeaderUser[]>([]);
  const [period, setPeriod] = useState<Period>("weekly");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      if (period === "all") {
        const { data } = await supabase.from("profiles")
          .select("id, name, total_xp, level, rank, avatar_url")
          .order("total_xp", { ascending: false }).limit(50);
        if (!cancelled) setUsers(((data as any[]) || []).map(u => ({ ...u, xp: u.total_xp || 0 })));
      } else {
        const days = period === "weekly" ? 7 : 30;
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
        const { data: sessions } = await supabase
          .from("study_sessions")
          .select("user_id, xp_earned")
          .gte("started_at", since);
        const sums = new Map<string, number>();
        ((sessions as any[]) || []).forEach(s => {
          sums.set(s.user_id, (sums.get(s.user_id) || 0) + (s.xp_earned || 0));
        });
        const ids = Array.from(sums.keys());
        if (ids.length === 0) { if (!cancelled) setUsers([]); setLoading(false); return; }
        const { data: profiles } = await supabase.from("profiles")
          .select("id, name, level, rank, avatar_url").in("id", ids);
        const merged: LeaderUser[] = ((profiles as any[]) || []).map(p => ({
          ...p, xp: sums.get(p.id) || 0,
        })).sort((a, b) => b.xp - a.xp).slice(0, 50);
        if (!cancelled) setUsers(merged);
      }
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [period]);

  const top3 = users.slice(0, 3);
  const rest = users.slice(3);

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <UserSearch />

      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-primary glow-primary">
          <Trophy className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-black gradient-text">لوحة الصدارة</h1>

        <div className="inline-flex p-1 bg-muted rounded-2xl">
          {(["weekly", "monthly", "all"] as Period[]).map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                period === p ? "gradient-primary text-white glow-primary" : "text-muted-foreground"
              }`}>
              {periodInfo[p].label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground">{periodInfo[period].sub}</p>
      </div>

      {loading && <p className="text-center text-sm text-muted-foreground py-4">جاري التحميل…</p>}

      {!loading && top3.length > 0 && (
        <div className="grid grid-cols-3 gap-2 items-end">
          {[1, 0, 2].map((idx) => {
            const u = top3[idx];
            if (!u) return <div key={idx} />;
            const sizes = idx === 0
              ? { ring: "ring-yellow-400", grad: "from-yellow-500 to-amber-400", bar: "from-yellow-400 to-amber-500", img: "w-20 h-20", txt: "text-sm font-black", h: "h-24", medal: "🥇" }
              : idx === 1
              ? { ring: "ring-slate-300", grad: "from-slate-400 to-slate-300", bar: "from-slate-300 to-slate-400", img: "w-14 h-14", txt: "text-xs font-bold", h: "h-16", medal: "🥈" }
              : { ring: "ring-amber-700", grad: "from-amber-700 to-amber-500", bar: "from-amber-600 to-amber-700", img: "w-14 h-14", txt: "text-xs font-bold", h: "h-12", medal: "🥉" };
            return (
              <motion.button key={u.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }} onClick={() => navigate(`/user/${u.id}`)}
                className="flex flex-col items-center">
                {idx === 0 && <Crown className="h-6 w-6 text-yellow-500 mb-1 animate-float" />}
                <div className="relative">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className={`${sizes.img} rounded-2xl object-cover ring-4 ${sizes.ring}`} />
                  ) : (
                    <div className={`${sizes.img} rounded-2xl bg-gradient-to-br ${sizes.grad} flex items-center justify-center text-white text-xl font-black ring-4 ${sizes.ring}`}>
                      {u.name?.[0]}
                    </div>
                  )}
                  <div className="absolute -top-2 -right-2 text-2xl">{sizes.medal}</div>
                </div>
                <p className={`${sizes.txt} mt-2 truncate max-w-full`}>{u.name}</p>
                <p className="text-[10px] text-primary font-bold">{u.xp} XP</p>
                <div className={`w-full ${sizes.h} mt-2 bg-gradient-to-b ${sizes.bar} rounded-t-xl`} />
              </motion.button>
            );
          })}
        </div>
      )}

      <div className="space-y-1.5">
        {!loading && users.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">لا توجد بيانات لهذه الفترة بعد</p>
        ) : (
          rest.map((user, i) => {
            const r = rankConfig[user.rank] || rankConfig.bronze;
            const isMe = user.id === profile?.id;
            const rankNum = i + 4;
            return (
              <motion.div key={user.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}>
                <Card className={`cursor-pointer transition-all hover:border-primary/40 ${isMe ? "ring-2 ring-primary/40 bg-primary/5" : ""}`}
                  onClick={() => navigate(`/user/${user.id}`)}>
                  <CardContent className="py-2.5 px-3 flex items-center gap-3">
                    <span className="text-sm font-black w-7 text-center text-muted-foreground">{rankNum}</span>
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
                    <span className="font-black text-primary text-sm">{user.xp}<span className="text-[10px] opacity-60"> XP</span></span>
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

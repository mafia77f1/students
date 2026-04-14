import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "react-router-dom";
import { Clock, Zap, TrendingUp, Award, LogOut, BookOpen, Settings } from "lucide-react";
import { motion } from "framer-motion";

const rankConfig: Record<string, { label: string; icon: string }> = {
  bronze: { label: "برونزي", icon: "🥉" }, silver: { label: "فضي", icon: "🥈" }, gold: { label: "ذهبي", icon: "🥇" },
  platinum: { label: "بلاتيني", icon: "💎" }, diamond: { label: "ماسي", icon: "💠" }, grandmaster: { label: "غراندماستر", icon: "👑" },
};
const allRanks = ["bronze", "silver", "gold", "platinum", "diamond", "grandmaster"];

export default function Profile() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  if (!profile) return null;

  const rank = rankConfig[profile.rank] || rankConfig.bronze;
  const xpToNext = (profile.level + 1) * 200;
  const xpPercent = Math.min((profile.total_xp / xpToNext) * 100, 100);
  const currentRankIdx = allRanks.indexOf(profile.rank);

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <Card className="overflow-hidden">
        <div className="h-20 gradient-primary" />
        <CardContent className="-mt-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-card border-4 border-card mx-auto flex items-center justify-center text-2xl font-bold gradient-primary text-primary-foreground glow-primary">
            {profile.name?.[0] || "؟"}
          </div>
          <h1 className="text-xl font-bold mt-2">{profile.name || "طالب"}</h1>
          <p className="text-sm font-medium mt-1">{rank.icon} {rank.label}</p>
          <p className="text-xs text-muted-foreground">المستوى {profile.level} • {profile.role === "teacher" ? "أستاذ" : "طالب"}</p>
          {profile.grade && <p className="text-xs text-muted-foreground mt-1">{profile.grade} • {profile.country}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4 text-secondary" />التقدم</CardTitle></CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm mb-2"><span>XP</span><span className="text-primary font-bold">{profile.total_xp} / {xpToNext}</span></div>
          <Progress value={xpPercent} className="h-3" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "ساعات الدراسة", value: `${Number(profile.total_hours).toFixed(1)}`, icon: Clock },
          { label: "نقاط الأسبوع", value: `${profile.weekly_xp} XP`, icon: TrendingUp },
          { label: "المستوى", value: profile.level, icon: Award },
          { label: "إجمالي XP", value: profile.total_xp, icon: Zap },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card>
              <CardContent className="pt-5 text-center">
                <stat.icon className="h-6 w-6 mx-auto mb-1.5 text-primary" />
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">مسار الرتب</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-1">
            {allRanks.map((r, i) => {
              const rc = rankConfig[r];
              const achieved = i <= currentRankIdx;
              return (
                <div key={r} className={`flex flex-col items-center gap-1 flex-1 ${achieved ? "" : "opacity-25"}`}>
                  <span className="text-lg">{rc.icon}</span>
                  <span className="text-[10px] text-center">{rc.label}</span>
                  {i === currentRankIdx && <div className="w-2 h-2 rounded-full bg-primary glow-primary" />}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {profile.subjects && profile.subjects.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">المواد</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.subjects.map((s) => (
                <span key={s} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">{s}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" className="gap-2" onClick={() => navigate("/grades")}>
          <BookOpen className="h-4 w-4" /> الدرجات
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => navigate("/settings")}>
          <Settings className="h-4 w-4" /> الإعدادات
        </Button>
      </div>

      <Button variant="outline" className="w-full gap-2 text-destructive" onClick={signOut}>
        <LogOut className="h-4 w-4" /> تسجيل الخروج
      </Button>
    </div>
  );
}

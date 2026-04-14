import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Zap, Trophy, TrendingUp, Play, Target, CheckCircle2, Swords, BookOpen, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";

const rankConfig: Record<string, { label: string; icon: string }> = {
  bronze: { label: "برونزي", icon: "🥉" }, silver: { label: "فضي", icon: "🥈" }, gold: { label: "ذهبي", icon: "🥇" },
  platinum: { label: "بلاتيني", icon: "💎" }, diamond: { label: "ماسي", icon: "💠" }, grandmaster: { label: "غراندماستر", icon: "👑" },
};

interface DailyGoal { id: string; subject: string; description: string; is_completed: boolean; }

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [goals, setGoals] = useState<DailyGoal[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase.from("daily_goals").select("*").eq("user_id", profile.id).eq("date", new Date().toISOString().split("T")[0])
      .then(({ data }) => setGoals((data as DailyGoal[]) || []));
  }, [profile]);

  const toggleGoal = async (goalId: string, done: boolean) => {
    await supabase.from("daily_goals").update({ is_completed: done }).eq("id", goalId);
    setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, is_completed: done } : g)));
  };

  if (!profile) return null;

  const rank = rankConfig[profile.rank] || rankConfig.bronze;
  const xpToNext = (profile.level + 1) * 200;
  const xpPercent = Math.min((profile.total_xp / xpToNext) * 100, 100);
  const completedGoals = goals.filter((g) => g.is_completed).length;

  const quickLinks = [
    { label: "ابدأ الدراسة", icon: Play, path: "/start-study", gradient: true },
    { label: "التحديات", icon: Swords, path: "/challenges" },
    { label: "الدرجات", icon: BookOpen, path: "/grades" },
    { label: "الأساتذة", icon: GraduationCap, path: "/teachers" },
  ];

  const stats = [
    { label: "ساعات الدراسة", value: `${Number(profile.total_hours).toFixed(1)}`, icon: Clock },
    { label: "المستوى", value: profile.level, icon: TrendingUp },
    { label: "نقاط XP", value: profile.total_xp, icon: Zap },
    { label: "الرتبة", value: `${rank.icon} ${rank.label}`, icon: Trophy },
  ];

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">مرحباً، {profile.name || "طالب"} 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">واصل التقدم!</p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-3">
        {quickLinks.map((link, i) => (
          <motion.div key={link.path} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className={`cursor-pointer hover:shadow-lg transition ${link.gradient ? "gradient-primary text-primary-foreground glow-primary" : "hover:bg-muted/50"}`}
              onClick={() => navigate(link.path)}>
              <CardContent className="pt-5 flex flex-col items-center gap-2 text-center">
                <link.icon className="h-7 w-7" />
                <p className="font-bold text-sm">{link.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* XP Progress */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">شريط التقدم</span>
            <span className="text-primary font-bold">{profile.total_xp} / {xpToNext} XP</span>
          </div>
          <Progress value={xpPercent} className="h-3" />
          <p className="text-xs text-muted-foreground mt-2">تحتاج {xpToNext - profile.total_xp} نقطة للمستوى التالي</p>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card>
              <CardContent className="pt-5 text-center">
                <stat.icon className="h-6 w-6 mx-auto mb-1.5 text-primary" />
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Daily Goals */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2"><Target className="h-5 w-5 text-secondary" /> أهداف اليوم</div>
            <span className="text-sm font-normal text-muted-foreground">{completedGoals}/{goals.length}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {goals.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Target className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">لا توجد أهداف لليوم</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/start-study")}>أضف هدفاً جديداً</Button>
            </div>
          ) : (
            <div className="space-y-2">
              {goals.map((goal) => (
                <div key={goal.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                  <Checkbox checked={goal.is_completed} onCheckedChange={(checked) => toggleGoal(goal.id, !!checked)} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${goal.is_completed ? "line-through text-muted-foreground" : ""}`}>{goal.description}</p>
                    <p className="text-xs text-muted-foreground">{goal.subject}</p>
                  </div>
                  {goal.is_completed && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

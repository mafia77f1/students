import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Zap, Trophy, Play, Target, CheckCircle2, BookOpen, GraduationCap } from "lucide-react";
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

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Greeting + Start CTA */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="gradient-primary text-primary-foreground glow-primary overflow-hidden">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-xl font-bold">مرحباً، {profile.name || "طالب"} 👋</h1>
                <p className="text-sm opacity-80 mt-0.5">{rank.icon} {rank.label} • المستوى {profile.level}</p>
              </div>
            </div>
            <div className="bg-white/15 rounded-lg p-3 mb-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span>التقدم للمستوى التالي</span>
                <span className="font-bold">{profile.total_xp}/{xpToNext} XP</span>
              </div>
              <Progress value={xpPercent} className="h-2 bg-white/20" />
            </div>
            <Button 
              onClick={() => navigate("/start-study")} 
              className="w-full bg-white/20 hover:bg-white/30 text-white border-0 gap-2 font-bold"
              size="lg"
            >
              <Play className="h-5 w-5" /> ابدأ الدراسة الآن
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Stats - compact row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "الساعات", value: `${Number(profile.total_hours).toFixed(0)}h`, icon: Clock },
          { label: "XP", value: profile.total_xp, icon: Zap },
          { label: "الرتبة", value: rank.label, icon: Trophy },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
            <Card>
              <CardContent className="pt-4 pb-3 text-center">
                <stat.icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-base font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Navigation */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-auto py-3 flex-col gap-1.5" onClick={() => navigate("/grades")}>
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="text-xs font-medium">الدرجات والخطط</span>
          </Button>
          <Button variant="outline" className="h-auto py-3 flex-col gap-1.5" onClick={() => navigate("/teachers")}>
            <GraduationCap className="h-5 w-5 text-primary" />
            <span className="text-xs font-medium">الأساتذة</span>
          </Button>
        </div>
      </motion.div>

      {/* Daily Goals */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold flex items-center gap-2 text-sm">
                <Target className="h-4 w-4 text-secondary" /> أهداف اليوم
              </h2>
              {goals.length > 0 && (
                <span className="text-xs text-muted-foreground">{completedGoals}/{goals.length}</span>
              )}
            </div>
            {goals.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Target className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-xs">ابدأ جلسة دراسة لإضافة أهداف</p>
                <Button variant="link" size="sm" className="mt-1 text-xs" onClick={() => navigate("/start-study")}>
                  ابدأ الآن ←
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {goals.map((goal) => (
                  <div key={goal.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox checked={goal.is_completed} onCheckedChange={(checked) => toggleGoal(goal.id, !!checked)} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${goal.is_completed ? "line-through text-muted-foreground" : ""}`}>{goal.description}</p>
                      <p className="text-[10px] text-muted-foreground">{goal.subject}</p>
                    </div>
                    {goal.is_completed && <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

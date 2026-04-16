import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Zap, Trophy, Play, Target, CheckCircle2, Star, BarChart3, Flame, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";

const rankConfig: Record<string, { label: string; icon: string; color: string }> = {
  bronze: { label: "برونزي", icon: "🥉", color: "from-amber-700 to-amber-500" },
  silver: { label: "فضي", icon: "🥈", color: "from-slate-400 to-slate-300" },
  gold: { label: "ذهبي", icon: "🥇", color: "from-yellow-500 to-amber-400" },
  platinum: { label: "بلاتيني", icon: "💎", color: "from-cyan-400 to-blue-400" },
  diamond: { label: "ماسي", icon: "💠", color: "from-blue-400 to-violet-400" },
  grandmaster: { label: "غراندماستر", icon: "👑", color: "from-fuchsia-500 to-purple-500" },
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

  const isTeacher = profile.role === "teacher";
  const rank = rankConfig[profile.rank] || rankConfig.bronze;
  const xpToNext = (profile.level + 1) * 200;
  const xpPercent = Math.min((profile.total_xp / xpToNext) * 100, 100);
  const completedGoals = goals.filter((g) => g.is_completed).length;
  const goalsPercent = goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Hero Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="relative overflow-hidden rounded-3xl gradient-mesh p-5 text-white shadow-2xl">
          {/* Decorative blobs */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

          <div className="relative">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs opacity-80 font-medium">{new Date().toLocaleDateString("ar", { weekday: "long" })}</p>
                <h1 className="text-2xl font-black mt-1">
                  مرحباً، {profile.name?.split(" ")[0] || (isTeacher ? "أستاذ" : "بطل")}
                </h1>
                <p className="text-sm opacity-90 mt-1 flex items-center gap-1.5">
                  {isTeacher ? (
                    <><Sparkles className="h-3.5 w-3.5" /> أستاذ</>
                  ) : (
                    <><span className="text-base">{rank.icon}</span> {rank.label} • المستوى {profile.level}</>
                  )}
                </p>
              </div>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/40 shadow-lg" />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-2xl font-black ring-2 ring-white/40">
                  {profile.name?.[0] || "؟"}
                </div>
              )}
            </div>

            {!isTeacher && (
              <div className="bg-white/15 backdrop-blur rounded-2xl p-3 mb-4 border border-white/20">
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-medium opacity-90">التقدم للمستوى التالي</span>
                  <span className="font-black">{profile.total_xp}/{xpToNext}</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${xpPercent}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-white rounded-full shadow-lg"
                  />
                </div>
              </div>
            )}

            <Button
              onClick={() => navigate(isTeacher ? "/profile" : "/start-study")}
              className="w-full bg-white text-primary hover:bg-white/90 border-0 gap-2 font-black h-12 rounded-xl shadow-lg"
              size="lg"
            >
              {isTeacher ? (
                <><Star className="h-5 w-5" /> عرض التقييمات والكفاءة</>
              ) : (
                <><Play className="h-5 w-5 fill-primary" /> ابدأ الدراسة الآن</>
              )}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {(isTeacher
          ? [
              { label: "التقييم", value: "⭐", icon: Star, gradient: "from-yellow-500 to-amber-400" },
              { label: "XP", value: profile.total_xp, icon: Zap, gradient: "from-violet-500 to-purple-500" },
              { label: "المستوى", value: profile.level, icon: BarChart3, gradient: "from-cyan-500 to-blue-500" },
            ]
          : [
              { label: "ساعات", value: `${Number(profile.total_hours).toFixed(0)}`, icon: Clock, gradient: "from-cyan-500 to-blue-500" },
              { label: "XP", value: profile.total_xp, icon: Zap, gradient: "from-violet-500 to-purple-500" },
              { label: "الرتبة", value: rank.icon, icon: Trophy, gradient: rank.color },
            ]
        ).map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06 }}
          >
            <Card className="overflow-hidden border-border/50 hover:border-primary/40 transition-colors">
              <CardContent className="p-3 text-center">
                <div className={`w-9 h-9 mx-auto rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-1.5 shadow-md`}>
                  <stat.icon className="h-4.5 w-4.5 text-white" />
                </div>
                <p className="text-base font-black">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Daily Goals - students */}
      {!isTeacher && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="overflow-hidden border-border/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-black flex items-center gap-2 text-sm">
                  <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                    <Target className="h-4 w-4 text-white" />
                  </div>
                  أهداف اليوم
                </h2>
                {goals.length > 0 && (
                  <span className="text-xs font-bold gradient-text">
                    {completedGoals}/{goals.length}
                  </span>
                )}
              </div>

              {goals.length > 0 && (
                <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${goalsPercent}%` }}
                    className="h-full gradient-primary rounded-full"
                  />
                </div>
              )}

              {goals.length === 0 ? (
                <div className="text-center py-6">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                    <Flame className="h-7 w-7 text-primary" />
                  </div>
                  <p className="text-sm font-medium">جاهز للانطلاق؟</p>
                  <p className="text-xs text-muted-foreground mt-0.5">ابدأ جلسة دراسة لإضافة أهدافك</p>
                  <Button size="sm" className="mt-3 gradient-primary text-white border-0 rounded-xl" onClick={() => navigate("/start-study")}>
                    ابدأ الآن ←
                  </Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {goals.map((goal, i) => (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                        goal.is_completed ? "bg-primary/5" : "bg-muted/40 hover:bg-muted/70"
                      }`}
                    >
                      <Checkbox
                        checked={goal.is_completed}
                        onCheckedChange={(checked) => toggleGoal(goal.id, !!checked)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${goal.is_completed ? "line-through text-muted-foreground" : ""}`}>
                          {goal.description}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{goal.subject}</p>
                      </div>
                      {goal.is_completed && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

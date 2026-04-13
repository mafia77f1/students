import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { currentUser, leaderboard, rankConfig } from "@/lib/mock-data";
import { Clock, Zap, Trophy, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const stats = [
  { label: "ساعات المذاكرة", value: currentUser.totalHours, icon: Clock, suffix: " ساعة" },
  { label: "المستوى", value: currentUser.level, icon: TrendingUp, suffix: "" },
  { label: "نقاط الأسبوع", value: currentUser.weeklyXp, icon: Zap, suffix: " XP" },
  { label: "الرتبة", value: rankConfig[currentUser.rank].label, icon: Trophy, suffix: "" },
];

export default function Dashboard() {
  const xpPercent = (currentUser.xp / currentUser.xpToNext) * 100;
  const rank = rankConfig[currentUser.rank];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold glow-text-purple">مرحباً، {currentUser.name} {rank.icon}</h1>
        <p className="text-muted-foreground mt-1">واصل التقدم نحو الرتبة التالية!</p>
      </div>

      {/* XP Bar */}
      <Card className="glow-purple border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">شريط التقدم</span>
            <span className="text-sm text-primary font-bold">{currentUser.xp} / {currentUser.xpToNext} XP</span>
          </div>
          <div className="relative">
            <Progress value={xpPercent} className="h-4 bg-muted" />
            <div
              className="absolute inset-0 h-4 rounded-full opacity-50 blur-sm"
              style={{
                width: `${xpPercent}%`,
                background: 'linear-gradient(90deg, hsl(263 70% 66%), hsl(187 94% 43%))',
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            تحتاج {currentUser.xpToNext - currentUser.xp} نقطة للوصول إلى المستوى التالي
          </p>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="hover:glow-purple transition-shadow duration-300 border-border/50">
              <CardContent className="pt-6 text-center">
                <stat.icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="text-2xl font-bold">{stat.value}{stat.suffix}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Mini Leaderboard */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-secondary" />
            أفضل الطلاب هذا الأسبوع
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.slice(0, 5).map((user, i) => {
              const r = rankConfig[user.rank];
              return (
                <div key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <span className="text-lg font-bold text-muted-foreground w-6">{i + 1}</span>
                  <span className="text-2xl">{user.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.name}</p>
                    <p className={`text-xs ${r.color}`}>{r.icon} {r.label}</p>
                  </div>
                  <span className="text-sm font-bold text-secondary">{user.weeklyXp} XP</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

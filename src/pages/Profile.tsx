import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { currentUser, rankConfig, type Rank } from "@/lib/mock-data";
import { Clock, Zap, TrendingUp, Award } from "lucide-react";
import { motion } from "framer-motion";

const allRanks: Rank[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond', 'grandmaster'];

export default function Profile() {
  const rank = rankConfig[currentUser.rank];
  const xpPercent = (currentUser.xp / currentUser.xpToNext) * 100;
  const currentRankIdx = allRanks.indexOf(currentUser.rank);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Profile Header */}
      <Card className="glow-purple border-primary/20 overflow-hidden">
        <div className="h-24 bg-gradient-to-l from-neon-purple/30 to-neon-blue/30" />
        <CardContent className="-mt-12 text-center">
          <motion.div
            className="text-6xl mb-2"
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          >
            {currentUser.avatar}
          </motion.div>
          <h1 className="text-2xl font-bold">{currentUser.name}</h1>
          <p className={`text-lg ${rank.color} font-bold mt-1`}>
            {rank.icon} {rank.label}
          </p>
          <p className="text-sm text-muted-foreground">المستوى {currentUser.level}</p>
        </CardContent>
      </Card>

      {/* XP Progress */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="h-5 w-5 text-secondary" />
            التقدم
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between text-sm mb-2">
            <span>XP الحالي</span>
            <span className="text-primary font-bold">{currentUser.xp} / {currentUser.xpToNext}</span>
          </div>
          <Progress value={xpPercent} className="h-3 bg-muted" />
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "إجمالي الساعات", value: `${currentUser.totalHours} ساعة`, icon: Clock },
          { label: "نقاط الأسبوع", value: `${currentUser.weeklyXp} XP`, icon: TrendingUp },
          { label: "المستوى", value: currentUser.level, icon: Award },
          { label: "إجمالي XP", value: currentUser.xp, icon: Zap },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-border/50">
              <CardContent className="pt-6 text-center">
                <stat.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Rank Progression */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">مسار الرتب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-1">
            {allRanks.map((r, i) => {
              const rc = rankConfig[r];
              const achieved = i <= currentRankIdx;
              return (
                <div key={r} className={`flex flex-col items-center gap-1 flex-1 ${achieved ? '' : 'opacity-30'}`}>
                  <span className="text-xl md:text-2xl">{rc.icon}</span>
                  <span className="text-[10px] md:text-xs text-center">{rc.label}</span>
                  {i === currentRankIdx && (
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

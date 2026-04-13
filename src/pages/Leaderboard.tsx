import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { leaderboard, rankConfig } from "@/lib/mock-data";
import { Trophy, Medal } from "lucide-react";
import { motion } from "framer-motion";

const podiumColors = ["text-yellow-400", "text-gray-300", "text-orange-400"];

export default function Leaderboard() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold glow-text-purple flex items-center gap-3">
        <Trophy className="h-8 w-8 text-secondary" />
        لوحة الصدارة الأسبوعية
      </h1>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        {[1, 0, 2].map((idx) => {
          const user = leaderboard[idx];
          const r = rankConfig[user.rank];
          const isFirst = idx === 0;
          return (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.15 }}
            >
              <Card className={`text-center border-border/50 ${isFirst ? 'glow-purple' : ''}`}>
                <CardContent className="pt-6">
                  <span className={`text-2xl md:text-3xl ${podiumColors[idx]}`}>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                  </span>
                  <div className={`text-3xl md:text-4xl my-2 ${isFirst ? 'animate-float' : ''}`}>{user.avatar}</div>
                  <p className="font-bold text-sm md:text-base truncate">{user.name}</p>
                  <p className={`text-xs ${r.color}`}>{r.icon} {r.label}</p>
                  <p className="text-lg font-bold text-secondary mt-1">{user.weeklyXp} XP</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Full List */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">الترتيب الكامل</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboard.map((user, i) => {
              const r = rankConfig[user.rank];
              const isCurrentUser = user.id === 'u1';
              return (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isCurrentUser ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'}`}
                >
                  <span className="text-lg font-bold text-muted-foreground w-8 text-center">
                    {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
                  </span>
                  <span className="text-2xl">{user.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {user.name} {isCurrentUser && <span className="text-xs text-primary">(أنت)</span>}
                    </p>
                    <p className={`text-xs ${r.color}`}>{r.icon} {r.label} • المستوى {user.level}</p>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-secondary">{user.weeklyXp}</p>
                    <p className="text-xs text-muted-foreground">XP</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

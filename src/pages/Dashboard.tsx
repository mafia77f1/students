import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { Clock, Zap, Play, Star, BarChart3, Sparkles, BookOpen, GraduationCap, ExternalLink, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getBookFor } from "@/lib/grade-books";
import { getLevelInfo } from "@/lib/level-utils";

export default function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  if (!profile) return null;

  const isTeacher = profile.role === "teacher";
  const lvl = getLevelInfo(profile.total_xp || 0);
  const LevelIcon = lvl.icon;
  const books = (profile.subjects || []).map((s) => getBookFor(s, profile.grade));

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Hero Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="relative overflow-hidden rounded-3xl gradient-mesh p-5 text-white shadow-2xl">
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
                    <><LevelIcon className="h-3.5 w-3.5" /> المستوى {lvl.level}</>
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
                  <span className="font-medium opacity-90">المستوى {lvl.level} → {lvl.level + 1}</span>
                  <span className="font-black">{profile.total_xp - lvl.xpForCurrent}/{lvl.xpForNext - lvl.xpForCurrent} XP</span>
                </div>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${lvl.progress}%` }}
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
              { label: `المستوى`, value: lvl.level, icon: LevelIcon, gradient: lvl.color },
            ]
        ).map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.06 }}>
            <Card className="overflow-hidden border-border/50 hover:border-primary/40 transition-colors">
              <CardContent className="p-3 text-center">
                <div className={`w-9 h-9 mx-auto rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center mb-1.5 shadow-md`}>
                  <stat.icon className="h-4 w-4 text-white" />
                </div>
                <p className="text-base font-black">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick links: Grades + Leaderboard */}
      {!isTeacher && (
        <div className="grid grid-cols-2 gap-2.5">
          <button onClick={() => navigate("/grades")} className="group relative overflow-hidden rounded-2xl p-3.5 text-right text-white shadow-md bg-gradient-to-br from-emerald-500 to-teal-500">
            <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-white/10 blur-xl group-hover:scale-110 transition" />
            <GraduationCap className="h-5 w-5 mb-1.5" />
            <p className="font-black text-sm">الدرجات</p>
            <p className="text-[10px] opacity-90">إعفاء و وزاري</p>
          </button>
          <button onClick={() => navigate("/leaderboard")} className="group relative overflow-hidden rounded-2xl p-3.5 text-right text-white shadow-md bg-gradient-to-br from-amber-500 to-orange-500">
            <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-white/10 blur-xl group-hover:scale-110 transition" />
            <Trophy className="h-5 w-5 mb-1.5" />
            <p className="font-black text-sm">لوحة الصدارة</p>
            <p className="text-[10px] opacity-90">رتّب نفسك بين الأبطال</p>
          </button>
        </div>
      )}

      {/* Books for grade */}
      {!isTeacher && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-black text-sm flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center shadow-md">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              كتب صفك {profile.grade ? `• ${profile.grade}` : ""}
            </h2>
            <span className="text-[10px] text-muted-foreground font-bold">{books.length} كتاب</span>
          </div>

          {books.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                لم تختر مواد بعد. عدّل ملفك من الإعدادات.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {books.map((b, i) => (
                <motion.a
                  key={b.subject}
                  href={b.href}
                  target="_blank"
                  rel="noreferrer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="group relative overflow-hidden rounded-2xl p-3 bg-card border border-border/50 hover:border-primary/40 hover:shadow-lg transition-all"
                >
                  <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${b.color} group-hover:opacity-20 transition`} />
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${b.color} flex items-center justify-center text-xl shadow-sm mb-2`}>
                      {b.emoji}
                    </div>
                    <p className="font-black text-xs leading-tight">{b.subject}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <ExternalLink className="h-2.5 w-2.5" /> فتح الكتاب
                    </p>
                  </div>
                </motion.a>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

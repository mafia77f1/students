import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import {
  Clock, Zap, Play, Star, BarChart3, Sparkles, BookOpen, GraduationCap,
  ExternalLink, Trophy, Search, Download, History, Flame, TrendingUp, Target, Settings2, X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { getBookFor } from "@/lib/grade-books";
import { getLevelInfo } from "@/lib/level-utils";
import { listTargets, getLastBook, setLastBook, setTarget, getTarget, getResume, clearResume } from "@/lib/study-targets";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AdBanner } from "@/components/AdBanner";
import { AdBanner as _AdBannerUnused } from "@/components/AdBanner";

interface Sess {
  id?: string;
  subject: string;
  duration_minutes: number;
  xp_earned: number | null;
  ended_at: string | null;
  started_at: string;
}

export default function Dashboard() {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Sess[]>([]);
  const [allSessions, setAllSessions] = useState<Sess[]>([]);
  const [bookSearch, setBookSearch] = useState("");
  const [lastBook, setLastBookState] = useState<string | null>(null);
  const [targetDialog, setTargetDialog] = useState<{ subject: string; hours: number } | null>(null);
  const [historyDialog, setHistoryDialog] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!profile) return;
    setLastBookState(getLastBook(profile.id));
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    supabase
      .from("study_sessions")
      .select("id,subject,duration_minutes,xp_earned,ended_at,started_at")
      .eq("user_id", profile.id)
      .gte("started_at", sevenDaysAgo.toISOString())
      .then(({ data }) => setSessions((data as any[]) || []));
    supabase
      .from("study_sessions")
      .select("id,subject,duration_minutes,xp_earned,ended_at,started_at")
      .eq("user_id", profile.id)
      .order("started_at", { ascending: false })
      .then(({ data }) => setAllSessions((data as any[]) || []));
  }, [profile]);

  const isTeacher = profile?.role === "teacher";
  const lvl = getLevelInfo(profile?.total_xp || 0);
  const subjectsList = profile?.subjects || [];
  const targets = useMemo(
    () => (profile ? listTargets(profile.id, subjectsList) : {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [profile, subjectsList, refreshKey]
  );

  // total focus minutes per subject (xp/2 ≈ minutes), no breaks
  const minutesBySubject = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of allSessions) {
      if (!s.ended_at) continue;
      const min = s.xp_earned ? s.xp_earned / 2 : 0;
      m[s.subject] = (m[s.subject] || 0) + min;
    }
    return m;
  }, [allSessions]);

  // weekly per-subject focus minutes (no breaks)
  const weeklyBySubject = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of sessions) {
      if (!s.ended_at) continue;
      const min = s.xp_earned ? s.xp_earned / 2 : 0;
      m[s.subject] = (m[s.subject] || 0) + min;
    }
    return m;
  }, [sessions]);

  const weekStats = useMemo(() => {
    const ended = sessions.filter((s) => s.ended_at);
    const focusMin = ended.reduce((a, s) => a + (s.xp_earned ? s.xp_earned / 2 : 0), 0);
    const xp = ended.reduce((a, s) => a + (s.xp_earned || 0), 0);
    const top = Object.entries(weeklyBySubject).sort((a, b) => b[1] - a[1]).slice(0, 3);
    return { focusMin: Math.round(focusMin), xp, topArr: top, sessions: ended.length };
  }, [sessions, weeklyBySubject]);

  if (!profile) return null;

  const books = subjectsList.map((s) => getBookFor(s, profile.grade));
  const filteredBooks = books.filter((b) =>
    b.subject.toLowerCase().includes(bookSearch.trim().toLowerCase())
  );

  const fmt = (m: number) => {
    const h = Math.floor(m / 60), mm = Math.round(m % 60);
    return h > 0 ? `${h}س ${mm}د` : `${mm}د`;
  };

  const openTargetDialog = (subject: string) => {
    const t = getTarget(profile.id, subject);
    setTargetDialog({ subject, hours: t ? Math.max(1, Math.round(t.targetMinutes / 60)) : 4 });
  };

  const saveTarget = () => {
    if (!targetDialog) return;
    setTarget(profile.id, targetDialog.subject, {
      targetMinutes: targetDialog.hours * 60,
      lastUpdated: Date.now(),
    });
    toast.success(`تم تحديد ${targetDialog.hours} ساعة لـ ${targetDialog.subject} ✓`);
    setTargetDialog(null);
    setRefreshKey((k) => k + 1);
  };

  const subjectHistory = (sub: string) =>
    allSessions.filter((s) => s.subject === sub && s.ended_at);

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
                  {isTeacher ? <><Sparkles className="h-3.5 w-3.5" /> أستاذ</> : <><span className="text-base leading-none">{lvl.emoji}</span> {lvl.title} • المستوى {lvl.level}</>}
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
                  <motion.div initial={{ width: 0 }} animate={{ width: `${lvl.progress}%` }}
                    transition={{ duration: 1, ease: "easeOut" }} className="h-full bg-white rounded-full shadow-lg" />
                </div>
              </div>
            )}

            <Button onClick={() => navigate(isTeacher ? "/profile" : "/start-study")}
              className="w-full bg-white text-primary hover:bg-white/90 border-0 gap-2 font-black h-12 rounded-xl shadow-lg" size="lg">
              {isTeacher ? <><Star className="h-5 w-5" /> عرض التقييمات</> : <><Play className="h-5 w-5 fill-primary" /> ابدأ الدراسة</>}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {(isTeacher
          ? [
              { label: "التقييم", value: "⭐", icon: Star, gradient: "from-primary to-primary-glow" },
              { label: "XP", value: profile.total_xp, icon: Zap, gradient: "from-primary to-secondary" },
              { label: "المستوى", value: profile.level, icon: BarChart3, gradient: "from-secondary to-secondary-glow" },
            ]
          : [
              { label: "ساعات", value: `${Number(profile.total_hours).toFixed(0)}`, icon: Clock, gradient: "from-secondary to-secondary-glow" },
              { label: "XP", value: profile.total_xp, icon: Zap, gradient: "from-primary to-primary-glow" },
              { label: `المستوى`, value: lvl.level, icon: BarChart3, gradient: "from-primary to-secondary" },
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

      {/* Quick links */}
      {!isTeacher && (
        <div className="grid grid-cols-2 gap-2.5">
          <button onClick={() => navigate("/grades")} className="group relative overflow-hidden rounded-2xl p-3.5 text-right text-white shadow-md bg-gradient-to-br from-primary to-primary-glow">
            <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-white/10 blur-xl group-hover:scale-110 transition" />
            <GraduationCap className="h-5 w-5 mb-1.5" />
            <p className="font-black text-sm">الدرجات</p>
            <p className="text-[10px] opacity-90">إعفاء و وزاري</p>
          </button>
          <button onClick={() => navigate("/leaderboard")} className="group relative overflow-hidden rounded-2xl p-3.5 text-right text-white shadow-md bg-gradient-to-br from-secondary to-secondary-glow">
            <div className="absolute -top-6 -left-6 w-20 h-20 rounded-full bg-white/10 blur-xl group-hover:scale-110 transition" />
            <Trophy className="h-5 w-5 mb-1.5" />
            <p className="font-black text-sm">الصدارة</p>
            <p className="text-[10px] opacity-90">ترتيب الأبطال</p>
          </button>
        </div>
      )}

      {/* Weekly Stats - focus only */}
      {!isTeacher && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-border/50 overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-black text-sm flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
                    <TrendingUp className="h-4 w-4 text-white" />
                  </div>
                  هذا الأسبوع • تركيز فقط
                </h2>
                <span className="text-[10px] text-muted-foreground font-bold">{weekStats.sessions} جلسة</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                  <Flame className="h-4 w-4 text-primary mx-auto mb-1" />
                  <p className="text-sm font-black">{fmt(weekStats.focusMin)}</p>
                  <p className="text-[9px] text-muted-foreground">إجمالي تركيز</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-2.5 text-center">
                  <Zap className="h-4 w-4 text-primary mx-auto mb-1" />
                  <p className="text-sm font-black">+{weekStats.xp}</p>
                  <p className="text-[9px] text-muted-foreground">XP مكتسب</p>
                </div>
              </div>
              {weekStats.topArr.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-muted-foreground">دقائق التركيز هذا الأسبوع لكل مادة</p>
                  {weekStats.topArr.map(([sub, min], i) => {
                    const target = targets[sub]?.targetMinutes || 240;
                    const done = Math.round(minutesBySubject[sub] || 0);
                    const remain = Math.max(0, target - done);
                    return (
                      <div key={sub} className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center">{i + 1}</span>
                        <span className="flex-1 text-xs font-bold truncate">{sub}</span>
                        <span className="text-[10px] text-muted-foreground font-bold">{fmt(min)}</span>
                        <span className="text-[10px] text-secondary font-black">باقي {fmt(remain)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Per-subject progress + history */}
      {!isTeacher && subjectsList.length > 0 && (() => {
        const hidden: string[] = (profile as any).hidden_subjects || [];
        const visible = subjectsList.filter((sub) => {
          if (hidden.includes(sub)) return false;
          const target = targets[sub]?.targetMinutes || 240;
          const done = Math.round(minutesBySubject[sub] || 0);
          return done < target; // auto-hide once goal reached
        });
        if (visible.length === 0) return null;
        const dismissSubject = async (sub: string) => {
          if (!profile) return;
          const next = Array.from(new Set([...hidden, sub]));
          await supabase.from("profiles").update({ hidden_subjects: next } as any).eq("id", profile.id);
          clearResume(profile.id, sub);
          await refreshProfile();
          toast.success(`تم إخفاء ${sub} من المتابعة`);
        };
        return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="font-black text-sm mb-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-md">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            تقدمك بالمواد
          </h2>
          <div className="space-y-2">
            {visible.map((sub) => {
              const target = targets[sub]?.targetMinutes || 240;
              const done = Math.round(minutesBySubject[sub] || 0);
              const pct = Math.min(100, Math.round((done / target) * 100));
              const remain = Math.max(0, target - done);
              const rounds = subjectHistory(sub).length;
              return (
                <Card key={sub} className="border-border/50 cursor-pointer hover:border-primary/40 transition relative" onClick={() => setHistoryDialog(sub)}>
                  <button
                    onClick={(e) => { e.stopPropagation(); dismissSubject(sub); }}
                    className="absolute top-2 left-2 w-6 h-6 rounded-full bg-muted hover:bg-destructive hover:text-white flex items-center justify-center transition"
                    title="حذف من المتابعة"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-1.5 pl-7">
                      <p className="font-bold text-sm">{sub}</p>
                      <span className="text-[10px] font-black text-primary">{pct}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        className="h-full bg-gradient-to-r from-primary to-secondary rounded-full" transition={{ duration: 0.6 }} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{fmt(done)} / {fmt(target)} • {rounds} جولة • باقي {fmt(remain)}</span>
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px] gap-1 text-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          const r = getResume(profile.id, sub);
                          if (r?.sessionId) navigate(`/study-session/${r.sessionId}`);
                          else navigate(`/start-study?subject=${encodeURIComponent(sub)}`);
                        }}>
                        <Play className="h-3 w-3" /> {pct >= 100 ? "جلسة جديدة" : "متابعة"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <AdBanner />
        </motion.div>
        );
      })()}

      {/* Books for grade */}
      {!isTeacher && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-black text-sm flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center shadow-md">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              كتب صفك {profile.grade ? `• ${profile.grade}` : ""}
            </h2>
            <span className="text-[10px] text-muted-foreground font-bold">{books.length} كتاب</span>
          </div>

          {books.length > 0 && (
            <div className="relative mb-2.5">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={bookSearch} onChange={(e) => setBookSearch(e.target.value)}
                placeholder="ابحث عن كتاب..." className="pr-9 h-10 rounded-xl bg-card text-sm" />
            </div>
          )}

          {lastBook && (
            <a
              href={getBookFor(lastBook, profile.grade).href}
              target="_blank" rel="noreferrer"
              onClick={() => setLastBook(profile.id, lastBook)}
              className="flex items-center gap-2 mb-2.5 p-2.5 rounded-xl bg-primary/5 border border-primary/20 hover:bg-primary/10 transition"
            >
              <History className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold flex-1">آخر كتاب: {lastBook}</span>
              <ExternalLink className="h-3.5 w-3.5 text-primary" />
            </a>
          )}

          {books.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                لم تختر مواد بعد. عدّل ملفك من الإعدادات.
              </CardContent>
            </Card>
          ) : filteredBooks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-6 text-center text-xs text-muted-foreground">
                لا يوجد نتائج لـ "{bookSearch}"
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {filteredBooks.map((b, i) => {
                const t = targets[b.subject];
                const targetH = t ? Math.round(t.targetMinutes / 60) : null;
                return (
                  <motion.div key={b.subject} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}
                    className="group relative overflow-hidden rounded-2xl p-3 bg-card border border-border/50 hover:border-primary/40 hover:shadow-lg transition-all">
                    <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${b.color} group-hover:opacity-20 transition`} />
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${b.color} flex items-center justify-center text-xl shadow-sm mb-2`}>
                        {b.emoji}
                      </div>
                      <p className="font-black text-xs leading-tight mb-1.5">{b.subject}</p>
                      <p className="text-[9px] text-muted-foreground mb-2">
                        {targetH ? <>الهدف: <span className="text-primary font-black">{targetH}س</span></> : "لا يوجد هدف"}
                      </p>
                      <div className="flex gap-1.5">
                        <a href={b.href} target="_blank" rel="noreferrer"
                          onClick={() => { setLastBook(profile.id, b.subject); setLastBookState(b.subject); }}
                          className="flex items-center justify-center gap-1 flex-1 h-8 rounded-lg bg-primary/10 text-primary text-[10px] font-bold hover:bg-primary/20 transition">
                          <Download className="h-3 w-3" /> PDF
                        </a>
                        <button
                          onClick={() => openTargetDialog(b.subject)}
                          className="flex items-center justify-center w-8 h-8 rounded-lg bg-secondary/10 text-secondary hover:bg-secondary/20 transition"
                          title="حدد هدف"
                        >
                          <Target className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Target dialog */}
      <Dialog open={!!targetDialog} onOpenChange={(o) => !o && setTargetDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" /> هدف الدراسة لـ {targetDialog?.subject}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label className="text-xs">عدد الساعات الكلية</Label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 4, 6, 8].map((h) => (
                <button key={h} onClick={() => setTargetDialog((p) => p ? { ...p, hours: h } : p)}
                  className={`h-10 rounded-xl border-2 font-black text-sm transition ${
                    targetDialog?.hours === h ? "gradient-primary text-white border-transparent" : "border-border bg-card"
                  }`}>
                  {h}س
                </button>
              ))}
            </div>
            <Input
              type="number" min={1}
              value={targetDialog?.hours || 1}
              onChange={(e) => setTargetDialog((p) => p ? { ...p, hours: Math.max(1, parseInt(e.target.value) || 1) } : p)}
              className="text-center font-black"
            />
          </div>
          <DialogFooter>
            <Button onClick={saveTarget} className="w-full gradient-primary text-white border-0 rounded-xl gap-2">
              <Settings2 className="h-4 w-4" /> حفظ الهدف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History dialog */}
      <Dialog open={!!historyDialog} onOpenChange={(o) => !o && setHistoryDialog(null)}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" /> سجل {historyDialog}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {historyDialog && subjectHistory(historyDialog).length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">لا يوجد جولات بعد لهذه المادة</p>
            ) : (
              historyDialog && subjectHistory(historyDialog).map((s, i) => {
                const min = s.xp_earned ? Math.round(s.xp_earned / 2) : 0;
                return (
                  <div key={s.id || i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/40">
                    <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-black shrink-0">
                      #{subjectHistory(historyDialog).length - i}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold">{fmt(min)} تركيز</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(s.started_at).toLocaleDateString("ar", { day: "numeric", month: "short" })} • {new Date(s.started_at).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-black text-primary">
                      <Zap className="h-3 w-3" /> +{s.xp_earned || 0}
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => { if (historyDialog) navigate(`/start-study?subject=${encodeURIComponent(historyDialog)}`); }}
              className="w-full gradient-primary text-white border-0 rounded-xl gap-2"
            >
              <Play className="h-4 w-4" /> متابعة الجلسة التالية
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

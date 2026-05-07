import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useParams, useNavigate } from "react-router-dom";
import { Play, Pause, Square, RotateCcw, Coffee, BookOpen, Timer } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import SessionSummary from "@/components/SessionSummary";
import { getTarget, setResume, getResume, clearResume } from "@/lib/study-targets";
import { verifyPremiumLive } from "@/lib/use-premium";
import { AdBanner } from "@/components/AdBanner";

const BREAK_SECONDS = 2 * 60; // 2-minute break between rounds

export default function StudySession() {
  const { id } = useParams();
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [roundSeconds, setRoundSeconds] = useState(0); // length of one focus round
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [round, setRound] = useState(1);
  const [studiedSeconds, setStudiedSeconds] = useState(0); // total focus seconds completed
  const [breakSeconds, setBreakSeconds] = useState(0);
  const [summary, setSummary] = useState<null | {
    focusMin: number; breakMin: number; rounds: number; xp: number;
    targetMin: number; doneSoFar: number;
  }>(null);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!id) return;
    supabase.from("study_sessions").select("*").eq("id", id).single().then(({ data }) => {
      if (data) {
        setSession(data);
        const r = (data as any).duration_minutes * 60;
        setRoundSeconds(r);
        // Try to resume previous state for this subject
        if (profile) {
          const prev = getResume(profile.id, (data as any).subject);
          if (prev && prev.sessionId === (data as any).id) {
            setRound(prev.round);
            setIsBreak(prev.isBreak);
            setTimeLeft(prev.timeLeft);
            setStudiedSeconds(prev.studiedSeconds);
            setBreakSeconds(prev.breakSeconds);
            toast.info(`استكملنا من الجولة ${prev.round} 🎯`);
            return;
          }
        }
        setTimeLeft(r);
      }
    });
  }, [id, profile]);

  // Persist resume state on every change (so user can come back exactly here)
  useEffect(() => {
    if (!profile || !session || !roundSeconds) return;
    setResume(profile.id, {
      subject: session.subject,
      sessionId: session.id,
      round,
      roundSeconds,
      timeLeft,
      isBreak,
      studiedSeconds,
      breakSeconds,
      savedAt: Date.now(),
    });
  }, [profile, session, round, roundSeconds, timeLeft, isBreak, studiedSeconds, breakSeconds]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!isBreak) {
            toast.success("أحسنت! استراحة قصيرة ☕");
            setStudiedSeconds((s) => s + roundSeconds);
            setIsBreak(true);
            return BREAK_SECONDS;
          } else {
            toast.info("الاستراحة انتهت! يلا نكمل 💪");
            setBreakSeconds((s) => s + BREAK_SECONDS);
            setIsBreak(false);
            setRound((r) => r + 1);
            return roundSeconds;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, isBreak, roundSeconds]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const totalSecondsCurrent = isBreak ? BREAK_SECONDS : roundSeconds;
  const progress = totalSecondsCurrent > 0 ? ((totalSecondsCurrent - timeLeft) / totalSecondsCurrent) * 100 : 0;

  const endSession = async () => {
    if (!profile || !session) return;
    setIsRunning(false);
    const ongoing = !isBreak ? roundSeconds - timeLeft : 0;
    const totalFocusSec = studiedSeconds + ongoing;
    const minutesStudied = Math.max(0, Math.round(totalFocusSec / 60));
    const breakMin = Math.round(breakSeconds / 60);
    // Premium users get +50% XP. Always re-verify against DB (not cached flag).
    const premiumLive = await verifyPremiumLive(profile.id);
    const xp = Math.round(minutesStudied * 2 * (premiumLive ? 1.5 : 1));
    const roundsDone = round - 1 + (ongoing > 0 ? 1 : 0);

    await supabase.from("study_sessions").update({
      ended_at: new Date().toISOString(),
      xp_earned: xp,
    }).eq("id", session.id);

    await supabase.from("profiles").update({
      total_hours: Number(profile.total_hours) + minutesStudied / 60,
      total_xp: profile.total_xp + xp,
      weekly_xp: profile.weekly_xp + xp,
    }).eq("id", profile.id);

    await refreshProfile();
    clearResume(profile.id, session.subject);
    // Compute total minutes done so far for this subject (sum of completed sessions)
    const t = getTarget(profile.id, session.subject);
    const targetMin = t?.targetMinutes || 120;
    const { data: rows } = await supabase
      .from("study_sessions")
      .select("duration_minutes, xp_earned")
      .eq("user_id", profile.id)
      .eq("subject", session.subject)
      .not("ended_at", "is", null);
    const doneSoFar = (rows || []).reduce((acc: number, r: any) => acc + (r.xp_earned ? r.xp_earned / 2 : 0), 0);

    setSummary({
      focusMin: minutesStudied,
      breakMin,
      rounds: Math.max(1, roundsDone),
      xp,
      targetMin,
      doneSoFar,
    });
  };

  if (!session) return <div className="text-center py-10 text-muted-foreground">جاري التحميل...</div>;

  if (summary) {
    return (
      <SessionSummary
        subject={session.subject}
        focusMinutes={summary.focusMin}
        breakMinutes={summary.breakMin}
        rounds={summary.rounds}
        xpEarned={summary.xp}
        targetMinutes={summary.targetMin}
        doneSoFarMinutes={summary.doneSoFar}
        onContinue={() => navigate(`/start-study?subject=${encodeURIComponent(session.subject)}`)}
      />
    );
  }

  const completedMinutes = Math.round((studiedSeconds + (!isBreak ? roundSeconds - timeLeft : 0)) / 60);

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">{session.subject}</Badge>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Timer className="h-3.5 w-3.5" />
          الجولة {round} • أنجزت {completedMinutes} دقيقة من المذاكرة الفعلية
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={isBreak ? "break" : "focus"}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
        >
          <Card className={`overflow-hidden border-0 shadow-2xl ${isBreak ? "bg-gradient-to-br from-emerald-500/10 to-teal-500/10" : "gradient-mesh text-white"}`}>
            <CardContent className="pt-8 pb-8 text-center space-y-5">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${isBreak ? "bg-emerald-500/15 text-emerald-600" : "bg-white/20 text-white"}`}>
                {isBreak ? <><Coffee className="h-3.5 w-3.5" /> وقت الاستراحة</> : <><BookOpen className="h-3.5 w-3.5" /> وقت التركيز</>}
              </div>

              <motion.div
                className={`text-7xl font-black font-mono tracking-tight ${isBreak ? "text-emerald-600" : "text-white drop-shadow-lg"}`}
                key={timeLeft}
                initial={{ scale: 1.04 }}
                animate={{ scale: 1 }}
              >
                {formatTime(timeLeft)}
              </motion.div>

              <div className={`w-full h-2.5 rounded-full overflow-hidden ${isBreak ? "bg-emerald-500/20" : "bg-white/20"}`}>
                <motion.div
                  className={`h-full rounded-full ${isBreak ? "bg-emerald-500" : "bg-white"}`}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "linear", duration: 0.3 }}
                />
              </div>

              <div className="flex justify-center gap-3">
                <Button
                  size="lg"
                  onClick={() => setIsRunning(!isRunning)}
                  className={`gap-2 min-w-[120px] rounded-xl font-black ${isBreak ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-white text-primary hover:bg-white/90"}`}
                >
                  {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                  {isRunning ? "إيقاف" : "ابدأ"}
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    setIsRunning(false);
                    setIsBreak(false);
                    setTimeLeft(roundSeconds);
                  }}
                  className={isBreak ? "" : "border-white/40 text-white hover:bg-white/10 hover:text-white"}
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <Card className="border-border/50">
        <CardContent className="py-3 grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">الجولة</p>
            <p className="font-black text-sm">{round}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">طول الجولة</p>
            <p className="font-black text-sm">{Math.round(roundSeconds / 60)} د</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium">الاستراحة</p>
            <p className="font-black text-sm">{BREAK_SECONDS / 60} د</p>
          </div>
        </CardContent>
      </Card>

      <Button variant="destructive" className="w-full gap-2 rounded-xl" onClick={endSession}>
        <Square className="h-4 w-4" />
        إنهاء وحفظ التقدم
      </Button>
      <AdBanner />
    </div>
  );
}

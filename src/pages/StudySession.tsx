import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useParams, useNavigate } from "react-router-dom";
import { Play, Pause, Square, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function StudySession() {
  const { id } = useParams();
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [totalStudied, setTotalStudied] = useState(0);

  useEffect(() => {
    if (!id) return;
    supabase.from("study_sessions").select("*").eq("id", id).single().then(({ data }) => {
      if (data) {
        setSession(data);
        setTimeLeft((data as any).duration_minutes * 60);
      }
    });
  }, [id]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (!isBreak) {
            toast.success("أحسنت! وقت الاستراحة 🎉");
            setTotalStudied((s) => s + (session?.duration_minutes || 25));
            setIsBreak(true);
            return 5 * 60;
          } else {
            toast.info("انتهت الاستراحة! يلا نكمل 💪");
            setIsBreak(false);
            return (session?.duration_minutes || 25) * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, isBreak, session]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const endSession = async () => {
    if (!profile || !session) return;
    const minutesStudied = totalStudied + (isBreak ? 0 : Math.floor(((session.duration_minutes * 60) - timeLeft) / 60));
    const xp = minutesStudied * 2;

    await supabase.from("study_sessions").update({
      ended_at: new Date().toISOString(),
      xp_earned: xp,
    }).eq("id", session.id);

    await supabase.from("profiles").update({
      total_hours: Number(profile.total_hours) + minutesStudied / 60,
      total_xp: profile.total_xp + xp,
      weekly_xp: profile.weekly_xp + xp,
      level: Math.floor((profile.total_xp + xp) / 200) + 1,
    }).eq("id", profile.id);

    await refreshProfile();
    toast.success(`أحسنت! حصلت على ${xp} نقطة XP 🎉`);
    navigate("/");
  };

  if (!session) return <div className="text-center py-10 text-muted-foreground">جاري التحميل...</div>;

  const totalSeconds = isBreak ? 5 * 60 : (session.duration_minutes * 60);
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="text-center">
        <Badge variant="outline" className="mb-2">{session.subject}</Badge>
        <h1 className="text-xl font-bold">{isBreak ? "🧘 وقت الاستراحة" : "📖 وقت الدراسة"}</h1>
      </div>

      <Card>
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <motion.div
            className="text-7xl font-bold font-mono gradient-text"
            key={timeLeft}
            initial={{ scale: 1.02 }}
            animate={{ scale: 1 }}
          >
            {formatTime(timeLeft)}
          </motion.div>

          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000 gradient-primary"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex justify-center gap-3">
            <Button
              size="lg"
              onClick={() => setIsRunning(!isRunning)}
              className="gradient-primary text-primary-foreground gap-2 min-w-[120px]"
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
                setTimeLeft(session.duration_minutes * 60);
              }}
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {session.chapters && (
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-sm text-muted-foreground">الفصول: <span className="font-medium text-foreground">{session.chapters}</span></p>
          </CardContent>
        </Card>
      )}

      <Button
        variant="destructive"
        className="w-full gap-2"
        onClick={endSession}
      >
        <Square className="h-4 w-4" />
        إنهاء الجلسة وحفظ التقدم
      </Button>
    </div>
  );
}

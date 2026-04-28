import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { BookOpen, Target, Plus, Trash2, Rocket, ArrowRight, ArrowLeft, Check, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { setTarget, getTarget, getResume } from "@/lib/study-targets";

const subjects = ["الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "اللغة العربية", "اللغة الإنجليزية", "التاريخ", "الجغرافيا", "الحاسوب", "البرمجة", "الطب", "الهندسة", "أخرى"];

const durations = [
  { label: "15 د", value: 15, emoji: "⚡", desc: "جلسة سريعة" },
  { label: "25 د", value: 25, emoji: "🍅", desc: "بومودورو" },
  { label: "30 د", value: 30, emoji: "⏰", desc: "ربع ساعة+" },
  { label: "45 د", value: 45, emoji: "📖", desc: "تركيز عميق" },
  { label: "60 د", value: 60, emoji: "🎯", desc: "ساعة كاملة" },
  { label: "90 د", value: 90, emoji: "🔥", desc: "ماراثون" },
];

const totalHourPresets = [1, 2, 3, 4, 6, 8];

interface Goal {
  id: number;
  description: string;
}

const stepTitles = ["اختر المادة", "حدد المدة", "ضع أهدافك", "انطلق"];

export default function StartStudy() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const resumeSubject = params.get("subject") || "";
  const [step, setStep] = useState(resumeSubject ? 1 : 0);
  const [subject, setSubject] = useState(resumeSubject);
  const [duration, setDuration] = useState<number>(25);
  const [targetHours, setTargetHours] = useState<number>(2);
  const [goals, setGoals] = useState<Goal[]>([{ id: 1, description: "" }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (resumeSubject && profile) {
      const t = getTarget(profile.id, resumeSubject);
      if (t) setTargetHours(Math.max(1, Math.round(t.targetMinutes / 60)));
      // If user has saved resume state for this subject -> jump straight in
      const r = getResume(profile.id, resumeSubject);
      if (r?.sessionId) {
        toast.success("نكمل من حيث وقفت 🎯");
        navigate(`/study-session/${r.sessionId}`, { replace: true });
      }
    }
  }, [resumeSubject, profile, navigate]);

  const addGoal = () => setGoals([...goals, { id: Date.now(), description: "" }]);
  const removeGoal = (id: number) => setGoals(goals.filter((g) => g.id !== id));
  const updateGoal = (id: number, desc: string) =>
    setGoals(goals.map((g) => (g.id === id ? { ...g, description: desc } : g)));

  const canNext = [!!subject, !!duration, true, true][step];

  const handleStart = async () => {
    if (!profile || !subject) return;
    setLoading(true);

    const validGoals = goals.filter((g) => g.description.trim());
    if (validGoals.length > 0) {
      await supabase.from("daily_goals").insert(
        validGoals.map((g) => ({
          user_id: profile.id,
          subject,
          description: g.description,
        }))
      );
    }

    const { data: session } = await supabase
      .from("study_sessions")
      .insert({ user_id: profile.id, subject, duration_minutes: duration })
      .select()
      .single();

    setLoading(false);
    if (session) {
      setTarget(profile.id, subject, {
        targetMinutes: targetHours * 60,
        lastSessionId: (session as any).id,
        lastUpdated: Date.now(),
      });
      toast.success("يلا نذاكر 💪");
      navigate(`/study-session/${(session as any).id}`);
    }
  };

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-black gradient-text">جلسة دراسة جديدة</h1>
        <p className="text-xs text-muted-foreground">{stepTitles[step]} • الخطوة {step + 1} من {stepTitles.length}</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center justify-between gap-1 px-1">
        {stepTitles.map((_, i) => (
          <div key={i} className="flex-1 flex items-center gap-1">
            <motion.div
              animate={{
                scale: i === step ? 1.1 : 1,
                backgroundColor: i <= step ? "hsl(var(--primary))" : "hsl(var(--muted))",
              }}
              className={`h-2 flex-1 rounded-full ${i <= step ? "glow-soft" : ""}`}
            />
          </div>
        ))}
      </div>

      {/* Steps */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
        >
          {step === 0 && (
            <Card className="border-primary/10">
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">اختر المادة الدراسية</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {subjects.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSubject(s)}
                      className={`p-3 rounded-xl border-2 text-sm font-bold transition-all ${
                        subject === s
                          ? "gradient-primary text-white border-transparent glow-primary scale-[1.02]"
                          : "border-border bg-card hover:border-primary/40"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <Card className="border-primary/10">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-5 w-5 text-secondary" />
                    <h3 className="font-bold">طول كل جولة تركيز</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {durations.map((d) => (
                      <button
                        key={d.value}
                        onClick={() => setDuration(d.value)}
                        className={`p-3 rounded-2xl border-2 text-center transition-all ${
                          duration === d.value
                            ? "gradient-primary text-white border-transparent glow-primary scale-[1.03]"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        <div className="text-xl mb-0.5">{d.emoji}</div>
                        <div className="font-black text-sm">{d.label}</div>
                        <div className={`text-[9px] ${duration === d.value ? "text-white/80" : "text-muted-foreground"}`}>{d.desc}</div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-3 text-center">
                    بين كل جولة وجولة استراحة 2 دقيقة تلقائياً ☕
                  </p>
                </CardContent>
              </Card>

              <Card className="border-primary/10">
                <CardContent className="pt-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Rocket className="h-5 w-5 text-primary" />
                    <h3 className="font-bold">كم ساعة تنوي تذاكر هالمادة؟</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {totalHourPresets.map((h) => (
                      <button
                        key={h}
                        onClick={() => setTargetHours(h)}
                        className={`p-3 rounded-xl border-2 font-black text-sm transition-all ${
                          targetHours === h
                            ? "gradient-primary text-white border-transparent"
                            : "border-border bg-card hover:border-primary/40"
                        }`}
                      >
                        {h} ساعة
                      </button>
                    ))}
                  </div>
                  <div className="mt-3">
                    <Input
                      type="number"
                      min={1}
                      placeholder="أو اكتب عدد ساعات مخصص..."
                      value={targetHours}
                      onChange={(e) => setTargetHours(Math.max(1, parseInt(e.target.value) || 1))}
                      className="text-center font-bold"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2 text-center">
                    سنحتسب الجولات والاستراحات لك. تقريباً {Math.ceil((targetHours * 60) / duration)} جولة
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {step === 2 && (
            <Card className="border-primary/10">
              <CardContent className="pt-5">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="h-5 w-5 text-primary" />
                  <h3 className="font-bold">شنو أهدافك بهالجلسة؟</h3>
                  <Badge variant="secondary" className="text-[10px] mr-auto">اختياري</Badge>
                </div>
                <div className="space-y-2">
                  {goals.map((goal, i) => (
                    <div key={goal.id} className="flex items-center gap-2 p-3 bg-muted/40 rounded-xl border border-dashed border-primary/20">
                      <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center text-white text-xs font-black shrink-0 glow-soft">
                        {i + 1}
                      </div>
                      <Input
                        placeholder={`هدف ${i + 1}: مثلاً "حل 10 مسائل"`}
                        value={goal.description}
                        onChange={(e) => updateGoal(goal.id, e.target.value)}
                        className="border-0 bg-transparent focus-visible:ring-0 p-0 h-auto text-sm"
                      />
                      {goals.length > 1 && (
                        <button onClick={() => removeGoal(goal.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" onClick={addGoal} className="gap-2 w-full text-primary hover:bg-primary/10">
                    <Plus className="h-4 w-4" /> إضافة هدف آخر
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card className="border-primary/20 overflow-hidden relative">
              <div className="absolute inset-0 gradient-mesh opacity-10" />
              <CardContent className="pt-6 pb-6 relative space-y-4">
                <div className="text-center">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="inline-flex w-16 h-16 rounded-2xl gradient-primary items-center justify-center glow-primary mb-3"
                  >
                    <Rocket className="h-8 w-8 text-white" />
                  </motion.div>
                  <h3 className="font-black text-lg">جاهز للانطلاق؟</h3>
                  <p className="text-xs text-muted-foreground">راجع تفاصيل جلستك</p>
                </div>

                <div className="space-y-2">
                  <div className="glass rounded-xl p-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">المادة</span>
                    <span className="font-bold text-sm">{subject}</span>
                  </div>
                  <div className="glass rounded-xl p-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">طول الجولة</span>
                    <span className="font-bold text-sm">{duration} دقيقة</span>
                  </div>
                  <div className="glass rounded-xl p-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">الهدف الكلي</span>
                    <span className="font-bold text-sm">{targetHours} ساعة</span>
                  </div>
                  <div className="glass rounded-xl p-3 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">الأهداف</span>
                    <span className="font-bold text-sm">{goals.filter(g => g.description.trim()).length} هدف</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Nav buttons */}
      <div className="flex gap-2">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(step - 1)} className="gap-2 flex-1 rounded-xl">
            <ArrowRight className="h-4 w-4" /> السابق
          </Button>
        )}
        {step < stepTitles.length - 1 ? (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canNext}
            className="gap-2 flex-[2] gradient-primary text-white border-0 rounded-xl glow-primary font-bold"
          >
            التالي <ArrowLeft className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleStart}
            disabled={loading}
            className="gap-2 flex-[2] gradient-primary text-white border-0 rounded-xl glow-primary font-black py-6"
          >
            {loading ? "جاري التحضير..." : <><Check className="h-5 w-5" /> انطلق 🚀</>}
          </Button>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { BookOpen, Brain, Loader2, GraduationCap, FileText, Award, ArrowRight, Save, Plus, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

type ExamType = "ministerial" | "exemption" | "success_test";
type Term = "first" | "mid" | "second";

const TERM_LABELS: Record<Term, string> = {
  first: "نصف أول",
  mid: "نصف السنة",
  second: "نصف ثاني",
};

interface Grade {
  id: string;
  subject: string;
  grade_value: number | null;
  max_grade: number | null;
  exam_type: ExamType | string;
  term: Term | string | null;
}

interface StudyPlan { id: string; subject: string; plan_content: string; created_at: string; }

const examInfo = {
  ministerial: {
    label: "اختبار الدخول الوزاري",
    desc: "درجاتك في الامتحانات الوزارية",
    icon: FileText,
    color: "from-violet-500 to-fuchsia-500",
  },
  exemption: {
    label: "اختبار الإعفاء",
    desc: "درجاتك في امتحانات الإعفاء",
    icon: Award,
    color: "from-amber-500 to-orange-500",
  },
  success_test: {
    label: "اختبار النجاح",
    desc: "6 أسئلة لمعرفة معدل نجاحك",
    icon: GraduationCap,
    color: "from-emerald-500 to-teal-500",
  },
} as const;

export default function Grades() {
  const { profile } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [activeExam, setActiveExam] = useState<ExamType | null>(null);
  const [generatingPlan, setGeneratingPlan] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, string>>({}); // key: subject|term
  const [saving, setSaving] = useState(false);

  const userSubjects = profile?.subjects || [];

  const fetchAll = async () => {
    if (!profile) return;
    const [g, p] = await Promise.all([
      supabase.from("student_grades").select("*").eq("user_id", profile.id),
      supabase.from("study_plans").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }),
    ]);
    setGrades((g.data as Grade[]) || []);
    setPlans((p.data as StudyPlan[]) || []);
  };

  useEffect(() => { fetchAll(); }, [profile]);

  // Pre-fill edit map when activeExam changes
  useEffect(() => {
    if (!activeExam) return;
    const map: Record<string, string> = {};
    userSubjects.forEach((s) => {
      (["first", "mid", "second"] as Term[]).forEach((t) => {
        const found = grades.find((g) => g.subject === s && g.exam_type === activeExam && g.term === t);
        map[`${s}|${t}`] = found?.grade_value != null ? String(found.grade_value) : "";
      });
    });
    setEditing(map);
  }, [activeExam, grades, userSubjects.join("|")]);

  const setField = (subject: string, term: Term, value: string) => {
    if (value && !/^\d{0,3}(\.\d{0,2})?$/.test(value)) return;
    setEditing((p) => ({ ...p, [`${subject}|${term}`]: value }));
  };

  const saveAll = async () => {
    if (!profile || !activeExam) return;
    setSaving(true);
    const ops: Promise<any>[] = [];
    for (const s of userSubjects) {
      for (const t of ["first", "mid", "second"] as Term[]) {
        const val = editing[`${s}|${t}`];
        const num = val ? parseFloat(val) : null;
        const existing = grades.find((g) => g.subject === s && g.exam_type === activeExam && g.term === t);
        if (existing && (num == null || isNaN(num))) {
          ops.push(Promise.resolve(supabase.from("student_grades").delete().eq("id", existing.id)));
        } else if (num != null && !isNaN(num)) {
          if (existing) {
            ops.push(Promise.resolve(supabase.from("student_grades").update({ grade_value: num }).eq("id", existing.id)));
          } else {
            ops.push(Promise.resolve(supabase.from("student_grades").insert({
              user_id: profile.id, subject: s, exam_type: activeExam, term: t,
              grade_value: num, max_grade: 100,
            } as any)));
          }
        }
      }
    }
    await Promise.all(ops);
    await fetchAll();
    setSaving(false);
    toast.success("تم حفظ الدرجات ✅");
  };

  // Subject avg = average of available terms (Iraqi-style "السعي السنوي")
  const subjectAverage = (subject: string): number | null => {
    if (!activeExam) return null;
    const vals = (["first", "mid", "second"] as Term[])
      .map((t) => {
        const v = editing[`${subject}|${t}`];
        return v ? parseFloat(v) : NaN;
      })
      .filter((n) => !isNaN(n));
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  };

  const overallAverage = useMemo(() => {
    const avgs = userSubjects.map(subjectAverage).filter((n): n is number => n != null);
    if (!avgs.length) return null;
    return avgs.reduce((a, b) => a + b, 0) / avgs.length;
  }, [editing, activeExam, userSubjects.join("|")]);

  const generatePlan = async (subject: string) => {
    setGeneratingPlan(subject);
    try {
      const avg = subjectAverage(subject);
      const { data, error } = await supabase.functions.invoke("generate-study-plan", {
        body: { subject, grade: profile?.grade, current_grade_value: avg, max_grade: 100, notes: "" },
      });
      if (error) throw error;
      await supabase.from("study_plans").insert({ user_id: profile!.id, subject, plan_content: data.plan });
      toast.success("تم إنشاء خطة الدراسة 🧠");
      fetchAll();
    } catch {
      toast.error("حصل خطأ في إنشاء الخطة");
    }
    setGeneratingPlan(null);
  };

  // ===== List view: choose exam type =====
  if (!activeExam) {
    return (
      <div className="space-y-5 max-w-lg mx-auto pb-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl p-5 gradient-mesh text-white shadow-xl"
        >
          <div className="absolute -top-10 -left-10 w-36 h-36 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="inline-flex items-center gap-1.5 text-[11px] bg-white/15 backdrop-blur px-2 py-1 rounded-full mb-2">
              <GraduationCap className="h-3 w-3" /> الدرجات
            </div>
            <h1 className="text-2xl font-black flex items-center gap-2"><BookOpen className="h-6 w-6" /> أداؤك الأكاديمي</h1>
            <p className="text-xs opacity-90 mt-2">اختر نوع الاختبار لإدخال درجات الفصول الثلاثة</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 gap-3">
          {(["ministerial", "exemption", "success_test"] as ExamType[]).map((t, i) => {
            const info = examInfo[t];
            const Icon = info.icon;
            const count = grades.filter((g) => g.exam_type === t).length;
            return (
              <motion.button
                key={t}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
                onClick={() => setActiveExam(t)}
                className="group relative overflow-hidden rounded-3xl p-5 text-right text-white shadow-lg card-hover"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${info.color}`} />
                <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-white/10 blur-2xl group-hover:scale-110 transition" />
                <div className="relative flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0">
                    <Icon className="h-7 w-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-lg">{info.label}</h3>
                    <p className="text-xs opacity-90">{info.desc}</p>
                    <p className="text-[10px] opacity-75 mt-1">{count} درجة محفوظة</p>
                  </div>
                  <ArrowRight className="h-5 w-5 opacity-80 rotate-180" />
                </div>
              </motion.button>
            );
          })}
        </div>

        {plans.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-black flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" /> خططك الذكية
            </h2>
            {plans.map((p) => (
              <Card key={p.id} className="glass border-0 card-hover">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                      <Brain className="h-3.5 w-3.5 text-white" />
                    </div>
                    {p.subject}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground/90">{p.plan_content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ===== Success Test special view =====
  if (activeExam === "success_test") {
    return <SuccessTestView subjects={userSubjects} onBack={() => setActiveExam(null)} />;
  }

  // ===== Exam detail view: per-subject 3-term entry =====
  const info = examInfo[activeExam];
  const Icon = info.icon;

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-3xl p-5 text-white shadow-xl bg-gradient-to-br ${info.color}`}
      >
        <div className="absolute -top-10 -left-10 w-36 h-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between gap-3">
          <div className="min-w-0">
            <button onClick={() => setActiveExam(null)} className="text-[11px] opacity-80 hover:opacity-100 mb-1 flex items-center gap-1">
              ← رجوع
            </button>
            <h1 className="text-xl font-black flex items-center gap-2"><Icon className="h-5 w-5" /> {info.label}</h1>
            {overallAverage != null ? (
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black">{overallAverage.toFixed(1)}</span>
                <span className="text-xs opacity-90">المعدل العام</span>
              </div>
            ) : (
              <p className="text-xs opacity-90 mt-2">أدخل درجاتك ليُحسب المعدل</p>
            )}
          </div>
          <Button size="sm" onClick={saveAll} disabled={saving} className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-0 gap-1 rounded-xl shrink-0">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} حفظ
          </Button>
        </div>
      </motion.div>

      {userSubjects.length === 0 ? (
        <Card className="glass border-0">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            لم تختر مواد بعد. عدّل ملفك الشخصي لإضافتها.
          </CardContent>
        </Card>
      ) : (
        userSubjects.map((s, i) => {
          const avg = subjectAverage(s);
          return (
            <motion.div key={s} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="glass border-0 overflow-hidden card-hover">
                <div className={`h-1.5 ${avg != null && avg >= 80 ? "bg-emerald-500" : avg != null && avg >= 60 ? "gradient-primary" : avg != null ? "bg-amber-500" : "bg-muted"}`} />
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm">{s}</h3>
                    {avg != null && (
                      <div className="text-left">
                        <p className="text-xl font-black gradient-text leading-none">{avg.toFixed(1)}</p>
                        <p className="text-[9px] text-muted-foreground">معدل المادة</p>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {(["first", "mid", "second"] as Term[]).map((t) => (
                      <div key={t} className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground font-bold">{TERM_LABELS[t]}</Label>
                        <Input
                          inputMode="decimal"
                          placeholder="0-100"
                          value={editing[`${s}|${t}`] ?? ""}
                          onChange={(e) => setField(s, t, e.target.value)}
                          className="text-center font-black h-10 rounded-xl"
                        />
                      </div>
                    ))}
                  </div>
                  <Button
                    size="sm" variant="outline"
                    onClick={() => generatePlan(s)} disabled={generatingPlan === s || avg == null}
                    className="w-full gap-1 rounded-xl"
                  >
                    {generatingPlan === s ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
                    خطة دراسة ذكية
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })
      )}
    </div>
  );
}

// ===================== Success Test sub-view =====================
interface QItem { max: string; earned: string; }

function SuccessTestView({ subjects, onBack }: { subjects: string[]; onBack: () => void }) {
  const [subject, setSubject] = useState<string>(subjects[0] || "");
  const [questions, setQuestions] = useState<QItem[]>(
    Array.from({ length: 6 }, () => ({ max: "", earned: "" }))
  );
  const [submitted, setSubmitted] = useState(false);

  const validNum = (v: string) => v && /^\d{0,4}(\.\d{0,2})?$/.test(v);

  const setField = (i: number, key: keyof QItem, v: string) => {
    if (v && !validNum(v)) return;
    setQuestions((p) => p.map((q, idx) => (idx === i ? { ...q, [key]: v } : q)));
  };

  const addQ = () => setQuestions((p) => [...p, { max: "", earned: "" }]);
  const removeQ = (i: number) => setQuestions((p) => p.filter((_, idx) => idx !== i));

  const totals = questions.reduce(
    (acc, q) => {
      const m = parseFloat(q.max);
      const e = parseFloat(q.earned);
      if (!isNaN(m) && m > 0 && !isNaN(e)) {
        acc.max += m;
        acc.earned += Math.min(e, m);
        acc.count += 1;
      }
      return acc;
    },
    { max: 0, earned: 0, count: 0 }
  );

  const finalScore = totals.max > 0 ? (totals.earned / totals.max) * 100 : 0;
  const passed = finalScore >= 50;

  const reset = () => {
    setQuestions(Array.from({ length: 6 }, () => ({ max: "", earned: "" })));
    setSubmitted(false);
  };

  if (!subject) {
    return (
      <Card className="glass border-0 max-w-lg mx-auto">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          لم تختر مواد بعد. عدّل ملفك الشخصي لإضافتها.
          <Button onClick={onBack} variant="outline" className="mt-4 rounded-xl">رجوع</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-5 text-white shadow-xl bg-gradient-to-br from-emerald-500 to-teal-500">
        <button onClick={onBack} className="text-[11px] opacity-80 mb-1 flex items-center gap-1">← رجوع</button>
        <h1 className="text-xl font-black flex items-center gap-2"><GraduationCap className="h-5 w-5" /> اختبار النجاح</h1>
        <p className="text-xs opacity-90 mt-1">حدّد قيمة كل سؤال والدرجة التي حصلت عليها — يحسب المعدل من 100.</p>
      </motion.div>

      <Card className="glass border-0">
        <CardContent className="pt-4 space-y-3">
          <div>
            <Label className="text-xs font-bold mb-2 block">اختر المادة</Label>
            <div className="grid grid-cols-2 gap-2">
              {subjects.map((s) => (
                <button key={s} onClick={() => { setSubject(s); reset(); }}
                  className={`p-2 rounded-xl border-2 text-xs font-bold transition ${
                    subject === s ? "gradient-primary text-white border-transparent" : "border-border bg-card"
                  }`}>{s}</button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {questions.map((q, i) => (
              <div key={i} className="rounded-xl border border-border/60 p-2 space-y-2 bg-background/40">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg gradient-primary text-white flex items-center justify-center text-xs font-black">{i + 1}</div>
                    <span className="text-xs font-bold">السؤال {i + 1}</span>
                  </div>
                  {questions.length > 1 && (
                    <button onClick={() => removeQ(i)} className="text-destructive p-1 hover:bg-destructive/10 rounded-lg">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground font-bold">قيمة السؤال</Label>
                    <Input
                      inputMode="decimal" placeholder="مثلاً 12"
                      value={q.max} onChange={(e) => setField(i, "max", e.target.value)}
                      className="text-center font-bold rounded-xl h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground font-bold">درجتك</Label>
                    <Input
                      inputMode="decimal" placeholder="0"
                      value={q.earned} onChange={(e) => setField(i, "earned", e.target.value)}
                      className="text-center font-bold rounded-xl h-9"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={addQ} variant="outline" className="w-full gap-1 rounded-xl">
            <Plus className="h-4 w-4" /> إضافة سؤال
          </Button>

          {totals.count > 0 && (
            <div className="text-[11px] text-center text-muted-foreground">
              المجموع: {totals.earned.toFixed(1)} / {totals.max.toFixed(1)} ({totals.count} أسئلة)
            </div>
          )}

          <Button onClick={() => setSubmitted(true)} disabled={totals.count < 1 || totals.max <= 0}
            className="w-full gradient-primary text-white border-0 rounded-xl font-black py-5">
            احسب معدل النجاح 🎯
          </Button>
        </CardContent>
      </Card>

      {submitted && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className={`border-0 overflow-hidden ${passed ? "bg-gradient-to-br from-emerald-500 to-teal-500" : "bg-gradient-to-br from-rose-500 to-orange-500"} text-white shadow-2xl`}>
            <CardContent className="pt-6 pb-6 text-center space-y-3">
              <div className="text-6xl">{passed ? "🎉" : "💪"}</div>
              <h2 className="text-3xl font-black">{finalScore.toFixed(1)}/100</h2>
              <p className="text-sm font-bold opacity-95">معدلك في {subject}</p>
              <p className="text-[11px] opacity-90">({totals.earned.toFixed(1)} من {totals.max.toFixed(1)})</p>
              <div className="inline-block px-4 py-2 rounded-full text-sm font-black bg-white/25">
                {passed ? "✅ ناجح" : "❌ راسب"}
              </div>
              <p className="text-xs opacity-95 leading-relaxed pt-2 max-w-md mx-auto">
                {passed
                  ? "ممتاز! استمر على هذا الأداء وارفع طموحك أكثر، أنت تستحق التفوق ⭐"
                  : "لا تستسلم أبداً! 🔥 الراسب اليوم هو الناجح غداً إذا قرر النهوض الآن. ابدأ جلسة دراسة الآن وحوّل هذا الرقم إلى نصر 💎"}
              </p>
              <Button onClick={reset} variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30 rounded-xl mt-2">
                إعادة المحاولة
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

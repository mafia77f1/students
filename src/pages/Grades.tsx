import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { BookOpen, Plus, Brain, Loader2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

const subjects = ["الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "اللغة العربية", "اللغة الإنجليزية", "التاريخ", "الجغرافيا", "الحاسوب", "البرمجة", "الطب", "الهندسة", "أخرى"];

interface Grade {
  id: string;
  subject: string;
  grade_value: number;
  max_grade: number;
  semester: string;
  academic_year: string;
  notes: string;
}

interface StudyPlan {
  id: string;
  subject: string;
  plan_content: string;
  is_active: boolean;
  progress: number;
  created_at: string;
}

export default function Grades() {
  const { profile } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [gradeValue, setGradeValue] = useState("");
  const [maxGrade, setMaxGrade] = useState("100");
  const [semester, setSemester] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [notes, setNotes] = useState("");
  const [generatingPlan, setGeneratingPlan] = useState<string | null>(null);
  const [tab, setTab] = useState<"grades" | "plans">("grades");

  const fetchGrades = async () => {
    if (!profile) return;
    const { data } = await supabase.from("student_grades").select("*").eq("user_id", profile.id).order("created_at", { ascending: false });
    setGrades((data as Grade[]) || []);
  };

  const fetchPlans = async () => {
    if (!profile) return;
    const { data } = await supabase.from("study_plans").select("*").eq("user_id", profile.id).order("created_at", { ascending: false });
    setPlans((data as StudyPlan[]) || []);
  };

  useEffect(() => { fetchGrades(); fetchPlans(); }, [profile]);

  const addGrade = async () => {
    if (!profile || !subject || !gradeValue) return;
    const { error } = await supabase.from("student_grades").insert({
      user_id: profile.id, subject, grade_value: parseFloat(gradeValue), max_grade: parseFloat(maxGrade),
      semester, academic_year: academicYear, notes,
    });
    if (error) toast.error("حصل خطأ");
    else {
      toast.success("تم إضافة الدرجة!");
      setDialogOpen(false);
      setSubject(""); setGradeValue(""); setNotes("");
      fetchGrades();
    }
  };

  const deleteGrade = async (id: string) => {
    await supabase.from("student_grades").delete().eq("id", id);
    fetchGrades();
  };

  const generatePlan = async (g: Grade) => {
    setGeneratingPlan(g.id);
    try {
      const { data, error } = await supabase.functions.invoke("generate-study-plan", {
        body: { subject: g.subject, grade: profile?.grade, current_grade_value: g.grade_value, max_grade: g.max_grade, notes: g.notes },
      });
      if (error) throw error;
      await supabase.from("study_plans").insert({
        user_id: profile!.id, subject: g.subject, plan_content: data.plan,
      });
      toast.success("تم إنشاء خطة الدراسة! 🧠");
      fetchPlans();
      setTab("plans");
    } catch {
      toast.error("حصل خطأ في إنشاء الخطة");
    }
    setGeneratingPlan(null);
  };

  const overallAverage = grades.length > 0
    ? (grades.reduce((sum, g) => sum + (g.grade_value / g.max_grade) * 100, 0) / grades.length).toFixed(1)
    : null;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6 text-primary" /> الدرجات والخطط
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground gap-2"><Plus className="h-4 w-4" /> إضافة درجة</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>إضافة درجة مادة</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="space-y-2">
                <Label>المادة</Label>
                <Select value={subject} onValueChange={setSubject}>
                  <SelectTrigger><SelectValue placeholder="اختر المادة" /></SelectTrigger>
                  <SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>الدرجة</Label>
                  <Input type="number" placeholder="85" value={gradeValue} onChange={e => setGradeValue(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>من</Label>
                  <Input type="number" placeholder="100" value={maxGrade} onChange={e => setMaxGrade(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>الفصل</Label>
                  <Input placeholder="الأول" value={semester} onChange={e => setSemester(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>السنة</Label>
                  <Input placeholder="2025-2026" value={academicYear} onChange={e => setAcademicYear(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>ملاحظات</Label>
                <Textarea placeholder="ملاحظات عن المادة..." value={notes} onChange={e => setNotes(e.target.value)} />
              </div>
              <Button className="w-full gradient-primary text-primary-foreground" onClick={addGrade} disabled={!subject || !gradeValue}>إضافة</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {overallAverage && (
        <Card className="glow-primary">
          <CardContent className="pt-5 text-center">
            <p className="text-sm text-muted-foreground">المعدل العام</p>
            <p className="text-4xl font-bold gradient-text">{overallAverage}%</p>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button variant={tab === "grades" ? "default" : "outline"} onClick={() => setTab("grades")}
          className={tab === "grades" ? "gradient-primary text-primary-foreground" : ""}>الدرجات</Button>
        <Button variant={tab === "plans" ? "default" : "outline"} onClick={() => setTab("plans")}
          className={tab === "plans" ? "gradient-primary text-primary-foreground" : ""}>خطط الدراسة</Button>
      </div>

      {tab === "grades" ? (
        <div className="space-y-3">
          {grades.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">لم تضف أي درجات بعد</p>
          ) : (
            grades.map((g, i) => (
              <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold">{g.subject}</p>
                        <p className="text-xs text-muted-foreground">{g.semester} • {g.academic_year}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-bold text-primary">{g.grade_value}<span className="text-sm text-muted-foreground">/{g.max_grade}</span></p>
                        <p className="text-xs text-muted-foreground">{((g.grade_value / g.max_grade) * 100).toFixed(0)}%</p>
                      </div>
                    </div>
                    {g.notes && <p className="text-sm text-muted-foreground mb-2">{g.notes}</p>}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="gap-1 flex-1" onClick={() => generatePlan(g)} disabled={generatingPlan === g.id}>
                        {generatingPlan === g.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Brain className="h-3 w-3" />}
                        إنشاء خطة دراسة
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteGrade(g.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {plans.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">لا توجد خطط دراسية بعد. أضف درجة واطلب خطة!</p>
          ) : (
            plans.map(p => (
              <Card key={p.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" /> {p.subject}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("ar")}</p>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap text-sm leading-relaxed">{p.plan_content}</div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

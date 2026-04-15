import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BookOpen, Target, Plus, Trash2, Rocket } from "lucide-react";
import { motion } from "framer-motion";

const subjects = ["الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "اللغة العربية", "اللغة الإنجليزية", "التاريخ", "الجغرافيا", "الحاسوب", "البرمجة", "الطب", "الهندسة", "أخرى"];

const durations = [
  { label: "15 د", value: 15, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  { label: "25 د", value: 25, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  { label: "45 د", value: 45, color: "bg-violet-500/10 text-violet-500 border-violet-500/20" },
  { label: "60 د", value: 60, color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  { label: "90 د", value: 90, color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
  { label: "120 د", value: 120, color: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" },
];

interface Goal {
  id: number;
  description: string;
}

export default function StartStudy() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState<number>(25);
  const [goals, setGoals] = useState<Goal[]>([{ id: 1, description: "" }]);
  const [loading, setLoading] = useState(false);

  const addGoal = () => setGoals([...goals, { id: Date.now(), description: "" }]);
  const removeGoal = (id: number) => setGoals(goals.filter((g) => g.id !== id));
  const updateGoal = (id: number, desc: string) =>
    setGoals(goals.map((g) => (g.id === id ? { ...g, description: desc } : g)));

  const handleStart = async () => {
    if (!profile || !subject) {
      toast.error("اختر المادة أولاً");
      return;
    }
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
      .insert({
        user_id: profile.id,
        subject,
        duration_minutes: duration,
      })
      .select()
      .single();

    setLoading(false);
    if (session) {
      toast.success("تم بدء الجلسة! يلا نذاكر 💪");
      navigate(`/study-session/${(session as any).id}`);
    }
  };

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-center">🚀 ابدأ جلسة دراسة</h1>

      {/* Subject Selection */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardContent className="pt-5">
            <Label className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-primary" /> اختر المادة
            </Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger><SelectValue placeholder="اختر المادة..." /></SelectTrigger>
              <SelectContent>
                {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </motion.div>

      {/* Duration Cards */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Label className="text-sm font-medium mb-2 block">⏱ مدة الدراسة</Label>
        <div className="grid grid-cols-3 gap-2">
          {durations.map((d) => (
            <Card
              key={d.value}
              onClick={() => setDuration(d.value)}
              className={`cursor-pointer transition-all text-center ${
                duration === d.value
                  ? "ring-2 ring-primary shadow-lg scale-[1.03]"
                  : "hover:shadow-md"
              }`}
            >
              <CardContent className="py-4 px-2">
                <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center text-lg font-bold ${d.color}`}>
                  {d.value}
                </div>
                <p className="text-xs font-medium">{d.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Goals as Cards */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Label className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-secondary" /> أهداف الجلسة
        </Label>
        <div className="space-y-2">
          {goals.map((goal, i) => (
            <Card key={goal.id} className="bg-muted/30 border-dashed">
              <CardContent className="py-3 px-4 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                <Input
                  placeholder={`هدف ${i + 1}...`}
                  value={goal.description}
                  onChange={(e) => updateGoal(goal.id, e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 p-0 h-auto text-sm"
                />
                {goals.length > 1 && (
                  <button onClick={() => removeGoal(goal.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
          <Button variant="ghost" size="sm" onClick={addGoal} className="gap-2 w-full text-muted-foreground hover:text-primary">
            <Plus className="h-4 w-4" /> إضافة هدف
          </Button>
        </div>
      </motion.div>

      {/* Start Button */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        <Button
          className="w-full gradient-primary text-primary-foreground text-base py-6 gap-2 rounded-xl"
          onClick={handleStart}
          disabled={!subject || loading}
        >
          {loading ? "جاري التحضير..." : <><Rocket className="h-5 w-5" /> ابدأ الآن</>}
        </Button>
      </motion.div>
    </div>
  );
}

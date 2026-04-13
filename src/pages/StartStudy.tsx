import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { BookOpen, Clock, Target, Plus, Trash2 } from "lucide-react";

const subjects = ["الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "اللغة العربية", "اللغة الإنجليزية", "التاريخ", "الجغرافيا", "الحاسوب", "البرمجة", "الطب", "الهندسة", "أخرى"];
const durations = [
  { label: "15 دقيقة", value: 15 },
  { label: "25 دقيقة", value: 25 },
  { label: "45 دقيقة", value: 45 },
  { label: "60 دقيقة", value: 60 },
  { label: "90 دقيقة", value: 90 },
  { label: "120 دقيقة", value: 120 },
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
  const [chapters, setChapters] = useState("");
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

    // Create daily goals
    const validGoals = goals.filter((g) => g.description.trim());
    if (validGoals.length > 0) {
      await supabase.from("daily_goals").insert(
        validGoals.map((g) => ({
          user_id: profile.id,
          subject,
          description: g.description,
          target_chapters: parseInt(chapters) || 1,
        }))
      );
    }

    // Create study session
    const { data: session } = await supabase
      .from("study_sessions")
      .insert({
        user_id: profile.id,
        subject,
        duration_minutes: duration,
        chapters: chapters || null,
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
    <div className="space-y-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">ابدأ جلسة دراسة</h1>

      <Card>
        <CardContent className="pt-6 space-y-5">
          {/* Subject */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              المادة
            </Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger><SelectValue placeholder="اختر المادة" /></SelectTrigger>
              <SelectContent>
                {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              مدة الدراسة
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {durations.map((d) => (
                <Button
                  key={d.value}
                  variant={duration === d.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setDuration(d.value)}
                  className={duration === d.value ? "gradient-primary text-primary-foreground" : ""}
                >
                  {d.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Chapters */}
          <div className="space-y-2">
            <Label>الفصول / الأقسام</Label>
            <Input
              placeholder="مثال: الفصل 3 و 4"
              value={chapters}
              onChange={(e) => setChapters(e.target.value)}
            />
          </div>

          {/* Goals */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4 text-secondary" />
              أهداف الجلسة
            </Label>
            {goals.map((goal, i) => (
              <div key={goal.id} className="flex gap-2">
                <Input
                  placeholder={`الهدف ${i + 1}...`}
                  value={goal.description}
                  onChange={(e) => updateGoal(goal.id, e.target.value)}
                />
                {goals.length > 1 && (
                  <Button size="icon" variant="ghost" onClick={() => removeGoal(goal.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addGoal} className="gap-2 w-full">
              <Plus className="h-4 w-4" />
              إضافة هدف
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button
        className="w-full gradient-primary text-primary-foreground text-lg py-6"
        onClick={handleStart}
        disabled={!subject || loading}
      >
        {loading ? "جاري التحضير..." : "ابدأ الدراسة 🚀"}
      </Button>
    </div>
  );
}

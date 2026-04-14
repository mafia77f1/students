import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Calendar, GraduationCap, BookOpen, UserCheck } from "lucide-react";

const countries = ["العراق", "السعودية", "مصر", "الأردن", "الإمارات", "الكويت", "البحرين", "قطر", "عُمان", "اليمن", "سوريا", "لبنان", "فلسطين", "ليبيا", "تونس", "الجزائر", "المغرب", "السودان", "أخرى"];
const grades = ["الابتدائي", "المتوسط", "الإعدادي", "الثانوي", "الجامعي", "دراسات عليا"];
const subjectsList = ["الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "اللغة العربية", "اللغة الإنجليزية", "التاريخ", "الجغرافيا", "الحاسوب", "البرمجة", "الطب", "الهندسة", "القانون", "إدارة الأعمال", "أخرى"];

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState<string>("");
  const [country, setCountry] = useState("");
  const [age, setAge] = useState("");
  const [grade, setGrade] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const toggleSubject = (sub: string) => {
    setSelectedSubjects((prev) => prev.includes(sub) ? prev.filter((s) => s !== sub) : [...prev, sub]);
  };

  const handleComplete = async () => {
    if (!user) return;
    setLoading(true);

    const updates: any = {
      role,
      country,
      age: parseInt(age) || null,
      grade,
      subjects: selectedSubjects,
      onboarding_completed: true,
    };

    const { error } = await supabase.from("profiles").update(updates).eq("id", user.id);

    if (error) toast.error("حصل خطأ، حاول مرة أخرى");
    else {
      // Create teacher profile if teacher
      if (role === "teacher") {
        await supabase.from("teacher_profiles").insert({ user_id: user.id });
      }
      toast.success("تم إعداد حسابك بنجاح! 🎉");
      await refreshProfile();
    }
    setLoading(false);
  };

  const steps = [
    {
      icon: <UserCheck className="h-6 w-6" />,
      title: "أنت طالب أم أستاذ؟",
      content: (
        <div className="grid grid-cols-2 gap-4">
          <Card
            className={`cursor-pointer transition-all p-6 text-center ${role === "student" ? "ring-2 ring-primary bg-accent" : "hover:bg-muted"}`}
            onClick={() => setRole("student")}
          >
            <GraduationCap className="h-10 w-10 mx-auto mb-2 text-primary" />
            <p className="font-bold">طالب</p>
          </Card>
          <Card
            className={`cursor-pointer transition-all p-6 text-center ${role === "teacher" ? "ring-2 ring-primary bg-accent" : "hover:bg-muted"}`}
            onClick={() => setRole("teacher")}
          >
            <BookOpen className="h-10 w-10 mx-auto mb-2 text-secondary" />
            <p className="font-bold">أستاذ</p>
          </Card>
        </div>
      ),
      valid: !!role,
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: "من أي بلد أنت؟",
      content: (
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger><SelectValue placeholder="اختر بلدك" /></SelectTrigger>
          <SelectContent>{countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      ),
      valid: !!country,
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: "كم عمرك؟",
      content: <Input type="number" placeholder="مثال: 18" value={age} onChange={(e) => setAge(e.target.value)} min={10} max={60} />,
      valid: !!age && parseInt(age) >= 10,
    },
    {
      icon: <GraduationCap className="h-6 w-6" />,
      title: "ما هي مرحلتك الدراسية؟",
      content: (
        <Select value={grade} onValueChange={setGrade}>
          <SelectTrigger><SelectValue placeholder="اختر المرحلة" /></SelectTrigger>
          <SelectContent>{grades.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
        </Select>
      ),
      valid: !!grade,
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: role === "teacher" ? "ما هي المواد التي تُدرّسها؟" : "ما هي المواد التي تريد التركيز عليها؟",
      content: (
        <div className="flex flex-wrap gap-2">
          {subjectsList.map((sub) => (
            <Badge
              key={sub}
              variant={selectedSubjects.includes(sub) ? "default" : "outline"}
              className={`cursor-pointer text-sm py-1.5 px-3 transition-all ${selectedSubjects.includes(sub) ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              onClick={() => toggleSubject(sub)}
            >
              {sub}
            </Badge>
          ))}
        </div>
      ),
      valid: selectedSubjects.length > 0,
    },
  ];

  const current = steps[step];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-lg shadow-xl glow-primary">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center gap-2 mb-2">
            {steps.map((_, i) => (
              <div key={i} className={`h-2 rounded-full transition-all ${i <= step ? "w-8 gradient-primary" : "w-8 bg-muted"}`} />
            ))}
          </div>
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            {current.icon}
          </div>
          <CardTitle className="text-xl">{current.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {current.content}
          <div className="flex gap-3">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">رجوع</Button>
            )}
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!current.valid} className="flex-1 gradient-primary text-primary-foreground gap-2">
                التالي <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleComplete} disabled={!current.valid || loading} className="flex-1 gradient-primary text-primary-foreground">
                {loading ? "جاري الحفظ..." : "ابدأ الآن 🚀"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

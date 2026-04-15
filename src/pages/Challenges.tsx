import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Swords, Plus, Calendar, Trophy, CheckCircle, XCircle, Loader2, Clock, Target } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const subjects = ["الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "اللغة العربية", "اللغة الإنجليزية", "الحاسوب", "البرمجة", "الطب", "الهندسة", "أخرى"];

const durationPresets = [
  { label: "أسبوع", days: 7 },
  { label: "أسبوعين", days: 14 },
  { label: "شهر", days: 30 },
  { label: "شهرين", days: 60 },
  { label: "3 أشهر", days: 90 },
];

interface Challenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  subject: string;
  duration_minutes: number;
  duration_days: number | null;
  title: string | null;
  end_date: string | null;
  status: string;
  challenger_xp: number;
  challenged_xp: number;
  winner_id: string | null;
  created_at: string;
}

interface UserOption { id: string; name: string; }

export default function Challenges() {
  const { profile } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [title, setTitle] = useState("");
  const [durationType, setDurationType] = useState<"preset" | "custom" | "date">("preset");
  const [durationDays, setDurationDays] = useState(7);
  const [customDays, setCustomDays] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchUser, setSearchUser] = useState("");

  const fetchChallenges = async () => {
    if (!profile) return;
    const { data } = await supabase
      .from("challenges")
      .select("*")
      .or(`challenger_id.eq.${profile.id},challenged_id.eq.${profile.id}`)
      .order("created_at", { ascending: false });
    setChallenges((data as Challenge[]) || []);
  };

  const searchUsers = async (query: string) => {
    if (query.length < 2) return;
    const { data } = await supabase
      .from("profiles").select("id, name")
      .neq("id", profile?.id || "")
      .ilike("name", `%${query}%`).limit(10);
    setUsers((data as UserOption[]) || []);
  };

  useEffect(() => { fetchChallenges(); }, [profile]);

  useEffect(() => {
    if (!profile) return;
    const channel = supabase.channel("challenges-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "challenges" }, fetchChallenges)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const createChallenge = async () => {
    if (!profile || !selectedUser || !selectedSubject || !title.trim()) return;
    
    let days = durationDays;
    let end: string | null = null;
    
    if (durationType === "custom" && customDays) {
      days = parseInt(customDays);
    } else if (durationType === "date" && endDate) {
      const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      days = Math.max(1, diff);
      end = endDate;
    }

    const { error } = await supabase.from("challenges").insert({
      challenger_id: profile.id,
      challenged_id: selectedUser,
      subject: selectedSubject,
      duration_minutes: 25,
      duration_days: days,
      title: title.trim(),
      end_date: end,
    });
    if (error) toast.error("حصل خطأ");
    else {
      toast.success("تم إرسال التحدي! ⚔️");
      setDialogOpen(false);
      setTitle(""); setSelectedUser(""); setSelectedSubject(""); setSearchUser("");
      fetchChallenges();
    }
  };

  const acceptChallenge = async (id: string) => {
    await supabase.from("challenges").update({ status: "active", started_at: new Date().toISOString() }).eq("id", id);
    toast.success("تم قبول التحدي! 💪");
  };

  const declineChallenge = async (id: string) => {
    await supabase.from("challenges").update({ status: "declined" }).eq("id", id);
  };

  const formatDuration = (c: Challenge) => {
    if (c.duration_days) {
      if (c.duration_days >= 30) return `${Math.round(c.duration_days / 30)} شهر`;
      return `${c.duration_days} يوم`;
    }
    return `${c.duration_minutes} دقيقة`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "active": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "completed": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "declined": return "bg-muted text-muted-foreground";
      default: return "";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "في الانتظار";
      case "active": return "جاري";
      case "completed": return "منتهي";
      case "declined": return "مرفوض";
      default: return "";
    }
  };

  const pendingReceived = challenges.filter(c => c.status === "pending" && c.challenged_id === profile?.id);
  const activeChallenges = challenges.filter(c => c.status === "active");
  const pastChallenges = challenges.filter(c => c.status === "completed" || c.status === "declined");

  const ChallengeCard = ({ c, showActions }: { c: Challenge; showActions?: boolean }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`overflow-hidden ${c.status === "active" ? "ring-1 ring-primary/30" : ""}`}>
        <div className={`h-1.5 ${c.status === "active" ? "bg-primary" : c.status === "pending" ? "bg-amber-500" : "bg-muted"}`} />
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-sm">{c.title || c.subject}</h3>
              <p className="text-xs text-muted-foreground">{c.subject}</p>
            </div>
            <Badge variant="outline" className={`text-[10px] ${getStatusColor(c.status)}`}>
              {getStatusLabel(c.status)}
            </Badge>
          </div>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDuration(c)}</span>
            {c.end_date && <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {new Date(c.end_date).toLocaleDateString("ar")}</span>}
          </div>

          {c.status === "active" && (
            <div className="bg-primary/5 rounded-lg p-2 text-center">
              <p className="text-lg font-bold text-primary">{c.challenger_id === profile?.id ? c.challenger_xp : c.challenged_xp} XP</p>
              <p className="text-[10px] text-muted-foreground">نقاطك في التحدي</p>
            </div>
          )}

          {showActions && (
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 gradient-primary text-primary-foreground gap-1" onClick={() => acceptChallenge(c.id)}>
                <CheckCircle className="h-4 w-4" /> قبول
              </Button>
              <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => declineChallenge(c.id)}>
                <XCircle className="h-4 w-4" /> رفض
              </Button>
            </div>
          )}

          {c.status === "completed" && c.winner_id === profile?.id && (
            <div className="flex items-center gap-1 text-secondary text-xs font-medium">
              <Trophy className="h-3.5 w-3.5" /> فزت بهذا التحدي!
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Swords className="h-5 w-5 text-primary" /> التحديات
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground gap-1"><Plus className="h-4 w-4" /> تحدي جديد</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>إنشاء تحدي جديد ⚔️</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>عنوان التحدي</Label>
                <Input placeholder="مثال: إكمال جميع المناهج للامتحانات النهائية" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>ابحث عن طالب</Label>
                <Input placeholder="اكتب اسم الطالب..." value={searchUser} onChange={(e) => { setSearchUser(e.target.value); searchUsers(e.target.value); }} />
                {users.length > 0 && (
                  <div className="border rounded-lg max-h-32 overflow-y-auto">
                    {users.map(u => (
                      <button key={u.id} onClick={() => { setSelectedUser(u.id); setSearchUser(u.name); setUsers([]); }}
                        className={`w-full text-right p-2 hover:bg-muted text-sm ${selectedUser === u.id ? "bg-accent" : ""}`}>{u.name}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>المادة</Label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger><SelectValue placeholder="اختر المادة" /></SelectTrigger>
                  <SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>مدة التحدي</Label>
                <div className="flex gap-2 mb-2">
                  {(["preset", "custom", "date"] as const).map(t => (
                    <Button key={t} variant={durationType === t ? "default" : "outline"} size="sm" onClick={() => setDurationType(t)}
                      className={durationType === t ? "gradient-primary text-primary-foreground" : ""}>
                      {t === "preset" ? "جاهز" : t === "custom" ? "مخصص" : "تاريخ"}
                    </Button>
                  ))}
                </div>
                {durationType === "preset" && (
                  <div className="flex flex-wrap gap-2">
                    {durationPresets.map(d => (
                      <Button key={d.days} variant={durationDays === d.days ? "default" : "outline"} size="sm"
                        onClick={() => setDurationDays(d.days)}
                        className={durationDays === d.days ? "gradient-primary text-primary-foreground" : ""}>
                        {d.label}
                      </Button>
                    ))}
                  </div>
                )}
                {durationType === "custom" && (
                  <Input type="number" placeholder="عدد الأيام..." value={customDays} onChange={(e) => setCustomDays(e.target.value)} />
                )}
                {durationType === "date" && (
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                )}
              </div>
              <Button className="w-full gradient-primary text-primary-foreground" onClick={createChallenge}
                disabled={!selectedUser || !selectedSubject || !title.trim()}>
                أرسل التحدي ⚔️
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {pendingReceived.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-amber-500">⏳ تحديات بانتظارك</h2>
          {pendingReceived.map(c => <ChallengeCard key={c.id} c={c} showActions />)}
        </div>
      )}

      {activeChallenges.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-primary">🔥 تحديات جارية</h2>
          {activeChallenges.map(c => <ChallengeCard key={c.id} c={c} />)}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-bold text-muted-foreground">📋 السجل</h2>
        {pastChallenges.length === 0 ? (
          <p className="text-center py-6 text-muted-foreground text-sm">لا توجد تحديات سابقة</p>
        ) : (
          pastChallenges.map(c => <ChallengeCard key={c.id} c={c} />)
        )}
      </div>
    </div>
  );
}

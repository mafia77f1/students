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
import { Swords, Plus, Calendar, Trophy, CheckCircle, XCircle, Target, Flame, Clock, Zap, BarChart3, Lock } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const subjects = ["الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "اللغة العربية", "اللغة الإنجليزية", "الإسلامية", "الاجتماعيات"];

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
  const navigate = useNavigate();
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
  const [detailsOpen, setDetailsOpen] = useState<Challenge | null>(null);
  const [detailsUsers, setDetailsUsers] = useState<{ challenger: any; challenged: any } | null>(null);

  const isTeacher = profile?.role === "teacher";

  const openDetails = async (c: Challenge) => {
    setDetailsOpen(c);
    setDetailsUsers(null);
    const { data } = await supabase
      .from("profiles")
      .select("id, name, avatar_url, total_hours, total_xp, level, role, country, grade")
      .in("id", [c.challenger_id, c.challenged_id]);
    if (data) {
      const challenger = data.find((u: any) => u.id === c.challenger_id);
      const challenged = data.find((u: any) => u.id === c.challenged_id);
      setDetailsUsers({ challenger, challenged });
    }
  };

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
    // students-only challenges
    const { data } = await supabase
      .from("profiles").select("id, name")
      .neq("id", profile?.id || "")
      .eq("role", "student")
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
    if (durationType === "custom" && customDays) days = parseInt(customDays);
    else if (durationType === "date" && endDate) {
      const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      days = Math.max(1, diff);
      end = endDate;
    }

    const { error } = await supabase.from("challenges").insert({
      challenger_id: profile.id, challenged_id: selectedUser, subject: selectedSubject,
      duration_minutes: 25, duration_days: days, title: title.trim(), end_date: end,
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

  const statusStyle = (s: string) => {
    switch (s) {
      case "pending": return { bar: "bg-amber-400", badge: "bg-amber-500/15 text-amber-600 border-amber-500/30", label: "في الانتظار" };
      case "active": return { bar: "gradient-primary", badge: "bg-primary/15 text-primary border-primary/30", label: "جاري" };
      case "completed": return { bar: "bg-emerald-500", badge: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", label: "منتهي" };
      default: return { bar: "bg-muted", badge: "bg-muted text-muted-foreground", label: "مرفوض" };
    }
  };

  const pendingReceived = challenges.filter(c => c.status === "pending" && c.challenged_id === profile?.id);
  const activeChallenges = challenges.filter(c => c.status === "active");
  const pastChallenges = challenges.filter(c => c.status === "completed" || c.status === "declined");

  const ChallengeCard = ({ c, showActions }: { c: Challenge; showActions?: boolean }) => {
    const st = statusStyle(c.status);
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card
          onClick={() => openDetails(c)}
          className={`glass border-0 overflow-hidden card-hover cursor-pointer ${c.status === "active" ? "glow-soft" : ""}`}
        >
          <div className={`h-1.5 ${st.bar}`} />
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1 min-w-0 flex-1">
                <h3 className="font-black text-sm truncate">{c.title || c.subject}</h3>
                <p className="text-[11px] text-muted-foreground">{c.subject}</p>
              </div>
              <Badge variant="outline" className={`text-[10px] shrink-0 ${st.badge}`}>{st.label}</Badge>
            </div>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {formatDuration(c)}</span>
              {c.end_date && <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {new Date(c.end_date).toLocaleDateString("ar")}</span>}
            </div>

            {c.status === "active" && (
              <div className="rounded-xl gradient-primary text-white p-3 text-center shadow-md">
                <p className="text-2xl font-black">{c.challenger_id === profile?.id ? c.challenger_xp : c.challenged_xp} <span className="text-sm opacity-80">XP</span></p>
                <p className="text-[10px] opacity-90">نقاطك في التحدي</p>
              </div>
            )}

            {showActions && (
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" className="flex-1 gradient-primary text-primary-foreground gap-1 rounded-xl glow-soft" onClick={() => acceptChallenge(c.id)}>
                  <CheckCircle className="h-4 w-4" /> قبول
                </Button>
                <Button size="sm" variant="outline" className="flex-1 gap-1 rounded-xl" onClick={() => declineChallenge(c.id)}>
                  <XCircle className="h-4 w-4" /> رفض
                </Button>
              </div>
            )}

            {c.status === "completed" && c.winner_id === profile?.id && (
              <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                <Trophy className="h-3.5 w-3.5" /> فزت بهذا التحدي! 🎉
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (isTeacher) {
    return (
      <div className="max-w-lg mx-auto pt-12">
        <Card className="glass border-0 text-center">
          <CardContent className="py-12 space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl gradient-primary flex items-center justify-center glow-soft">
              <Lock className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-lg font-black">التحديات للطلاب</h2>
            <p className="text-sm text-muted-foreground">
              صفحة التحديات مخصصة للطلاب فقط لتشجيع المنافسة الدراسية. كأستاذ، يمكنك متابعة طلابك من صفحة الحساب.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto pb-4">
      {/* Hero header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-5 gradient-mesh text-white shadow-xl"
      >
        <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] bg-white/15 backdrop-blur px-2 py-1 rounded-full mb-2">
              <Flame className="h-3 w-3" /> تحدَّ أصدقاءك
            </div>
            <h1 className="text-2xl font-black flex items-center gap-2"><Swords className="h-6 w-6" /> التحديات</h1>
            <p className="text-xs opacity-90 mt-1">{activeChallenges.length} جاري • {pendingReceived.length} بانتظارك</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-white/20 backdrop-blur hover:bg-white/30 text-white border-0 gap-1 rounded-xl">
                <Plus className="h-4 w-4" /> جديد
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>إنشاء تحدي جديد ⚔️</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>عنوان التحدي</Label>
                  <Input placeholder="إكمال جميع المناهج للامتحانات" value={title} onChange={(e) => setTitle(e.target.value)} />
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
                <Button className="w-full gradient-primary text-primary-foreground rounded-xl glow-soft" onClick={createChallenge}
                  disabled={!selectedUser || !selectedSubject || !title.trim()}>
                  أرسل التحدي ⚔️
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {pendingReceived.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-black flex items-center gap-1 text-amber-500">⏳ بانتظارك</h2>
          {pendingReceived.map(c => <ChallengeCard key={c.id} c={c} showActions />)}
        </div>
      )}

      {activeChallenges.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-black flex items-center gap-1 text-primary">🔥 جارية</h2>
          {activeChallenges.map(c => <ChallengeCard key={c.id} c={c} />)}
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-black text-muted-foreground">📋 السجل</h2>
        {pastChallenges.length === 0 ? (
          <Card className="glass border-0">
            <CardContent className="py-8 text-center text-muted-foreground text-sm">لا توجد تحديات سابقة</CardContent>
          </Card>
        ) : (
          pastChallenges.map(c => <ChallengeCard key={c.id} c={c} />)
        )}
      </div>

      {/* Details dialog */}
      <Dialog open={!!detailsOpen} onOpenChange={(o) => !o && setDetailsOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">{detailsOpen?.title || detailsOpen?.subject}</DialogTitle>
          </DialogHeader>
          {detailsOpen && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <Badge variant="outline" className={statusStyle(detailsOpen.status).badge}>
                  {statusStyle(detailsOpen.status).label}
                </Badge>
                <span className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {formatDuration(detailsOpen)}
                </span>
              </div>

              {!detailsUsers ? (
                <p className="text-center text-sm text-muted-foreground py-4">جاري التحميل...</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { u: detailsUsers.challenger, xp: detailsOpen.challenger_xp, label: "المُتحدي" },
                    { u: detailsUsers.challenged, xp: detailsOpen.challenged_xp, label: "المُتحدى" },
                  ].map((side, i) => {
                    const isWinner = detailsOpen.winner_id === side.u?.id;
                    return (
                      <div key={i} className={`glass rounded-2xl p-3 text-center space-y-2 ${isWinner ? "ring-2 ring-amber-400" : ""}`}>
                        <div className="relative inline-block">
                          {side.u?.avatar_url ? (
                            <img src={side.u.avatar_url} alt="" className="w-14 h-14 rounded-2xl object-cover mx-auto ring-2 ring-primary/30" />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl mx-auto gradient-primary flex items-center justify-center text-white font-black text-lg">
                              {side.u?.name?.[0] || "؟"}
                            </div>
                          )}
                          {isWinner && <Trophy className="h-4 w-4 text-amber-500 absolute -top-1 -right-1" />}
                        </div>
                        <div>
                          <p className="font-black text-sm truncate">{side.u?.name}</p>
                          <p className="text-[10px] text-muted-foreground">{side.label}</p>
                        </div>
                        <button
                          onClick={() => { setDetailsOpen(null); navigate(`/user/${side.u.id}`); }}
                          className="text-[10px] text-primary font-bold hover:underline"
                        >
                          عرض الملف ←
                        </button>
                        <div className="grid grid-cols-3 gap-1 pt-1 border-t border-border/40">
                          <div>
                            <Clock className="h-3 w-3 mx-auto text-muted-foreground mb-0.5" />
                            <p className="text-[10px] font-black">{Number(side.u?.total_hours || 0).toFixed(0)}</p>
                            <p className="text-[8px] text-muted-foreground">ساعة</p>
                          </div>
                          <div>
                            <Zap className="h-3 w-3 mx-auto text-muted-foreground mb-0.5" />
                            <p className="text-[10px] font-black">{side.u?.total_xp || 0}</p>
                            <p className="text-[8px] text-muted-foreground">XP</p>
                          </div>
                          <div>
                            <BarChart3 className="h-3 w-3 mx-auto text-muted-foreground mb-0.5" />
                            <p className="text-[10px] font-black">{side.u?.level || 1}</p>
                            <p className="text-[8px] text-muted-foreground">المستوى</p>
                          </div>
                        </div>
                        <div className="rounded-lg gradient-primary text-white py-1.5">
                          <p className="text-base font-black">{side.xp || 0} <span className="text-[10px] opacity-80">XP</span></p>
                          <p className="text-[9px] opacity-90">في هذا التحدي</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

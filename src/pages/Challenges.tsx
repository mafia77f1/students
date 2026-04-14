import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Swords, Plus, Clock, Trophy, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

const subjects = ["الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "اللغة العربية", "اللغة الإنجليزية", "الحاسوب", "البرمجة", "الطب", "الهندسة", "أخرى"];

interface Challenge {
  id: string;
  challenger_id: string;
  challenged_id: string;
  subject: string;
  duration_minutes: number;
  status: string;
  challenger_xp: number;
  challenged_xp: number;
  winner_id: string | null;
  created_at: string;
}

interface UserOption {
  id: string;
  name: string;
}

export default function Challenges() {
  const { profile } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [duration, setDuration] = useState(25);
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
      .from("profiles")
      .select("id, name")
      .neq("id", profile?.id || "")
      .eq("role", "student")
      .ilike("name", `%${query}%`)
      .limit(10);
    setUsers((data as UserOption[]) || []);
  };

  useEffect(() => { fetchChallenges(); }, [profile]);

  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel("challenges-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "challenges" }, fetchChallenges)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const createChallenge = async () => {
    if (!profile || !selectedUser || !selectedSubject) return;
    const { error } = await supabase.from("challenges").insert({
      challenger_id: profile.id,
      challenged_id: selectedUser,
      subject: selectedSubject,
      duration_minutes: duration,
    });
    if (error) toast.error("حصل خطأ");
    else {
      toast.success("تم إرسال التحدي! ⚔️");
      setDialogOpen(false);
      fetchChallenges();
    }
  };

  const acceptChallenge = async (id: string) => {
    await supabase.from("challenges").update({ status: "active", started_at: new Date().toISOString() }).eq("id", id);
    toast.success("تم قبول التحدي! 💪");
    fetchChallenges();
  };

  const declineChallenge = async (id: string) => {
    await supabase.from("challenges").update({ status: "declined" }).eq("id", id);
    fetchChallenges();
  };

  const getStatusBadge = (c: Challenge) => {
    switch (c.status) {
      case "pending": return <Badge className="bg-secondary/20 text-secondary">في الانتظار</Badge>;
      case "active": return <Badge className="bg-primary/20 text-primary">جاري</Badge>;
      case "completed": return <Badge className="bg-green-500/20 text-green-500">منتهي</Badge>;
      case "declined": return <Badge variant="outline" className="text-muted-foreground">مرفوض</Badge>;
      default: return null;
    }
  };

  const pendingReceived = challenges.filter(c => c.status === "pending" && c.challenged_id === profile?.id);
  const activeChallenges = challenges.filter(c => c.status === "active");
  const pastChallenges = challenges.filter(c => c.status === "completed" || c.status === "declined");

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Swords className="h-6 w-6 text-primary" /> التحديات
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground gap-2"><Plus className="h-4 w-4" /> تحدي جديد</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>إنشاء تحدي جديد ⚔️</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
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
                <Label>المدة (دقيقة)</Label>
                <div className="flex gap-2">
                  {[15, 25, 45].map(d => (
                    <Button key={d} variant={duration === d ? "default" : "outline"} size="sm" onClick={() => setDuration(d)}
                      className={duration === d ? "gradient-primary text-primary-foreground" : ""}>{d} دقيقة</Button>
                  ))}
                </div>
              </div>
              <Button className="w-full gradient-primary text-primary-foreground" onClick={createChallenge} disabled={!selectedUser || !selectedSubject}>
                أرسل التحدي ⚔️
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Pending received */}
      {pendingReceived.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-secondary">تحديات بانتظارك</h2>
          {pendingReceived.map(c => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-secondary/30 glow-neon">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold">{c.subject}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {c.duration_minutes} دقيقة</p>
                    </div>
                    {getStatusBadge(c)}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 gradient-primary text-primary-foreground gap-1" onClick={() => acceptChallenge(c.id)}>
                      <CheckCircle className="h-4 w-4" /> قبول
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => declineChallenge(c.id)}>
                      <XCircle className="h-4 w-4" /> رفض
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Active */}
      {activeChallenges.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-primary">تحديات جارية</h2>
          {activeChallenges.map(c => (
            <Card key={c.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold">{c.subject}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> جاري...</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary">{c.challenger_id === profile?.id ? c.challenger_xp : c.challenged_xp} XP</p>
                    <p className="text-xs text-muted-foreground">نقاطك</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Past */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold">السجل</h2>
        {pastChallenges.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">لا توجد تحديات سابقة</p>
        ) : (
          pastChallenges.map(c => (
            <Card key={c.id} className="opacity-80">
              <CardContent className="pt-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{c.subject}</p>
                  <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("ar")}</p>
                </div>
                <div className="flex items-center gap-2">
                  {c.winner_id === profile?.id && <Trophy className="h-4 w-4 text-secondary" />}
                  {getStatusBadge(c)}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Clock, Zap, TrendingUp, Award, LogOut, BookOpen, Settings, Star, Instagram, Youtube, Link as LinkIcon, Save, Crown, AtSign, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { AvatarUpload } from "@/components/AvatarUpload";
import { getRankInfo, ALL_RANKS } from "@/lib/level-utils";
import { useIsPremium } from "@/lib/use-premium";

interface TeacherProfile {
  bio: string;
  specialization: string;
  youtube_url: string;
  instagram_url: string;
  twitter_url: string;
  telegram_url: string;
  website_url: string;
  average_rating: number;
  total_ratings: number;
}

export default function Profile() {
  const { profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const isPremium = useIsPremium();
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bio: "", specialization: "", youtube_url: "", instagram_url: "", twitter_url: "", telegram_url: "", website_url: "" });
  const [editingUser, setEditingUser] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  const isTeacher = profile?.role === "teacher";

  const saveUsername = async () => {
    if (!profile) return;
    const u = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (u.length < 3 || u.length > 20) {
      toast.error("اسم المستخدم بين 3 و 20 حرف (a-z, 0-9, _)");
      return;
    }
    setSavingUsername(true);
    const { error } = await supabase.from("profiles").update({ username: u }).eq("id", profile.id);
    if (error) {
      toast.error(error.code === "23505" ? "اسم المستخدم محجوز" : "تعذر الحفظ");
    } else {
      toast.success("✅ تم حفظ اسم المستخدم");
      setEditingUser(false);
      await refreshProfile();
    }
    setSavingUsername(false);
  };


  useEffect(() => {
    if (!profile || !isTeacher) return;
    supabase.from("teacher_profiles").select("*").eq("user_id", profile.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setTeacherProfile(data as any);
          setForm({
            bio: (data as any).bio || "",
            specialization: (data as any).specialization || "",
            youtube_url: (data as any).youtube_url || "",
            instagram_url: (data as any).instagram_url || "",
            twitter_url: (data as any).twitter_url || "",
            telegram_url: (data as any).telegram_url || "",
            website_url: (data as any).website_url || "",
          });
        }
      });
  }, [profile, isTeacher]);

  const saveTeacherProfile = async () => {
    if (!profile) return;
    const payload = { user_id: profile.id, ...form };
    if (teacherProfile) {
      await supabase.from("teacher_profiles").update(form).eq("user_id", profile.id);
    } else {
      await supabase.from("teacher_profiles").insert(payload);
    }
    toast.success("تم حفظ ملف الأستاذ ✅");
    setEditing(false);
    const { data } = await supabase.from("teacher_profiles").select("*").eq("user_id", profile.id).maybeSingle();
    if (data) setTeacherProfile(data as any);
  };

  if (!profile) return null;

  const rankInfo = getRankInfo(profile.total_xp || 0);
  const username = (profile as any).username as string | null;

  return (
    <div className="space-y-4 max-w-lg mx-auto pb-4">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 gradient-mesh text-white shadow-xl"
      >
        <div className="absolute -top-12 -left-12 w-44 h-44 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -right-10 w-36 h-36 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col items-center text-center">
          <AvatarUpload size="lg" />
          <div className="flex items-center gap-2 mt-3">
            <h1 className="text-xl font-black">{profile.name || (isTeacher ? "أستاذ" : "طالب")}</h1>
            {isPremium && (
              <span className="inline-flex items-center gap-1 text-[10px] font-black bg-white/25 px-2 py-0.5 rounded-full">
                <Crown className="h-3 w-3" /> PRO
              </span>
            )}
          </div>
          {username && <p className="text-xs opacity-90 mt-0.5" dir="ltr">@{username}</p>}
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur text-xs font-bold">
            <span>{rankInfo.emoji}</span> {rankInfo.title} • المستوى {rankInfo.level}
          </div>
          {profile.grade && <p className="text-xs opacity-80 mt-2">{profile.grade} • {profile.country}</p>}
        </div>
      </motion.div>

      {/* Username card */}
      <Card className="glass border-0">
        <CardContent className="pt-4 pb-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold flex items-center gap-2"><AtSign className="h-4 w-4 text-primary" /> اسم المستخدم</span>
            {!editingUser && (
              <Button variant="ghost" size="sm" onClick={() => { setUsernameInput(username || ""); setEditingUser(true); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          {editingUser ? (
            <div className="flex gap-2">
              <Input
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="username"
                dir="ltr"
                maxLength={20}
              />
              <Button size="sm" onClick={saveUsername} disabled={savingUsername}>حفظ</Button>
              <Button size="sm" variant="ghost" onClick={() => setEditingUser(false)}>إلغاء</Button>
            </div>
          ) : (
            <p className="text-sm font-mono text-muted-foreground" dir="ltr">@{username || "غير محدد"}</p>
          )}
        </CardContent>
      </Card>

      {/* Teacher Profile */}
      {isTeacher && (
        <Card className="glass border-0 card-hover">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><Star className="h-4 w-4 text-secondary" /> ملف الأستاذ</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>
                {editing ? "إلغاء" : "تعديل"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {teacherProfile && (
              <div className="flex items-center gap-3 p-3 rounded-2xl gradient-primary text-white shadow-md">
                <Star className="h-8 w-8" />
                <div>
                  <p className="text-2xl font-black">{Number(teacherProfile.average_rating).toFixed(1)}<span className="text-sm opacity-80">/10</span></p>
                  <p className="text-[11px] opacity-90">{teacherProfile.total_ratings} تقييم</p>
                </div>
              </div>
            )}

            {editing ? (
              <div className="space-y-3">
                <div><Label className="text-xs">التخصص</Label><Input value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} placeholder="مثال: رياضيات" /></div>
                <div><Label className="text-xs">نبذة</Label><Textarea value={form.bio} onChange={e => setForm({...form, bio: e.target.value})} placeholder="نبذة عنك..." rows={3} /></div>
                <div><Label className="text-xs">يوتيوب</Label><Input value={form.youtube_url} onChange={e => setForm({...form, youtube_url: e.target.value})} placeholder="رابط القناة" /></div>
                <div><Label className="text-xs">انستغرام</Label><Input value={form.instagram_url} onChange={e => setForm({...form, instagram_url: e.target.value})} placeholder="رابط الحساب" /></div>
                <div><Label className="text-xs">تويتر</Label><Input value={form.twitter_url} onChange={e => setForm({...form, twitter_url: e.target.value})} placeholder="رابط الحساب" /></div>
                <div><Label className="text-xs">تلغرام</Label><Input value={form.telegram_url} onChange={e => setForm({...form, telegram_url: e.target.value})} placeholder="رابط القناة" /></div>
                <div><Label className="text-xs">موقع</Label><Input value={form.website_url} onChange={e => setForm({...form, website_url: e.target.value})} placeholder="رابط الموقع" /></div>
                <Button onClick={saveTeacherProfile} className="w-full gap-2 gradient-primary text-primary-foreground rounded-xl glow-soft"><Save className="h-4 w-4" /> حفظ</Button>
              </div>
            ) : (
              teacherProfile && (
                <div className="space-y-2 text-sm">
                  {teacherProfile.specialization && <p><span className="text-muted-foreground">التخصص:</span> {teacherProfile.specialization}</p>}
                  {teacherProfile.bio && <p className="text-muted-foreground leading-relaxed">{teacherProfile.bio}</p>}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {teacherProfile.youtube_url && <a href={teacherProfile.youtube_url} target="_blank" className="p-2 rounded-xl glass hover:scale-110 transition-transform"><Youtube className="h-4 w-4 text-red-500" /></a>}
                    {teacherProfile.instagram_url && <a href={teacherProfile.instagram_url} target="_blank" className="p-2 rounded-xl glass hover:scale-110 transition-transform"><Instagram className="h-4 w-4 text-pink-500" /></a>}
                    {teacherProfile.website_url && <a href={teacherProfile.website_url} target="_blank" className="p-2 rounded-xl glass hover:scale-110 transition-transform"><LinkIcon className="h-4 w-4 text-primary" /></a>}
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* XP Progress - students */}
      {!isTeacher && (
        <Card className="glass border-0 card-hover">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold flex items-center gap-2"><Zap className="h-4 w-4 text-secondary" /> التقدم</span>
              <span className="text-xs text-muted-foreground">المستوى التالي</span>
            </div>
            <Progress value={xpPercent} className="h-3" />
            <div className="flex justify-between text-xs mt-2">
              <span className="text-muted-foreground">{profile.total_xp} XP</span>
              <span className="font-bold text-primary">{xpToNext} XP</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {(isTeacher ? [
          { label: "المستوى", value: profile.level, icon: Award, color: "from-violet-500 to-fuchsia-500" },
          { label: "إجمالي XP", value: profile.total_xp, icon: Zap, color: "from-cyan-400 to-blue-500" },
        ] : [
          { label: "ساعات الدراسة", value: `${Number(profile.total_hours).toFixed(1)}`, icon: Clock, color: "from-violet-500 to-indigo-500" },
          { label: "نقاط الأسبوع", value: `${profile.weekly_xp}`, icon: TrendingUp, color: "from-cyan-400 to-teal-500" },
          { label: "المستوى", value: profile.level, icon: Award, color: "from-amber-400 to-orange-500" },
          { label: "إجمالي XP", value: profile.total_xp, icon: Zap, color: "from-pink-400 to-rose-500" },
        ]).map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card className="glass border-0 card-hover overflow-hidden">
              <CardContent className="pt-4 pb-4 text-center relative">
                <div className={`w-10 h-10 mx-auto mb-2 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                  <stat.icon className="h-5 w-5 text-white" />
                </div>
                <p className="text-xl font-black">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Rank Path - students */}
      {!isTeacher && (
        <Card className="glass border-0">
          <CardHeader className="pb-2"><CardTitle className="text-sm">مسار الرتب</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-1">
              {allRanks.map((r, i) => {
                const rc = rankConfig[r];
                const achieved = i <= currentRankIdx;
                return (
                  <div key={r} className={`flex flex-col items-center gap-1 flex-1 ${achieved ? "" : "opacity-30"}`}>
                    <span className="text-xl">{rc.icon}</span>
                    <span className="text-[9px] text-center">{rc.label}</span>
                    {i === currentRankIdx && <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subjects */}
      {profile.subjects && profile.subjects.length > 0 && (
        <Card className="glass border-0">
          <CardHeader className="pb-2"><CardTitle className="text-sm">المواد</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.subjects.map((s) => (
                <span key={s} className="text-xs gradient-primary text-white px-3 py-1 rounded-full font-medium shadow-sm">{s}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        {!isTeacher && (
          <Button variant="outline" className="gap-2 rounded-xl glass border-0" onClick={() => navigate("/grades")}>
            <BookOpen className="h-4 w-4" /> الدرجات
          </Button>
        )}
        <Button variant="outline" className="gap-2 rounded-xl glass border-0" onClick={() => navigate("/settings")}>
          <Settings className="h-4 w-4" /> الإعدادات
        </Button>
      </div>

      <Button variant="outline" className="w-full gap-2 text-destructive rounded-xl glass border-0" onClick={signOut}>
        <LogOut className="h-4 w-4" /> تسجيل الخروج
      </Button>
    </div>
  );
}

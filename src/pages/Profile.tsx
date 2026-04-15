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
import { Clock, Zap, TrendingUp, Award, LogOut, BookOpen, Settings, Star, Globe, Instagram, Youtube, Link as LinkIcon, Save } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const rankConfig: Record<string, { label: string; icon: string }> = {
  bronze: { label: "برونزي", icon: "🥉" }, silver: { label: "فضي", icon: "🥈" }, gold: { label: "ذهبي", icon: "🥇" },
  platinum: { label: "بلاتيني", icon: "💎" }, diamond: { label: "ماسي", icon: "💠" }, grandmaster: { label: "غراندماستر", icon: "👑" },
};
const allRanks = ["bronze", "silver", "gold", "platinum", "diamond", "grandmaster"];

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
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [teacherProfile, setTeacherProfile] = useState<TeacherProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bio: "", specialization: "", youtube_url: "", instagram_url: "", twitter_url: "", telegram_url: "", website_url: "" });

  const isTeacher = profile?.role === "teacher";

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

  const rank = rankConfig[profile.rank] || rankConfig.bronze;
  const xpToNext = (profile.level + 1) * 200;
  const xpPercent = Math.min((profile.total_xp / xpToNext) * 100, 100);
  const currentRankIdx = allRanks.indexOf(profile.rank);

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Header Card */}
      <Card className="overflow-hidden">
        <div className="h-16 gradient-primary" />
        <CardContent className="-mt-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-card border-4 border-card mx-auto flex items-center justify-center text-xl font-bold gradient-primary text-primary-foreground glow-primary">
            {profile.name?.[0] || "؟"}
          </div>
          <h1 className="text-lg font-bold mt-2">{profile.name || (isTeacher ? "أستاذ" : "طالب")}</h1>
          <p className="text-sm font-medium mt-0.5">{rank.icon} {rank.label}</p>
          <p className="text-xs text-muted-foreground">
            المستوى {profile.level} • {isTeacher ? "أستاذ" : "طالب"}
          </p>
          {profile.grade && <p className="text-xs text-muted-foreground mt-0.5">{profile.grade} • {profile.country}</p>}
        </CardContent>
      </Card>

      {/* Teacher Profile Section */}
      {isTeacher && (
        <Card>
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
              <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
                <Star className="h-8 w-8 text-secondary" />
                <div>
                  <p className="text-2xl font-bold">{Number(teacherProfile.average_rating).toFixed(1)}/10</p>
                  <p className="text-xs text-muted-foreground">{teacherProfile.total_ratings} تقييم</p>
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
                <Button onClick={saveTeacherProfile} className="w-full gap-2 gradient-primary text-primary-foreground"><Save className="h-4 w-4" /> حفظ</Button>
              </div>
            ) : (
              teacherProfile && (
                <div className="space-y-2 text-sm">
                  {teacherProfile.specialization && <p><span className="text-muted-foreground">التخصص:</span> {teacherProfile.specialization}</p>}
                  {teacherProfile.bio && <p className="text-muted-foreground">{teacherProfile.bio}</p>}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {teacherProfile.youtube_url && <a href={teacherProfile.youtube_url} target="_blank" className="p-2 rounded-lg bg-red-500/10 text-red-500"><Youtube className="h-4 w-4" /></a>}
                    {teacherProfile.instagram_url && <a href={teacherProfile.instagram_url} target="_blank" className="p-2 rounded-lg bg-pink-500/10 text-pink-500"><Instagram className="h-4 w-4" /></a>}
                    {teacherProfile.website_url && <a href={teacherProfile.website_url} target="_blank" className="p-2 rounded-lg bg-blue-500/10 text-blue-500"><LinkIcon className="h-4 w-4" /></a>}
                  </div>
                </div>
              )
            )}
          </CardContent>
        </Card>
      )}

      {/* XP Progress - students */}
      {!isTeacher && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-secondary" />التقدم</CardTitle></CardHeader>
          <CardContent>
            <div className="flex justify-between text-sm mb-2"><span>XP</span><span className="text-primary font-bold">{profile.total_xp} / {xpToNext}</span></div>
            <Progress value={xpPercent} className="h-3" />
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        {(isTeacher ? [
          { label: "المستوى", value: profile.level, icon: Award },
          { label: "إجمالي XP", value: profile.total_xp, icon: Zap },
        ] : [
          { label: "ساعات الدراسة", value: `${Number(profile.total_hours).toFixed(1)}`, icon: Clock },
          { label: "نقاط الأسبوع", value: `${profile.weekly_xp} XP`, icon: TrendingUp },
          { label: "المستوى", value: profile.level, icon: Award },
          { label: "إجمالي XP", value: profile.total_xp, icon: Zap },
        ]).map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <Card>
              <CardContent className="pt-4 text-center">
                <stat.icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Rank Path - students */}
      {!isTeacher && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">مسار الرتب</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-1">
              {allRanks.map((r, i) => {
                const rc = rankConfig[r];
                const achieved = i <= currentRankIdx;
                return (
                  <div key={r} className={`flex flex-col items-center gap-1 flex-1 ${achieved ? "" : "opacity-25"}`}>
                    <span className="text-lg">{rc.icon}</span>
                    <span className="text-[10px] text-center">{rc.label}</span>
                    {i === currentRankIdx && <div className="w-2 h-2 rounded-full bg-primary glow-primary" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subjects */}
      {profile.subjects && profile.subjects.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">المواد</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {profile.subjects.map((s) => (
                <span key={s} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">{s}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        {!isTeacher && (
          <Button variant="outline" className="gap-2" onClick={() => navigate("/grades")}>
            <BookOpen className="h-4 w-4" /> الدرجات
          </Button>
        )}
        <Button variant="outline" className="gap-2" onClick={() => navigate("/settings")}>
          <Settings className="h-4 w-4" /> الإعدادات
        </Button>
      </div>

      <Button variant="outline" className="w-full gap-2 text-destructive" onClick={signOut}>
        <LogOut className="h-4 w-4" /> تسجيل الخروج
      </Button>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { GraduationCap, Star, Save } from "lucide-react";
import { motion } from "framer-motion";

interface TeacherWithProfile {
  user_id: string;
  bio: string;
  specialization: string;
  average_rating: number;
  total_ratings: number;
  youtube_url: string;
  twitter_url: string;
  instagram_url: string;
  telegram_url: string;
  website_url: string;
  profiles: { name: string; country: string; subjects: string[] } | null;
}

export default function TeachersList() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState<TeacherWithProfile[]>([]);
  const [myTeacherProfile, setMyTeacherProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState("");
  const [youtube, setYoutube] = useState("");
  const [twitter, setTwitter] = useState("");
  const [instagram, setInstagram] = useState("");
  const [telegram, setTelegram] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    supabase
      .from("teacher_profiles")
      .select("*, profiles!teacher_profiles_user_id_fkey(name, country, subjects)")
      .order("average_rating", { ascending: false })
      .then(({ data }) => setTeachers((data as any[]) || []));

    if (profile?.role === "teacher") {
      supabase.from("teacher_profiles").select("*").eq("user_id", profile.id).single()
        .then(({ data }) => {
          if (data) {
            setMyTeacherProfile(data);
            setBio((data as any).bio || "");
            setYoutube((data as any).youtube_url || "");
            setTwitter((data as any).twitter_url || "");
            setInstagram((data as any).instagram_url || "");
            setTelegram((data as any).telegram_url || "");
            setWebsite((data as any).website_url || "");
          }
        });
    }
  }, [profile]);

  const saveProfile = async () => {
    if (!profile) return;
    const { error } = await supabase.from("teacher_profiles").update({
      bio, youtube_url: youtube, twitter_url: twitter, instagram_url: instagram, telegram_url: telegram, website_url: website,
    }).eq("user_id", profile.id);
    if (error) toast.error("حصل خطأ");
    else { toast.success("تم حفظ ملفك!"); setEditing(false); }
  };

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <GraduationCap className="h-6 w-6 text-primary" /> الأساتذة
      </h1>

      {profile?.role === "teacher" && (
        <Card className="glow-primary">
          <CardContent className="pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-bold">ملفك كأستاذ</p>
              <Button size="sm" variant="outline" onClick={() => setEditing(!editing)}>{editing ? "إلغاء" : "تعديل"}</Button>
            </div>
            {editing ? (
              <div className="space-y-3">
                <div className="space-y-2"><Label>نبذة</Label><Textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="نبذة عنك..." /></div>
                <div className="space-y-2"><Label>يوتيوب</Label><Input value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="رابط القناة" /></div>
                <div className="space-y-2"><Label>تويتر</Label><Input value={twitter} onChange={e => setTwitter(e.target.value)} placeholder="رابط الحساب" /></div>
                <div className="space-y-2"><Label>انستغرام</Label><Input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="رابط الحساب" /></div>
                <div className="space-y-2"><Label>تلغرام</Label><Input value={telegram} onChange={e => setTelegram(e.target.value)} placeholder="رابط القناة" /></div>
                <div className="space-y-2"><Label>موقع ويب</Label><Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="رابط الموقع" /></div>
                <Button className="w-full gradient-primary text-primary-foreground gap-2" onClick={saveProfile}>
                  <Save className="h-4 w-4" /> حفظ
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{bio || "لم تضف نبذة بعد"}</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {teachers.map((t, i) => (
          <motion.div key={t.user_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="cursor-pointer hover:shadow-md transition" onClick={() => navigate(`/user/${t.user_id}`)}>
              <CardContent className="pt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                  {t.profiles?.name?.[0] || "؟"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{t.profiles?.name || "أستاذ"}</p>
                  <p className="text-xs text-muted-foreground">{t.profiles?.country} • {t.profiles?.subjects?.join(", ")}</p>
                </div>
                <div className="text-left flex items-center gap-1">
                  <Star className="h-4 w-4 text-secondary fill-secondary" />
                  <span className="font-bold text-sm">{(t.average_rating || 0).toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({t.total_ratings})</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {teachers.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">لا يوجد أساتذة مسجلون بعد</p>}
      </div>
    </div>
  );
}

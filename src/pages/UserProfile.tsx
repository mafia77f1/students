import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight, MessageCircle, Star, Clock, Zap, Trophy } from "lucide-react";
import { toast } from "sonner";

const rankConfig: Record<string, { label: string; icon: string }> = {
  bronze: { label: "برونزي", icon: "🥉" }, silver: { label: "فضي", icon: "🥈" }, gold: { label: "ذهبي", icon: "🥇" },
  platinum: { label: "بلاتيني", icon: "💎" }, diamond: { label: "ماسي", icon: "💠" }, grandmaster: { label: "غراندماستر", icon: "👑" },
};

export default function UserProfile() {
  const { id } = useParams();
  const { profile: myProfile } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [myRating, setMyRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");

  useEffect(() => {
    if (!id) return;
    supabase.from("profiles").select("*").eq("id", id).single().then(({ data }) => setUser(data));
    supabase.from("teacher_profiles").select("*").eq("user_id", id).single().then(({ data }) => setTeacherProfile(data));
    if (myProfile) {
      supabase.from("teacher_ratings").select("*").eq("teacher_id", id).eq("student_id", myProfile.id).single()
        .then(({ data }) => { if (data) { setMyRating((data as any).rating); setRatingComment((data as any).comment || ""); } });
    }
  }, [id, myProfile]);

  const sendMessage = () => {
    if (!id) return;
    navigate("/messages");
    // Will open messages page, user can start conversation from there
    // For now, create a first message
    if (myProfile && id !== myProfile.id) {
      supabase.from("direct_messages").insert({ sender_id: myProfile.id, receiver_id: id, text: "مرحباً! 👋" });
      toast.success("تم إرسال رسالة ترحيب!");
    }
  };

  const submitRating = async () => {
    if (!myProfile || !id || myRating === 0) return;
    const { error } = await supabase.from("teacher_ratings").upsert(
      { teacher_id: id, student_id: myProfile.id, rating: myRating, comment: ratingComment },
      { onConflict: "teacher_id,student_id" }
    );
    if (error) toast.error("حصل خطأ");
    else toast.success("تم حفظ التقييم!");
  };

  if (!user) return <div className="text-center py-10 text-muted-foreground">جاري التحميل...</div>;

  const rank = rankConfig[user.rank] || rankConfig.bronze;
  const isTeacher = user.role === "teacher";

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowRight className="h-5 w-5" /></Button>

      <Card className="overflow-hidden">
        <div className="h-20 gradient-primary" />
        <CardContent className="-mt-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-card border-4 border-card mx-auto flex items-center justify-center text-2xl font-bold gradient-primary text-primary-foreground">
            {user.name?.[0] || "؟"}
          </div>
          <h1 className="text-xl font-bold mt-2">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{isTeacher ? "أستاذ" : "طالب"} • {rank.icon} {rank.label}</p>
          <p className="text-xs text-muted-foreground">{user.country} • {user.grade}</p>
        </CardContent>
      </Card>

      {id !== myProfile?.id && (
        <Button className="w-full gradient-primary text-primary-foreground gap-2" onClick={sendMessage}>
          <MessageCircle className="h-4 w-4" /> مراسلة
        </Button>
      )}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "ساعات الدراسة", value: Number(user.total_hours).toFixed(1), icon: Clock },
          { label: "نقاط XP", value: user.total_xp, icon: Zap },
          { label: "المستوى", value: user.level, icon: Trophy },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 text-center">
              <s.icon className="h-5 w-5 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Teacher rating */}
      {isTeacher && teacherProfile && myProfile?.role === "student" && id !== myProfile?.id && (
        <Card>
          <CardContent className="pt-5 space-y-3">
            <div className="text-center">
              <p className="text-sm font-bold mb-1">تقييم الأستاذ</p>
              <p className="text-3xl font-bold text-secondary">{teacherProfile.average_rating?.toFixed(1) || "0"}<span className="text-sm text-muted-foreground">/10</span></p>
              <p className="text-xs text-muted-foreground">{teacherProfile.total_ratings} تقييم</p>
            </div>
            <div className="flex justify-center gap-1">
              {Array.from({ length: 10 }, (_, i) => (
                <button key={i} onClick={() => setMyRating(i + 1)} className="p-0.5">
                  <Star className={`h-5 w-5 ${i < myRating ? "text-secondary fill-secondary" : "text-muted-foreground"}`} />
                </button>
              ))}
            </div>
            <Input placeholder="تعليق (اختياري)..." value={ratingComment} onChange={e => setRatingComment(e.target.value)} />
            <Button className="w-full" size="sm" onClick={submitRating} disabled={myRating === 0}>حفظ التقييم</Button>
          </CardContent>
        </Card>
      )}

      {/* Teacher social links */}
      {isTeacher && teacherProfile && (
        <Card>
          <CardContent className="pt-5 space-y-2">
            <p className="font-bold text-sm mb-2">روابط التواصل</p>
            {teacherProfile.bio && <p className="text-sm text-muted-foreground">{teacherProfile.bio}</p>}
            {[
              { key: "youtube_url", label: "يوتيوب" },
              { key: "twitter_url", label: "تويتر" },
              { key: "instagram_url", label: "انستغرام" },
              { key: "telegram_url", label: "تلغرام" },
              { key: "website_url", label: "موقع ويب" },
            ].map(link => teacherProfile[link.key] ? (
              <a key={link.key} href={teacherProfile[link.key]} target="_blank" rel="noopener noreferrer"
                className="block text-sm text-primary hover:underline">{link.label}: {teacherProfile[link.key]}</a>
            ) : null)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

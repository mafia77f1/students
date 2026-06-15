import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight, MessageCircle, Star, Clock, Zap, Trophy, UserPlus, UserCheck, UserMinus, Swords } from "lucide-react";
import { toast } from "sonner";

const rankConfig: Record<string, { label: string; icon: string }> = {
  bronze: { label: "برونزي", icon: "🥉" }, silver: { label: "فضي", icon: "🥈" }, gold: { label: "ذهبي", icon: "🥇" },
  platinum: { label: "بلاتيني", icon: "💎" }, diamond: { label: "ماسي", icon: "💠" }, grandmaster: { label: "غراندماستر", icon: "👑" },
};

type FriendStatus = "none" | "pending_sent" | "pending_received" | "accepted";

export default function UserProfile() {
  const { id } = useParams();
  const { profile: myProfile } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [teacherProfile, setTeacherProfile] = useState<any>(null);
  const [myRating, setMyRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [friendStatus, setFriendStatus] = useState<FriendStatus>("none");
  const [friendshipId, setFriendshipId] = useState<string | null>(null);

  const refreshFriendship = useCallback(async () => {
    if (!id || !myProfile || id === myProfile.id) return;
    const { data } = await supabase.from("friendships").select("*")
      .or(`and(requester_id.eq.${myProfile.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${myProfile.id})`)
      .maybeSingle();
    if (!data) { setFriendStatus("none"); setFriendshipId(null); return; }
    setFriendshipId((data as any).id);
    if ((data as any).status === "accepted") setFriendStatus("accepted");
    else if ((data as any).status === "pending") {
      setFriendStatus((data as any).requester_id === myProfile.id ? "pending_sent" : "pending_received");
    } else setFriendStatus("none");
  }, [id, myProfile]);

  useEffect(() => {
    if (!id) return;
    supabase.from("profiles").select("*").eq("id", id).single().then(({ data }) => setUser(data));
    supabase.from("teacher_profiles").select("*").eq("user_id", id).maybeSingle().then(({ data }) => setTeacherProfile(data));
    if (myProfile) {
      supabase.from("teacher_ratings").select("*").eq("teacher_id", id).eq("student_id", myProfile.id).maybeSingle()
        .then(({ data }) => { if (data) { setMyRating((data as any).rating); setRatingComment((data as any).comment || ""); } });
    }
    refreshFriendship();
  }, [id, myProfile, refreshFriendship]);

  const sendRequest = async () => {
    if (!myProfile || !id) return;
    const { error } = await supabase.from("friendships").insert({
      requester_id: myProfile.id, addressee_id: id, status: "pending",
    });
    if (error) toast.error("تعذر إرسال الطلب");
    else { toast.success("تم إرسال طلب الصداقة ✓"); refreshFriendship(); }
  };

  const acceptRequest = async () => {
    if (!friendshipId) return;
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
    toast.success("تمت إضافة الصديق ✓");
    refreshFriendship();
  };

  const removeFriendship = async () => {
    if (!friendshipId) return;
    await supabase.from("friendships").delete().eq("id", friendshipId);
    toast.success("تم الإلغاء");
    refreshFriendship();
  };

  const openChat = () => {
    if (friendStatus !== "accepted") {
      toast.error("يجب قبول طلب الصداقة أولاً");
      return;
    }
    navigate(`/messages/${id}`);
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
  const isMe = id === myProfile?.id;

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowRight className="h-5 w-5" /></Button>

      <Card className="overflow-hidden">
        <div className="h-20 gradient-primary" />
        <CardContent className="-mt-10 text-center">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-16 h-16 rounded-2xl object-cover mx-auto border-4 border-card" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-card border-4 border-card mx-auto flex items-center justify-center text-2xl font-bold gradient-primary text-primary-foreground">
              {user.name?.[0] || "؟"}
            </div>
          )}
          <h1 className="text-xl font-bold mt-2">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{isTeacher ? "أستاذ" : "طالب"} • {rank.icon} {rank.label}</p>
          <p className="text-xs text-muted-foreground">{user.country} • {user.grade}</p>
        </CardContent>
      </Card>

      {!isMe && (
        <div className="space-y-2">
          {/* Friend request */}
          {friendStatus === "none" && (
            <Button className="w-full gradient-primary text-white gap-2" onClick={sendRequest}>
              <UserPlus className="h-4 w-4" /> إرسال طلب صداقة
            </Button>
          )}
          {friendStatus === "pending_sent" && (
            <Button className="w-full" variant="outline" onClick={removeFriendship}>
              <Clock className="h-4 w-4 ml-1" /> تم إرسال الطلب — إلغاء
            </Button>
          )}
          {friendStatus === "pending_received" && (
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={acceptRequest} className="gradient-primary text-white gap-1"><UserCheck className="h-4 w-4" /> قبول الصداقة</Button>
              <Button variant="outline" onClick={removeFriendship} className="gap-1"><UserMinus className="h-4 w-4" /> رفض</Button>
            </div>
          )}
          {friendStatus === "accepted" && (
            <Button variant="outline" className="w-full gap-2" onClick={removeFriendship}>
              <UserCheck className="h-4 w-4" /> أصدقاء — إزالة
            </Button>
          )}

          {/* Message + Challenge */}
          <div className="grid grid-cols-2 gap-2">
            <Button className="gradient-primary text-white gap-2" onClick={openChat}
              disabled={friendStatus !== "accepted"}>
              <MessageCircle className="h-4 w-4" /> مراسلة
            </Button>
            {!isTeacher && myProfile?.role === "student" && (
              <Button variant="outline" className="gap-2"
                onClick={() => navigate(`/challenges?to=${id}&name=${encodeURIComponent(user.name || "")}`)}>
                <Swords className="h-4 w-4" /> طلب تحدي
              </Button>
            )}
          </div>
        </div>
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

      {isTeacher && teacherProfile && myProfile?.role === "student" && !isMe && (
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

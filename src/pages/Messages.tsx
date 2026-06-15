import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { MessageCircle, Send, ArrowRight, UserPlus, Check, X, Clock } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

interface Conversation {
  user_id: string;
  name: string;
  avatar_url?: string;
  last_message: string;
  last_time: string;
  unread: number;
}

interface DM {
  id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  is_read: boolean;
  created_at: string;
}

interface FriendRow {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
}

export default function Messages() {
  const { profile } = useAuth();
  const { userId } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friends, setFriends] = useState<Set<string>>(new Set());
  const [requests, setRequests] = useState<{ row: FriendRow; name: string; avatar?: string }[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(userId ?? null);
  const [selectedProfile, setSelectedProfile] = useState<{ id: string; name: string; avatar_url?: string } | null>(null);
  const [messages, setMessages] = useState<DM[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [tab, setTab] = useState<"chats" | "requests">("chats");
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setSelectedUser(userId ?? null); }, [userId]);

  const fetchFriendsAndRequests = async () => {
    if (!profile) return;
    const { data: fs } = await supabase.from("friendships").select("*")
      .or(`requester_id.eq.${profile.id},addressee_id.eq.${profile.id}`);
    const rows = (fs as FriendRow[]) || [];
    const accepted = new Set<string>();
    const pendingIncoming: FriendRow[] = [];
    rows.forEach(r => {
      if (r.status === "accepted") {
        accepted.add(r.requester_id === profile.id ? r.addressee_id : r.requester_id);
      } else if (r.status === "pending" && r.addressee_id === profile.id) {
        pendingIncoming.push(r);
      }
    });
    setFriends(accepted);

    if (pendingIncoming.length) {
      const { data: profs } = await supabase.from("profiles")
        .select("id, name, avatar_url").in("id", pendingIncoming.map(r => r.requester_id));
      const map: Record<string, any> = {};
      ((profs as any[]) || []).forEach(p => { map[p.id] = p; });
      setRequests(pendingIncoming.map(r => ({
        row: r,
        name: map[r.requester_id]?.name || "مستخدم",
        avatar: map[r.requester_id]?.avatar_url,
      })));
    } else {
      setRequests([]);
    }
  };

  const fetchConversations = async () => {
    if (!profile) return;
    const { data: sent } = await supabase.from("direct_messages").select("*").eq("sender_id", profile.id);
    const { data: received } = await supabase.from("direct_messages").select("*").eq("receiver_id", profile.id);
    const allMsgs = [...(sent || []), ...(received || [])] as DM[];

    const userIds = new Set<string>();
    allMsgs.forEach(m => {
      if (m.sender_id !== profile.id) userIds.add(m.sender_id);
      if (m.receiver_id !== profile.id) userIds.add(m.receiver_id);
    });
    if (userIds.size === 0) { setConversations([]); return; }

    const { data: profiles } = await supabase.from("profiles").select("id, name, avatar_url").in("id", Array.from(userIds));
    const pmap: Record<string, any> = {};
    profiles?.forEach((p: any) => { pmap[p.id] = p; });

    const convos: Conversation[] = Array.from(userIds).map(uid => {
      const userMsgs = allMsgs.filter(m => m.sender_id === uid || m.receiver_id === uid)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const unread = userMsgs.filter(m => m.sender_id === uid && !m.is_read).length;
      return {
        user_id: uid,
        name: pmap[uid]?.name || "مستخدم",
        avatar_url: pmap[uid]?.avatar_url,
        last_message: userMsgs[0]?.text || "",
        last_time: userMsgs[0]?.created_at || "",
        unread,
      };
    }).sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime());
    setConversations(convos);
  };

  const fetchMessages = async (other: string) => {
    if (!profile) return;
    const { data } = await supabase.from("direct_messages").select("*")
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${other}),and(sender_id.eq.${other},receiver_id.eq.${profile.id})`)
      .order("created_at", { ascending: true });
    setMessages((data as DM[]) || []);
    await supabase.from("direct_messages").update({ is_read: true }).eq("sender_id", other).eq("receiver_id", profile.id);
  };

  useEffect(() => { fetchFriendsAndRequests(); fetchConversations(); }, [profile]);

  useEffect(() => {
    if (!selectedUser) { setSelectedProfile(null); return; }
    supabase.from("profiles").select("id, name, avatar_url").eq("id", selectedUser).maybeSingle()
      .then(({ data }) => setSelectedProfile(data as any));
    fetchMessages(selectedUser);
  }, [selectedUser, profile]);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  useEffect(() => {
    if (!profile) return;
    const ch = supabase.channel("dm-fs-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "direct_messages" }, () => {
        if (selectedUser) fetchMessages(selectedUser);
        fetchConversations();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, fetchFriendsAndRequests)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile, selectedUser]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !profile || !selectedUser) return;
    if (!friends.has(selectedUser)) {
      toast.error("لا يمكنك المراسلة قبل قبول طلب الصداقة");
      return;
    }
    const text = newMsg.trim();
    setNewMsg("");
    const { error } = await supabase.from("direct_messages").insert({
      sender_id: profile.id, receiver_id: selectedUser, text,
    });
    if (error) toast.error("تعذر الإرسال");
  };

  const respond = async (id: string, status: "accepted" | "declined") => {
    await supabase.from("friendships").update({ status }).eq("id", id);
    toast.success(status === "accepted" ? "تمت إضافة الصديق ✓" : "تم رفض الطلب");
    fetchFriendsAndRequests();
  };

  // === Conversation view ===
  if (selectedUser) {
    const isFriend = friends.has(selectedUser);
    return (
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-9rem)]">
        <div className="flex items-center gap-3 mb-3 pb-3 border-b">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(null); navigate("/messages"); }}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          {selectedProfile?.avatar_url ? (
            <img src={selectedProfile.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-black">
              {selectedProfile?.name?.[0] || "؟"}
            </div>
          )}
          <button onClick={() => navigate(`/user/${selectedUser}`)} className="font-bold text-sm">
            {selectedProfile?.name || "مستخدم"}
          </button>
        </div>

        <div ref={chatRef} className="flex-1 overflow-y-auto space-y-2 mb-3 px-1">
          {messages.length === 0 ? (
            <div className="text-center text-xs text-muted-foreground py-10">
              {isFriend ? "ابدأ المحادثة 👋" : "أرسل طلب صداقة لبدء المحادثة"}
            </div>
          ) : messages.map(m => (
            <div key={m.id} className={`flex ${m.sender_id === profile?.id ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                m.sender_id === profile?.id ? "gradient-primary text-white" : "bg-muted"
              }`}>{m.text}</div>
            </div>
          ))}
        </div>

        {isFriend ? (
          <div className="flex gap-2">
            <Input placeholder="اكتب رسالة..." value={newMsg} onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()} />
            <Button size="icon" onClick={sendMessage} className="gradient-primary text-white shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center text-xs text-muted-foreground rounded-xl bg-muted/50 p-3">
            🔒 يجب قبول طلب الصداقة أولاً لبدء المراسلة
          </div>
        )}
      </div>
    );
  }

  // === List view ===
  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <MessageCircle className="h-6 w-6 text-primary" /> الرسائل
      </h1>

      <div className="inline-flex p-1 bg-muted rounded-2xl">
        <button onClick={() => setTab("chats")}
          className={`px-4 py-2 rounded-xl text-xs font-bold ${tab === "chats" ? "gradient-primary text-white" : "text-muted-foreground"}`}>
          المحادثات
        </button>
        <button onClick={() => setTab("requests")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 ${tab === "requests" ? "gradient-primary text-white" : "text-muted-foreground"}`}>
          <UserPlus className="h-3.5 w-3.5" /> طلبات الصداقة
          {requests.length > 0 && <span className="bg-white/30 px-1.5 rounded-full text-[10px]">{requests.length}</span>}
        </button>
      </div>

      {tab === "requests" ? (
        requests.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">لا توجد طلبات صداقة جديدة</p>
          </div>
        ) : requests.map(r => (
          <Card key={r.row.id}>
            <CardContent className="pt-4 flex items-center gap-3">
              {r.avatar ? (
                <img src={r.avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold">{r.name[0]}</div>
              )}
              <p className="flex-1 font-bold text-sm">{r.name}</p>
              <Button size="sm" onClick={() => respond(r.row.id, "accepted")} className="gradient-primary text-white gap-1">
                <Check className="h-3.5 w-3.5" /> قبول
              </Button>
              <Button size="sm" variant="outline" onClick={() => respond(r.row.id, "declined")}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))
      ) : conversations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد رسائل بعد</p>
          <p className="text-xs mt-1">ادخل ملف شخص من الصدارة وأضفه صديق لبدء المحادثة</p>
        </div>
      ) : (
        conversations.map(c => (
          <Card key={c.user_id} className="cursor-pointer hover:shadow-md transition"
            onClick={() => { setSelectedUser(c.user_id); navigate(`/messages/${c.user_id}`); }}>
            <CardContent className="pt-4 flex items-center gap-3">
              {c.avatar_url ? (
                <img src={c.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white font-bold">{c.name[0]}</div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.last_time ? new Date(c.last_time).toLocaleDateString("ar") : ""}</p>
                </div>
                <p className="text-xs text-muted-foreground truncate">{c.last_message}</p>
              </div>
              {c.unread > 0 && (
                <span className="w-5 h-5 rounded-full gradient-primary text-white text-xs flex items-center justify-center">{c.unread}</span>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

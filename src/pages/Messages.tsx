import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { MessageCircle, Send, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Conversation {
  user_id: string;
  name: string;
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

export default function Messages() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState("");
  const [messages, setMessages] = useState<DM[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

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

    const { data: profiles } = await supabase.from("profiles").select("id, name").in("id", Array.from(userIds));
    const profileMap: Record<string, string> = {};
    profiles?.forEach((p: any) => { profileMap[p.id] = p.name; });

    const convos: Conversation[] = Array.from(userIds).map(uid => {
      const userMsgs = allMsgs.filter(m => m.sender_id === uid || m.receiver_id === uid).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const unread = userMsgs.filter(m => m.sender_id === uid && !m.is_read).length;
      return {
        user_id: uid,
        name: profileMap[uid] || "مستخدم",
        last_message: userMsgs[0]?.text || "",
        last_time: userMsgs[0]?.created_at || "",
        unread,
      };
    }).sort((a, b) => new Date(b.last_time).getTime() - new Date(a.last_time).getTime());

    setConversations(convos);
  };

  const fetchMessages = async (userId: string) => {
    if (!profile) return;
    const { data } = await supabase
      .from("direct_messages")
      .select("*")
      .or(`and(sender_id.eq.${profile.id},receiver_id.eq.${userId}),and(sender_id.eq.${userId},receiver_id.eq.${profile.id})`)
      .order("created_at", { ascending: true });
    setMessages((data as DM[]) || []);
    // Mark as read
    await supabase.from("direct_messages").update({ is_read: true }).eq("sender_id", userId).eq("receiver_id", profile.id);
  };

  useEffect(() => { fetchConversations(); }, [profile]);

  useEffect(() => {
    if (selectedUser) fetchMessages(selectedUser);
  }, [selectedUser]);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel("dm-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "direct_messages" }, () => {
        if (selectedUser) fetchMessages(selectedUser);
        fetchConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile, selectedUser]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !profile || !selectedUser) return;
    await supabase.from("direct_messages").insert({ sender_id: profile.id, receiver_id: selectedUser, text: newMsg });
    setNewMsg("");
  };

  if (selectedUser) {
    return (
      <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)}><ArrowRight className="h-5 w-5" /></Button>
          <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">{selectedName[0]}</div>
          <h2 className="font-bold">{selectedName}</h2>
        </div>
        <div ref={chatRef} className="flex-1 overflow-y-auto space-y-3 mb-3">
          {messages.map(m => (
            <div key={m.id} className={`flex ${m.sender_id === profile?.id ? "justify-start" : "justify-end"}`}>
              <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${m.sender_id === profile?.id ? "gradient-primary text-primary-foreground" : "bg-muted"}`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="اكتب رسالة..." value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} />
          <Button size="icon" onClick={sendMessage} className="gradient-primary text-primary-foreground shrink-0"><Send className="h-4 w-4" /></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <MessageCircle className="h-6 w-6 text-primary" /> الرسائل
      </h1>
      {conversations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد رسائل بعد</p>
          <p className="text-sm mt-1">ادخل على ملف شخص من لوحة الصدارة وراسله!</p>
        </div>
      ) : (
        conversations.map(c => (
          <Card key={c.user_id} className="cursor-pointer hover:shadow-md transition" onClick={() => { setSelectedUser(c.user_id); setSelectedName(c.name); }}>
            <CardContent className="pt-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">{c.name[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.last_time ? new Date(c.last_time).toLocaleDateString("ar") : ""}</p>
                </div>
                <p className="text-xs text-muted-foreground truncate">{c.last_message}</p>
              </div>
              {c.unread > 0 && (
                <span className="w-5 h-5 rounded-full gradient-primary text-primary-foreground text-xs flex items-center justify-center">{c.unread}</span>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

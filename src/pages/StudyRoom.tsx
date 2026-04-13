import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Users, ArrowRight, LogOut } from "lucide-react";
import { toast } from "sonner";

interface Message {
  id: string;
  text: string;
  created_at: string;
  profiles: { name: string } | null;
}

interface Participant {
  id: string;
  status: string;
  profiles: { name: string } | null;
}

export default function StudyRoom() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !profile) return;

    // Fetch room
    supabase.from("study_rooms").select("*").eq("id", id).single().then(({ data }) => setRoom(data));

    // Join room
    supabase.from("room_participants").upsert({ room_id: id, user_id: profile.id, status: "studying" }, { onConflict: "room_id,user_id" });

    // Fetch messages
    supabase
      .from("room_messages")
      .select("*, profiles!room_messages_user_id_fkey(name)")
      .eq("room_id", id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages((data as any[]) || []));

    // Fetch participants
    const fetchParticipants = () => {
      supabase
        .from("room_participants")
        .select("*, profiles!room_participants_user_id_fkey(name)")
        .eq("room_id", id)
        .then(({ data }) => setParticipants((data as any[]) || []));
    };
    fetchParticipants();

    // Subscribe to new messages
    const msgChannel = supabase
      .channel(`room-messages-${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "room_messages", filter: `room_id=eq.${id}` },
        async (payload) => {
          const { data } = await supabase
            .from("room_messages")
            .select("*, profiles!room_messages_user_id_fkey(name)")
            .eq("id", payload.new.id)
            .single();
          if (data) setMessages((prev) => [...prev, data as any]);
        }
      )
      .subscribe();

    // Subscribe to participants
    const partChannel = supabase
      .channel(`room-participants-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_participants", filter: `room_id=eq.${id}` }, fetchParticipants)
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(partChannel);
    };
  }, [id, profile]);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  const sendMessage = async () => {
    if (!newMsg.trim() || !profile || !id) return;
    await supabase.from("room_messages").insert({ room_id: id, user_id: profile.id, text: newMsg });
    setNewMsg("");
  };

  const leaveRoom = async () => {
    if (!profile || !id) return;
    await supabase.from("room_participants").delete().eq("room_id", id).eq("user_id", profile.id);
    navigate("/lobby");
  };

  if (!room) return <div className="text-center py-10 text-muted-foreground">جاري التحميل...</div>;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/lobby")}>
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">{room.name}</h1>
            <Badge variant="secondary" className="text-xs">{room.subject}</Badge>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={leaveRoom} className="gap-2 text-destructive">
          <LogOut className="h-4 w-4" />
          مغادرة
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Chat */}
        <Card className="lg:col-span-2 flex flex-col h-[500px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">الدردشة</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            <div ref={chatRef} className="flex-1 overflow-y-auto space-y-3 mb-3">
              {messages.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-8">ابدأ المحادثة...</p>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className="text-sm">
                  <span className="font-medium text-primary">{msg.profiles?.name || "مجهول"}</span>
                  <span className="text-muted-foreground text-xs mx-2">
                    {new Date(msg.created_at).toLocaleTimeString("ar", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <p className="mt-0.5">{msg.text}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="اكتب رسالة..."
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <Button size="icon" onClick={sendMessage} className="gradient-primary text-primary-foreground shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              المتواجدون ({participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {participants.map((p) => (
                <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                    {(p.profiles?.name || "؟")[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{p.profiles?.name || "مجهول"}</p>
                    <p className="text-xs text-primary">🟢 متواجد</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

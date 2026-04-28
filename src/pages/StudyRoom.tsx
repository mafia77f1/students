import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useParams, useNavigate } from "react-router-dom";
import { Send, Users, ArrowRight, LogOut, Play, Pause, RotateCcw, Coffee, BookOpen, Crown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  text: string;
  created_at: string;
  profiles: { name: string } | null;
}

interface Participant {
  id: string;
  user_id: string;
  status: string;
  profiles: { name: string } | null;
}

interface PomodoroState {
  isRunning: boolean;
  isBreak: boolean;
  roundSeconds: number;
  breakSeconds: number;
  round: number;
  // when running: epoch ms when current phase started
  phaseStartedAt: number;
  // when paused: seconds remaining
  pausedRemaining: number;
}

const DEFAULT_ROUND = 25 * 60;
const DEFAULT_BREAK = 2 * 60;

const initial: PomodoroState = {
  isRunning: false,
  isBreak: false,
  roundSeconds: DEFAULT_ROUND,
  breakSeconds: DEFAULT_BREAK,
  round: 1,
  phaseStartedAt: 0,
  pausedRemaining: DEFAULT_ROUND,
};

export default function StudyRoom() {
  const { id } = useParams();
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [room, setRoom] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [pomo, setPomo] = useState<PomodoroState>(initial);
  const [now, setNow] = useState(Date.now());
  const chatRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  const isCreator = room && profile && room.creator_id === profile.id;

  // Tick local clock for synced timer display
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!id || !profile) return;

    supabase.from("study_rooms").select("*").eq("id", id).single().then(({ data }) => setRoom(data));

    supabase.from("room_participants").upsert(
      { room_id: id, user_id: profile.id, status: "studying" },
      { onConflict: "room_id,user_id" }
    );

    supabase
      .from("room_messages")
      .select("*, profiles!room_messages_user_id_fkey(name)")
      .eq("room_id", id)
      .order("created_at", { ascending: true })
      .then(({ data }) => setMessages((data as any[]) || []));

    const fetchParticipants = () => {
      supabase
        .from("room_participants")
        .select("*, profiles!room_participants_user_id_fkey(name)")
        .eq("room_id", id)
        .then(({ data }) => setParticipants((data as any[]) || []));
    };
    fetchParticipants();

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

    const partChannel = supabase
      .channel(`room-participants-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "room_participants", filter: `room_id=eq.${id}` }, fetchParticipants)
      .subscribe();

    // Pomodoro broadcast channel - everyone listens, creator broadcasts
    const pomoCh = supabase
      .channel(`room-pomo-${id}`, { config: { broadcast: { self: true } } })
      .on("broadcast", { event: "state" }, ({ payload }) => {
        setPomo(payload as PomodoroState);
      })
      .on("broadcast", { event: "request_state" }, () => {
        // creator responds with current state
        if (isCreator) {
          pomoCh.send({ type: "broadcast", event: "state", payload: pomo });
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED" && !isCreator) {
          // Ask creator to send current state
          pomoCh.send({ type: "broadcast", event: "request_state", payload: {} });
        }
      });
    channelRef.current = pomoCh;

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(partChannel);
      supabase.removeChannel(pomoCh);
    };
  }, [id, profile, isCreator]);

  // Auto-advance phase locally when timer hits zero (only creator broadcasts)
  useEffect(() => {
    if (!pomo.isRunning || !isCreator) return;
    const phaseTotal = pomo.isBreak ? pomo.breakSeconds : pomo.roundSeconds;
    const elapsed = Math.floor((now - pomo.phaseStartedAt) / 1000);
    if (elapsed >= phaseTotal) {
      const next: PomodoroState = pomo.isBreak
        ? { ...pomo, isBreak: false, round: pomo.round + 1, phaseStartedAt: Date.now(), pausedRemaining: pomo.roundSeconds }
        : { ...pomo, isBreak: true, phaseStartedAt: Date.now(), pausedRemaining: pomo.breakSeconds };
      setPomo(next);
      channelRef.current?.send({ type: "broadcast", event: "state", payload: next });
    }
  }, [now, pomo, isCreator]);

  // Periodic heartbeat: creator re-broadcasts state every 5s so any
  // late/disconnected device automatically re-syncs round + remaining time.
  useEffect(() => {
    if (!isCreator) return;
    const t = setInterval(() => {
      channelRef.current?.send({ type: "broadcast", event: "state", payload: pomo });
    }, 5000);
    return () => clearInterval(t);
  }, [isCreator, pomo]);

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

  const broadcast = (state: PomodoroState) => {
    setPomo(state);
    channelRef.current?.send({ type: "broadcast", event: "state", payload: state });
  };

  const togglePomo = () => {
    if (!isCreator) return;
    if (pomo.isRunning) {
      const phaseTotal = pomo.isBreak ? pomo.breakSeconds : pomo.roundSeconds;
      const elapsed = Math.floor((Date.now() - pomo.phaseStartedAt) / 1000);
      const remaining = Math.max(0, phaseTotal - elapsed);
      broadcast({ ...pomo, isRunning: false, pausedRemaining: remaining });
    } else {
      const phaseTotal = pomo.isBreak ? pomo.breakSeconds : pomo.roundSeconds;
      const elapsedSinceStart = phaseTotal - pomo.pausedRemaining;
      broadcast({ ...pomo, isRunning: true, phaseStartedAt: Date.now() - elapsedSinceStart * 1000 });
    }
  };

  const resetPomo = () => {
    if (!isCreator) return;
    broadcast({ ...initial });
  };

  // Compute synced display time
  const phaseTotal = pomo.isBreak ? pomo.breakSeconds : pomo.roundSeconds;
  const timeLeft = pomo.isRunning
    ? Math.max(0, phaseTotal - Math.floor((now - pomo.phaseStartedAt) / 1000))
    : pomo.pausedRemaining;
  const progress = ((phaseTotal - timeLeft) / phaseTotal) * 100;
  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

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

      {/* Synced Pomodoro */}
      <AnimatePresence mode="wait">
        <motion.div key={pomo.isBreak ? "break" : "focus"} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className={`overflow-hidden border-0 shadow-xl ${pomo.isBreak ? "bg-gradient-to-br from-secondary/15 to-primary/10" : "gradient-mesh text-white"}`}>
            <CardContent className="py-5 text-center space-y-3">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${pomo.isBreak ? "bg-secondary/20 text-secondary" : "bg-white/20 text-white"}`}>
                {pomo.isBreak ? <><Coffee className="h-3.5 w-3.5" /> استراحة جماعية</> : <><BookOpen className="h-3.5 w-3.5" /> جولة تركيز #{pomo.round}</>}
                <span className="opacity-70">• متزامن</span>
              </div>
              <div className={`text-5xl font-black font-mono ${pomo.isBreak ? "text-secondary" : "text-white drop-shadow"}`}>
                {fmt(timeLeft)}
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden ${pomo.isBreak ? "bg-secondary/20" : "bg-white/20"}`}>
                <motion.div className={`h-full rounded-full ${pomo.isBreak ? "bg-secondary" : "bg-white"}`}
                  animate={{ width: `${progress}%` }} transition={{ ease: "linear", duration: 0.4 }} />
              </div>
              {isCreator ? (
                <div className="flex justify-center gap-2">
                  <Button size="sm" onClick={togglePomo}
                    className={`gap-2 rounded-xl font-bold ${pomo.isBreak ? "" : "bg-white text-primary hover:bg-white/90"}`}>
                    {pomo.isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {pomo.isRunning ? "إيقاف" : "ابدأ للجميع"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={resetPomo}
                    className={pomo.isBreak ? "" : "border-white/40 text-white hover:bg-white/10 hover:text-white"}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <p className={`text-[11px] ${pomo.isBreak ? "text-muted-foreground" : "text-white/80"}`}>
                  المؤقت يديره منشئ الغرفة 👑
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Chat */}
        <Card className="lg:col-span-2 flex flex-col h-[450px]">
          <CardHeader className="pb-2"><CardTitle className="text-base">الدردشة</CardTitle></CardHeader>
          <CardContent className="flex-1 flex flex-col min-h-0">
            <div ref={chatRef} className="flex-1 overflow-y-auto space-y-3 mb-3">
              {messages.length === 0 && <p className="text-center text-muted-foreground text-sm py-8">ابدأ المحادثة...</p>}
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
              <Input placeholder="اكتب رسالة..." value={newMsg} onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
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
              <Users className="h-4 w-4" /> المتواجدون ({participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {participants.map((p) => (
                <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                    {(p.profiles?.name || "؟")[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate flex items-center gap-1">
                      {p.profiles?.name || "مجهول"}
                      {p.user_id === room.creator_id && <Crown className="h-3 w-3 text-primary" />}
                    </p>
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

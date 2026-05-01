import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Search, Plus, Users, BookOpen, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";

const subjects = ["الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "اللغة العربية", "اللغة الإنجليزية", "الإسلامية", "الاجتماعيات"];

interface Room {
  id: string;
  name: string;
  subject: string;
  creator_id: string;
  max_participants: number;
  profiles: { name: string } | null;
  participant_count: number;
}

export default function Lobby() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomSubject, setNewRoomSubject] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchRooms = async () => {
    const { data } = await supabase
      .from("study_rooms")
      .select("*, profiles!study_rooms_creator_id_fkey(name)")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (data) {
      const roomIds = data.map((r: any) => r.id);
      const { data: participants } = await supabase
        .from("room_participants")
        .select("room_id")
        .in("room_id", roomIds);
      const counts: Record<string, number> = {};
      participants?.forEach((p: any) => { counts[p.room_id] = (counts[p.room_id] || 0) + 1; });
      setRooms(data.map((r: any) => ({ ...r, participant_count: counts[r.id] || 0 })));
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  const createRoom = async () => {
    if (!profile || !newRoomName || !newRoomSubject) return;
    const { data, error } = await supabase
      .from("study_rooms")
      .insert({ name: newRoomName, subject: newRoomSubject, creator_id: profile.id })
      .select().single();
    if (error) { toast.error("حصل خطأ"); return; }
    toast.success("تم إنشاء الغرفة!");
    setDialogOpen(false);
    setNewRoomName(""); setNewRoomSubject("");
    if (data) navigate(`/room/${(data as any).id}`);
  };

  const filtered = rooms.filter((r) => {
    const matchFilter = filter === "all" || r.subject === filter;
    const matchSearch = r.name.includes(search) || (r.profiles?.name || "").includes(search);
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-4 max-w-3xl mx-auto pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black gradient-text">غرف الدراسة</h1>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {rooms.length} غرفة نشطة
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-white border-0 gap-1.5 rounded-xl glow-primary h-10 px-4">
              <Plus className="h-4 w-4" /> غرفة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="gradient-text text-xl">إنشاء غرفة دراسة</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <div className="space-y-1.5">
                <Label className="text-xs">اسم الغرفة</Label>
                <Input placeholder="مثال: مراجعة الرياضيات" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">المادة</Label>
                <Select value={newRoomSubject} onValueChange={setNewRoomSubject}>
                  <SelectTrigger><SelectValue placeholder="اختر المادة" /></SelectTrigger>
                  <SelectContent>{subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button className="w-full gradient-primary text-white border-0 rounded-xl h-11" onClick={createRoom} disabled={!newRoomName || !newRoomSubject}>
                إنشاء
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="ابحث عن غرفة..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 h-11 rounded-xl bg-card border-border/60" />
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        <button
          onClick={() => setFilter("all")}
          className={`shrink-0 text-xs px-4 py-2 rounded-full font-bold transition-all ${
            filter === "all"
              ? "gradient-primary text-white glow-primary"
              : "bg-card text-muted-foreground border border-border/60 hover:border-primary/40"
          }`}
        >
          الكل
        </button>
        {subjects.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 text-xs px-4 py-2 rounded-full font-bold transition-all ${
              filter === s
                ? "gradient-primary text-white glow-primary"
                : "bg-card text-muted-foreground border border-border/60 hover:border-primary/40"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Rooms list */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <p className="text-sm font-bold">لا توجد غرف بعد</p>
            <p className="text-xs text-muted-foreground mt-1">كن أول من ينشئ غرفة دراسة!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((room, i) => (
            <motion.div key={room.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card
                className="cursor-pointer hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all overflow-hidden group"
                onClick={() => navigate(`/room/${room.id}`)}
              >
                <CardContent className="p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shrink-0 glow-primary group-hover:scale-110 transition-transform">
                      <BookOpen className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3 className="font-black text-sm truncate">{room.name}</h3>
                        <Badge variant="secondary" className="text-[10px] shrink-0 font-bold">{room.subject}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="truncate">👤 {room.profiles?.name || "مجهول"}</span>
                        <span className="flex items-center gap-1 shrink-0 font-bold text-primary">
                          <Users className="h-3 w-3" />
                          {room.participant_count}/{room.max_participants}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

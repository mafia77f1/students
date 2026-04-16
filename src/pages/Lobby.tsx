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
import { Search, Plus, Users, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";

const subjects = ["الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "اللغة العربية", "اللغة الإنجليزية", "الحاسوب", "البرمجة", "الطب", "الهندسة", "أخرى"];

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
          <h1 className="text-xl font-bold">غرف الدراسة</h1>
          <p className="text-xs text-muted-foreground mt-0.5">{rooms.length} غرفة نشطة</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground gap-1.5">
              <Plus className="h-4 w-4" /> غرفة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>إنشاء غرفة دراسة</DialogTitle></DialogHeader>
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
              <Button className="w-full gradient-primary text-primary-foreground" onClick={createRoom} disabled={!newRoomName || !newRoomSubject}>
                إنشاء
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="ابحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 h-10" />
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        <button
          onClick={() => setFilter("all")}
          className={`shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors ${filter === "all" ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          الكل
        </button>
        {subjects.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors ${filter === s ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Rooms list */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium">لا توجد غرف</p>
            <p className="text-xs mt-1">كن أول من ينشئ غرفة!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((room, i) => (
            <motion.div key={room.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => navigate(`/room/${room.id}`)}>
                <CardContent className="p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                      <BookOpen className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <h3 className="font-bold text-sm truncate">{room.name}</h3>
                        <Badge variant="secondary" className="text-[10px] shrink-0">{room.subject}</Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="truncate">{room.profiles?.name || "مجهول"}</span>
                        <span className="flex items-center gap-1 shrink-0">
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

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
import { Search, Plus, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";

const subjects = ["الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "اللغة العربية", "اللغة الإنجليزية", "الحاسوب", "البرمجة", "الطب", "الهندسة", "أخرى"];

interface Room {
  id: string;
  name: string;
  subject: string;
  creator_id: string;
  is_active: boolean;
  max_participants: number;
  created_at: string;
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
      // Get participant counts
      const roomIds = data.map((r: any) => r.id);
      const { data: participants } = await supabase
        .from("room_participants")
        .select("room_id")
        .in("room_id", roomIds);

      const counts: Record<string, number> = {};
      participants?.forEach((p: any) => {
        counts[p.room_id] = (counts[p.room_id] || 0) + 1;
      });

      setRooms(data.map((r: any) => ({ ...r, participant_count: counts[r.id] || 0 })));
    }
  };

  useEffect(() => { fetchRooms(); }, []);

  const createRoom = async () => {
    if (!profile || !newRoomName || !newRoomSubject) return;
    const { data, error } = await supabase
      .from("study_rooms")
      .insert({ name: newRoomName, subject: newRoomSubject, creator_id: profile.id })
      .select()
      .single();

    if (error) toast.error("حصل خطأ");
    else {
      toast.success("تم إنشاء الغرفة!");
      setDialogOpen(false);
      setNewRoomName("");
      setNewRoomSubject("");
      fetchRooms();
      if (data) navigate(`/room/${(data as any).id}`);
    }
  };

  const filtered = rooms.filter((r) => {
    const matchFilter = filter === "all" || r.subject === filter;
    const matchSearch = r.name.includes(search) || (r.profiles?.name || "").includes(search);
    return matchFilter && matchSearch;
  });

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">غرف الدراسة</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-primary text-primary-foreground gap-2">
              <Plus className="h-4 w-4" />
              إنشاء غرفة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إنشاء غرفة دراسة جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label>اسم الغرفة</Label>
                <Input placeholder="مثال: مراجعة الرياضيات" value={newRoomName} onChange={(e) => setNewRoomName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>المادة</Label>
                <Select value={newRoomSubject} onValueChange={setNewRoomSubject}>
                  <SelectTrigger><SelectValue placeholder="اختر المادة" /></SelectTrigger>
                  <SelectContent>
                    {subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button className="w-full gradient-primary text-primary-foreground" onClick={createRoom} disabled={!newRoomName || !newRoomSubject}>
                إنشاء الغرفة
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="ابحث عن غرفة..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10" />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2">
        <Button variant={filter === "all" ? "default" : "outline"} size="sm" onClick={() => setFilter("all")} className={filter === "all" ? "gradient-primary text-primary-foreground" : ""}>
          الكل
        </Button>
        {subjects.map((s) => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" onClick={() => setFilter(s)} className={filter === s ? "gradient-primary text-primary-foreground" : ""}>
            {s}
          </Button>
        ))}
      </div>

      {/* Rooms */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>لا توجد غرف حالياً</p>
          <p className="text-sm mt-1">كن أول من ينشئ غرفة!</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((room, i) => (
            <motion.div key={room.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/room/${room.id}`)}>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-base">{room.name}</h3>
                    <Badge variant="secondary" className="text-xs">{room.subject}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>بواسطة: {room.profiles?.name || "مجهول"}</span>
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>{room.participant_count}/{room.max_participants}</span>
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

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Plus, Search, Users } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

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

export function StudyRoomsHome() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [search, setSearch] = useState("");
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomSubject, setNewRoomSubject] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchRooms = async () => {
    const { data } = await supabase
      .from("study_rooms")
      .select("*, profiles!study_rooms_creator_id_fkey(name)")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(5);

    if (!data || data.length === 0) {
      setRooms([]);
      return;
    }

    const roomIds = data.map((room: any) => room.id);
    const { data: participants } = await supabase
      .from("room_participants")
      .select("room_id")
      .in("room_id", roomIds);

    const counts: Record<string, number> = {};
    participants?.forEach((p: any) => {
      counts[p.room_id] = (counts[p.room_id] || 0) + 1;
    });

    setRooms(data.map((room: any) => ({ ...room, participant_count: counts[room.id] || 0 })));
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim();
    if (!term) return rooms;
    return rooms.filter((room) => room.name.includes(term) || room.subject.includes(term) || (room.profiles?.name || "").includes(term));
  }, [rooms, search]);

  const createRoom = async () => {
    if (!profile || !newRoomName.trim() || !newRoomSubject) return;

    const { data, error } = await supabase
      .from("study_rooms")
      .insert({ name: newRoomName.trim(), subject: newRoomSubject, creator_id: profile.id })
      .select()
      .single();

    if (error) {
      toast.error("تعذر إنشاء الغرفة الآن");
      return;
    }

    toast.success("تم إنشاء الغرفة");
    setDialogOpen(false);
    setNewRoomName("");
    setNewRoomSubject("");
    if (data) navigate(`/room/${(data as any).id}`);
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-black text-sm flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center shadow-md">
            <Users className="h-4 w-4 text-white" />
          </div>
          غرف الدراسة
        </h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-9 px-3 rounded-xl gradient-primary text-white border-0 gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" /> جديدة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="gradient-text text-xl">إنشاء غرفة دراسة</DialogTitle>
            </DialogHeader>
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
              <Button className="w-full gradient-primary text-white border-0 rounded-xl h-11" onClick={createRoom} disabled={!newRoomName.trim() || !newRoomSubject}>
                إنشاء
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="ابحث عن غرفة..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-9 h-10 rounded-xl bg-card text-sm" />
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-6 text-center text-xs text-muted-foreground">
            لا توجد غرف نشطة الآن
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((room) => (
            <Card key={room.id} className="cursor-pointer border-border/50 hover:border-primary/40 transition-colors" onClick={() => navigate(`/room/${room.id}`)}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-sm">
                    <BookOpen className="h-4 w-4 text-white" />
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
          ))}
        </div>
      )}
    </section>
  );
}

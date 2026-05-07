import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/use-premium";
import { Download, ShoppingCart, Star, Plus, Pencil, Trash2, BookOpen, Search } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { AdBanner } from "@/components/AdBanner";

interface Note {
  id: string;
  subject: string;
  grade: string | null;
  title: string;
  description: string | null;
  author: string | null;
  cover_url: string | null;
  download_url: string | null;
  purchase_url: string | null;
  price: number | null;
  is_free: boolean | null;
  downloads_count: number | null;
  average_rating: number | null;
  total_ratings: number | null;
}

const empty: Partial<Note> = { subject: "", title: "", description: "", author: "", is_free: true, price: 0 };

export default function Notes() {
  const { profile } = useAuth();
  const isAdmin = useIsAdmin();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<Note> | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("study_notes").select("*").order("average_rating", { ascending: false });
    setNotes((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = notes.filter((n) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return n.title.toLowerCase().includes(q) || n.subject.toLowerCase().includes(q) || (n.author || "").toLowerCase().includes(q);
  });

  const rate = async (note: Note, value: number) => {
    if (!profile) return toast.error("سجل دخول أولاً");
    await supabase.from("note_ratings").upsert(
      { note_id: note.id, user_id: profile.id, rating: value },
      { onConflict: "note_id,user_id" }
    );
    // Refresh aggregate
    const { data } = await supabase.from("note_ratings").select("rating").eq("note_id", note.id);
    const arr = (data as any[]) || [];
    const avg = arr.length ? arr.reduce((a, b) => a + b.rating, 0) / arr.length : 0;
    await supabase.from("study_notes").update({ average_rating: avg, total_ratings: arr.length }).eq("id", note.id);
    toast.success("شكراً على تقييمك ⭐");
    load();
  };

  const incDownloads = async (note: Note) => {
    await supabase.from("study_notes").update({ downloads_count: (note.downloads_count || 0) + 1 }).eq("id", note.id);
  };

  const save = async () => {
    if (!editing?.title || !editing?.subject) return toast.error("العنوان والمادة مطلوبة");
    const payload = {
      subject: editing.subject,
      title: editing.title,
      description: editing.description || null,
      author: editing.author || null,
      cover_url: editing.cover_url || null,
      download_url: editing.download_url || null,
      purchase_url: editing.purchase_url || null,
      grade: editing.grade || profile?.grade || null,
      price: editing.price || 0,
      is_free: !!editing.is_free,
      created_by: profile?.id,
    };
    if (editing.id) {
      await supabase.from("study_notes").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("study_notes").insert(payload);
    }
    toast.success("تم الحفظ ✅");
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذه الملزمة؟")) return;
    await supabase.from("study_notes").delete().eq("id", id);
    toast.success("تم الحذف 🗑️");
    load();
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black gradient-text flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" /> الملازم الأفضل
          </h1>
          <p className="text-xs text-muted-foreground">مختارة بعناية لطلاب العراق</p>
        </div>
        {isAdmin && (
          <Button size="sm" className="gradient-primary text-white border-0 gap-1" onClick={() => setEditing(empty)}>
            <Plus className="h-4 w-4" /> إضافة
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث عن ملزمة أو مادة..." className="pr-10 rounded-xl" />
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-8">جاري التحميل...</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">لا توجد ملازم بعد</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((note, i) => (
            <motion.div key={note.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="overflow-hidden border-primary/10 hover:border-primary/40 transition">
                <div className="flex gap-3 p-3">
                  <div className="w-20 h-24 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    {note.cover_url ? (
                      <img src={note.cover_url} alt={note.title} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="h-8 w-8 text-primary/60" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-black text-sm leading-tight">{note.title}</h3>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <button onClick={() => setEditing(note)} className="text-muted-foreground hover:text-primary"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => remove(note.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-[9px]">{note.subject}</Badge>
                      {note.grade && <Badge variant="outline" className="text-[9px]">{note.grade}</Badge>}
                      {note.is_free ? (
                        <Badge className="text-[9px] bg-emerald-500/15 text-emerald-600 border-0">مجاني</Badge>
                      ) : (
                        <Badge className="text-[9px] bg-amber-500/15 text-amber-600 border-0">{note.price} د.ع</Badge>
                      )}
                    </div>
                    {note.description && <p className="text-[11px] text-muted-foreground line-clamp-2">{note.description}</p>}
                    {note.author && <p className="text-[10px] text-muted-foreground">✍️ {note.author}</p>}
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {(note.average_rating || 0).toFixed(1)} ({note.total_ratings || 0})
                      </span>
                      <span>•</span>
                      <span>{note.downloads_count || 0} تحميل</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((v) => (
                        <button key={v} onClick={() => rate(note, v)} title={`${v} نجوم`}>
                          <Star className={`h-3.5 w-3.5 ${v <= Math.round(note.average_rating || 0) ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 px-3 pb-3">
                  {note.download_url && (
                    <a href={note.download_url} target="_blank" rel="noreferrer" onClick={() => incDownloads(note)}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition">
                      <Download className="h-3.5 w-3.5" /> تحميل
                    </a>
                  )}
                  {note.purchase_url && (
                    <a href={note.purchase_url} target="_blank" rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl gradient-primary text-white text-xs font-bold">
                      <ShoppingCart className="h-3.5 w-3.5" /> شراء
                    </a>
                  )}
                </div>
              </Card>
              {(i + 1) % 4 === 0 && <AdBanner />}
            </motion.div>
          ))}
        </div>
      )}

      <AdBanner />

      {/* Editor */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "تعديل ملزمة" : "إضافة ملزمة"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label className="text-xs">العنوان</Label><Input value={editing.title || ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">المادة</Label><Input value={editing.subject || ""} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} /></div>
                <div><Label className="text-xs">الصف</Label><Input value={editing.grade || ""} onChange={(e) => setEditing({ ...editing, grade: e.target.value })} /></div>
              </div>
              <div><Label className="text-xs">المؤلف</Label><Input value={editing.author || ""} onChange={(e) => setEditing({ ...editing, author: e.target.value })} /></div>
              <div><Label className="text-xs">الوصف</Label><Textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div><Label className="text-xs">صورة الغلاف (URL)</Label><Input value={editing.cover_url || ""} onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })} /></div>
              <div><Label className="text-xs">رابط التحميل</Label><Input value={editing.download_url || ""} onChange={(e) => setEditing({ ...editing, download_url: e.target.value })} /></div>
              <div><Label className="text-xs">رابط الشراء</Label><Input value={editing.purchase_url || ""} onChange={(e) => setEditing({ ...editing, purchase_url: e.target.value })} /></div>
              <div className="flex gap-2 items-center">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={!!editing.is_free} onChange={(e) => setEditing({ ...editing, is_free: e.target.checked })} />
                  مجاني
                </label>
                {!editing.is_free && (
                  <Input type="number" placeholder="السعر (د.ع)" value={editing.price || 0} onChange={(e) => setEditing({ ...editing, price: parseFloat(e.target.value) || 0 })} />
                )}
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={save} className="w-full gradient-primary text-white border-0">حفظ</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

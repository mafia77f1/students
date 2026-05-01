import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { useIsAdmin } from "@/lib/use-premium";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Plus, ShieldAlert, KeyRound, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface CodeRow {
  id: string;
  code: string;
  duration_days: number;
  is_used: boolean;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
}

function randomChunk(len = 4) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
function generateCode() {
  return `TOLAB-${randomChunk(4)}-${randomChunk(4)}`;
}

export default function Admin() {
  const isAdmin = useIsAdmin();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [codes, setCodes] = useState<CodeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [duration, setDuration] = useState(30);
  const [count, setCount] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from("subscription_codes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setCodes((data as any) || []);
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto p-6 text-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-destructive mx-auto" />
        <h1 className="text-xl font-black">غير مصرح</h1>
        <p className="text-sm text-muted-foreground">هذه الصفحة متاحة للمدراء فقط.</p>
        <Button onClick={() => navigate("/")}>العودة للرئيسية</Button>
      </div>
    );
  }

  const handleGenerate = async () => {
    if (count < 1 || count > 100) {
      toast.error("العدد يجب أن يكون بين 1 و 100");
      return;
    }
    setLoading(true);
    const rows = Array.from({ length: count }, () => ({
      code: generateCode(),
      duration_days: duration,
      created_by: user?.id ?? null,
    }));
    const { error } = await supabase.from("subscription_codes").insert(rows);
    if (error) {
      toast.error("تعذر إنشاء الأكواد");
    } else {
      toast.success(`✅ تم إنشاء ${count} كود`);
      await load();
    }
    setLoading(false);
  };

  const copy = async (row: CodeRow) => {
    await navigator.clipboard.writeText(row.code);
    setCopiedId(row.id);
    toast.success("تم نسخ الكود");
    setTimeout(() => setCopiedId(null), 1500);
  };

  const usedCount = codes.filter((c) => c.is_used).length;

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-6 gradient-mesh text-white shadow-xl"
      >
        <div className="flex items-center gap-3">
          <KeyRound className="h-8 w-8" />
          <div>
            <h1 className="text-xl font-black">لوحة الأدمن</h1>
            <p className="text-xs opacity-90">إدارة أكواد البريميوم</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-white/15 rounded-xl p-2 text-center">
            <p className="text-2xl font-black">{codes.length}</p>
            <p className="text-[10px] opacity-90">الكل</p>
          </div>
          <div className="bg-white/15 rounded-xl p-2 text-center">
            <p className="text-2xl font-black">{usedCount}</p>
            <p className="text-[10px] opacity-90">مستخدم</p>
          </div>
          <div className="bg-white/15 rounded-xl p-2 text-center">
            <p className="text-2xl font-black">{codes.length - usedCount}</p>
            <p className="text-[10px] opacity-90">متاح</p>
          </div>
        </div>
      </motion.div>

      {/* Generate */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Plus className="h-4 w-4" /> إنشاء أكواد جديدة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">المدة (أيام)</Label>
              <Input
                type="number"
                value={duration}
                min={1}
                onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
              />
            </div>
            <div>
              <Label className="text-xs">العدد</Label>
              <Input
                type="number"
                value={count}
                min={1}
                max={100}
                onChange={(e) => setCount(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>
          <div className="flex gap-2">
            {[30, 90, 180, 365].map((d) => (
              <Button
                key={d}
                size="sm"
                variant={duration === d ? "default" : "outline"}
                onClick={() => setDuration(d)}
                className="text-xs flex-1"
              >
                {d} يوم
              </Button>
            ))}
          </div>
          <Button onClick={handleGenerate} disabled={loading} className="w-full gradient-primary text-white">
            {loading ? "جاري..." : `إنشاء ${count} كود`}
          </Button>
        </CardContent>
      </Card>

      {/* Codes list */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">الأكواد ({codes.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {codes.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-4">لا توجد أكواد بعد</p>
          )}
          {codes.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-2 p-3 rounded-xl border border-border/50 bg-card/50"
            >
              <div className="flex-1 min-w-0">
                <p className="font-mono font-bold text-sm" dir="ltr">{c.code}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[9px]">{c.duration_days} يوم</Badge>
                  {c.is_used ? (
                    <Badge variant="secondary" className="text-[9px]">مستخدم</Badge>
                  ) : (
                    <Badge className="text-[9px] bg-emerald-500 text-white">متاح</Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copy(c)}
                disabled={c.is_used}
              >
                {copiedId === c.id ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

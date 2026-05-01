import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, Check, X, Sparkles, BarChart3, UserCog, Image as ImageIcon, Zap, ShieldOff, BadgeCheck, KeyRound, PartyPopper } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const PRO_FEATURES = [
  { icon: Sparkles, label: "خطة دراسة أدق ومخصصة بالذكاء الاصطناعي" },
  { icon: BarChart3, label: "إحصائيات تفصيلية متقدمة وتحليلات أسبوعية وشهرية" },
  { icon: UserCog, label: "تعديل كامل للبروفايل (لون الاسم، الشارات، التفاصيل)" },
  { icon: ImageIcon, label: "بنر مخصص لصفحتك الشخصية" },
  { icon: Zap, label: "تجربة أسرع وميزات مبكرة قبل الجميع" },
  { icon: ShieldOff, label: "إزالة جميع الإعلانات تماماً" },
];

const FREE_FEATURES = [
  "جلسات بومودورو غير محدودة",
  "الانضمام للتحديات",
  "كتب المنهج PDF",
  "تتبع XP والمستويات",
  "إعلانات بسيطة",
];

export default function Premium({ inline = false }: { inline?: boolean }) {
  const { profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [celebrate, setCelebrate] = useState(false);

  const redeemCode = async () => {
    if (!profile) return;
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toast.error("الرجاء إدخال كود التفعيل");
      return;
    }
    setLoading(true);
    try {
      // 1) Look up an unused code matching exactly
      const { data: codeRow, error: lookupErr } = await supabase
        .from("subscription_codes")
        .select("id, duration_days, is_used")
        .eq("code", trimmed)
        .eq("is_used", false)
        .maybeSingle();

      if (lookupErr || !codeRow) {
        toast.error("كود غير صالح أو مستخدم مسبقاً");
        setLoading(false);
        return;
      }

      // 2) Mark it used (atomic via RLS — only succeeds if still unused)
      const { error: updErr } = await supabase
        .from("subscription_codes")
        .update({
          is_used: true,
          used_by: profile.id,
          used_at: new Date().toISOString(),
        })
        .eq("id", codeRow.id)
        .eq("is_used", false);

      if (updErr) {
        toast.error("تعذر تفعيل الكود، حاول مرة أخرى");
        setLoading(false);
        return;
      }

      // 3) Extend premium on profile
      const baseFrom = profile.premium_until && new Date(profile.premium_until) > new Date()
        ? new Date(profile.premium_until)
        : new Date();
      const until = new Date(baseFrom.getTime() + codeRow.duration_days * 24 * 60 * 60 * 1000);

      await supabase.from("profiles").update({
        is_premium: true,
        premium_until: until.toISOString(),
        premium_seen: true,
      }).eq("id", profile.id);

      await refreshProfile();
      setCelebrate(true);
      toast.success(`🎉 تم تفعيل البريميوم لمدة ${codeRow.duration_days} يوم!`);
      setTimeout(() => {
        setCelebrate(false);
        navigate("/");
      }, 2200);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (!profile) return;
    await supabase.from("profiles").update({ premium_seen: true }).eq("id", profile.id);
    await refreshProfile();
    navigate("/");
  };

  return (
    <div className={`${inline ? "" : "min-h-screen"} bg-background flex items-center justify-center p-4`}>
      <div className="w-full max-w-lg space-y-4">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-3xl gradient-mesh p-6 text-white text-center shadow-2xl"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <motion.div
            animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="relative inline-flex w-20 h-20 rounded-3xl bg-white/20 backdrop-blur items-center justify-center mb-3 ring-2 ring-white/40"
          >
            <Crown className="h-10 w-10 drop-shadow-lg" />
          </motion.div>
          <h1 className="relative text-2xl font-black mb-1">طلاب بريميوم 👑</h1>
          <p className="relative text-sm opacity-90">انطلق بأقصى إمكاناتك الدراسية</p>

          <div className="relative mt-4 inline-flex items-baseline gap-1 bg-white/20 backdrop-blur rounded-2xl px-5 py-3 border border-white/30">
            <span className="text-4xl font-black">$9</span>
            <span className="text-xs opacity-90 font-bold">/ سنة كاملة</span>
          </div>
          <p className="relative text-[11px] mt-2 opacity-90 font-bold">
            🎉 عرض حصري: متوفر فقط <u>سنوياً</u> — لا اشتراك شهري
          </p>
        </motion.div>

        {/* Premium features */}
        <Card className="border-primary/30 glow-soft">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <BadgeCheck className="h-5 w-5 text-primary" />
              <h3 className="font-black text-sm">مزايا البريميوم</h3>
            </div>
            {PRO_FEATURES.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-primary/5 border border-primary/10"
              >
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0 shadow-sm">
                  <f.icon className="h-4 w-4 text-white" />
                </div>
                <p className="text-xs font-bold flex-1">{f.label}</p>
                <Check className="h-4 w-4 text-primary shrink-0" />
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Free comparison */}
        <Card className="border-border/50">
          <CardContent className="p-4">
            <h3 className="font-black text-xs text-muted-foreground mb-2">العضوية المجانية تحتوي على</h3>
            <div className="grid grid-cols-1 gap-1.5">
              {FREE_FEATURES.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-[11px]">
                  <Check className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{f}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activation code */}
        <Card className="border-primary/30">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              <h3 className="font-black text-sm">كود التفعيل</h3>
            </div>
            <p className="text-[11px] text-muted-foreground">
              أدخل الكود الذي حصلت عليه لتفعيل البريميوم. صيغة الكود: <span className="font-mono">TOLAB-XXXX-XXXX</span>
            </p>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="TOLAB-XXXX-XXXX"
              className="font-mono text-center tracking-wider"
              maxLength={32}
              dir="ltr"
            />
            <Button
              onClick={redeemCode}
              disabled={loading || !code.trim()}
              className="w-full h-12 gradient-primary text-white border-0 rounded-2xl font-black gap-2 glow-primary"
            >
              <Crown className="h-4 w-4" />
              {loading ? "جاري التفعيل..." : "تفعيل الكود"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-2">
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="w-full text-muted-foreground gap-2 text-xs"
          >
            <X className="h-3.5 w-3.5" /> ربما لاحقاً، أكمل بالنسخة المجانية
          </Button>
        </div>

        <AnimatePresence>
          {celebrate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="text-center"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.1, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="w-32 h-32 mx-auto rounded-full gradient-primary flex items-center justify-center glow-primary mb-4"
                >
                  <Crown className="h-16 w-16 text-white drop-shadow-lg" />
                </motion.div>
                <h2 className="text-3xl font-black mb-2 flex items-center justify-center gap-2">
                  <PartyPopper className="h-7 w-7 text-secondary" /> مبروك!
                </h2>
                <p className="text-muted-foreground">أصبحت عضو بريميوم 👑</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

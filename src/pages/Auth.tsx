import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Lock, User, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import appIcon from "@/assets/app-icon.png";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else toast.success("تم تسجيل الدخول بنجاح!");
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name }, emailRedirectTo: window.location.origin },
      });
      if (error) toast.error(error.message);
      else toast.success("تم إنشاء الحساب! تحقق من بريدك الإلكتروني.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-background relative overflow-x-hidden">
      {/* الخلفيات داخل التدفق العادي حتى لا تظهر مساحات رمادية عند فتح الكيبورد */}
      <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-secondary/10 blur-3xl" />
      </div>

      {/* منطقة المحتوى العلوي */}
      <div className="flex flex-col items-center justify-center px-6 pt-10 pb-6 relative z-10">
        <motion.img
          src={appIcon}
          alt="طلاب"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-20 h-20 rounded-3xl object-cover mb-3 shadow-xl"
        />
        <h1 className="text-2xl font-black gradient-text mb-1">طلاب</h1>
        <p className="text-xs text-muted-foreground text-center">
          {isLogin ? "أهلاً بعودتك ✨" : "ابدأ رحلتك الدراسية"}
        </p>
      </div>

      {/* الفورم */}
      <div className="w-full bg-card border-t border-border/50 rounded-t-[2.5rem] px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] relative z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
        <div className="w-12 h-1.5 bg-muted rounded-full mx-auto mb-6" />

        <h2 className="text-xl font-black mb-1">
          {isLogin ? "تسجيل الدخول" : "إنشاء حساب جديد"}
        </h2>
        <p className="text-xs text-muted-foreground mb-5">
          {isLogin ? "ادخل بياناتك للمتابعة" : "املأ معلوماتك للبدء"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold">الاسم</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="name" placeholder="اسمك الكامل" value={name} onChange={(e) => setName(e.target.value)} className="pr-10 h-12 rounded-xl bg-muted/40 border-border/50" required />
              </div>
            </div>
          )}
          
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold">البريد الإلكتروني</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" inputMode="email" placeholder="example@mail.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pr-10 h-12 rounded-xl bg-muted/40 border-border/50" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-bold">كلمة المرور</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10 h-12 rounded-xl bg-muted/40 border-border/50" required minLength={6} />
            </div>
          </div>

          <Button type="submit" className="w-full h-12 py-6 gradient-primary text-white border-0 rounded-2xl font-black gap-2 mt-2" disabled={loading}>
            {loading ? "جاري التحميل..." : (
              <>
                {isLogin ? "دخول" : "إنشاء حساب"} <ArrowLeft className="h-4 w-4" />
              </>
            )}
          </Button>
        </form>

        <button
          onClick={() => setIsLogin(!isLogin)}
          type="button"
          className="block mx-auto mt-5 text-xs text-muted-foreground mb-2"
        >
          {isLogin ? <>ليس لديك حساب؟ <span className="text-primary font-bold">أنشئ حساب</span></> : <>لديك حساب؟ <span className="text-primary font-bold">سجل دخول</span></>}
        </button>
      </div>
    </div>
  );
}

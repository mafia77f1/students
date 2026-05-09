import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Lock, User, ArrowLeft } from "lucide-react";
import appIcon from "@/assets/app-icon.png";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanEmail || !password || (!isLogin && !cleanName)) {
      toast.error("أكمل الحقول المطلوبة");
      return;
    }

    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
      if (error) toast.error(error.message);
      else toast.success("تم تسجيل الدخول بنجاح!");
    } else {
      const { error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: { data: { name: cleanName }, emailRedirectTo: window.location.origin },
      });
      if (error) toast.error(error.message);
      else toast.success("تم إنشاء الحساب! تحقق من بريدك الإلكتروني.");
    }
    setLoading(false);
  };

  return (
    <main className="auth-screen bg-background text-foreground">
      <section className={`auth-panel ${inputFocused ? "auth-panel--focused" : ""}`}>
        <div className="flex items-center gap-3 pb-4">
          <img src={appIcon} alt="طلاب" className="h-12 w-12 shrink-0 rounded-2xl object-cover" />
          <div>
            <h1 className="text-2xl font-black gradient-text">طلاب</h1>
            {!inputFocused && (
              <p className="text-sm text-muted-foreground">
                {isLogin ? "أهلاً بعودتك ✨" : "ابدأ رحلتك الدراسية"}
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-xl font-black">{isLogin ? "تسجيل الدخول" : "إنشاء حساب جديد"}</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {isLogin ? "ادخل بياناتك للمتابعة" : "املأ معلوماتك للبدء"}
          </p>

          <form
            onSubmit={handleSubmit}
            onFocusCapture={() => setInputFocused(true)}
            onBlurCapture={() => window.setTimeout(() => setInputFocused(false), 120)}
            className="space-y-3"
          >
          {!isLogin && (
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold">الاسم</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="name" autoComplete="name" placeholder="اسمك الكامل" value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl border-border bg-background pr-10 text-base" required />
              </div>
            </div>
          )}
          
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-bold">البريد الإلكتروني</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="email" type="email" inputMode="email" autoComplete="email" placeholder="example@mail.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl border-border bg-background pr-10 text-base" required />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-bold">كلمة المرور</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input id="password" type="password" autoComplete={isLogin ? "current-password" : "new-password"} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl border-border bg-background pr-10 text-base" required minLength={6} />
            </div>
          </div>

          <Button type="submit" className="mt-2 h-12 w-full gap-2 rounded-2xl border-0 gradient-primary font-black text-primary-foreground" disabled={loading}>
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
            className="mx-auto mt-4 block text-sm text-muted-foreground"
          >
            {isLogin ? <>ليس لديك حساب؟ <span className="font-bold text-primary">أنشئ حساب</span></> : <>لديك حساب؟ <span className="font-bold text-primary">سجل دخول</span></>}
          </button>
        </div>
      </section>
    </main>
  );
}

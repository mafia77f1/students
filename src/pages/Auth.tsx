import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GraduationCap, Mail, Lock, User } from "lucide-react";

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-xl border-primary/20 glow-primary">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center glow-primary">
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold gradient-text">طلاب</CardTitle>
          <p className="text-muted-foreground text-sm">
            {isLogin ? "سجل دخولك لمتابعة الدراسة" : "أنشئ حسابك وابدأ رحلة التعلم"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">الاسم</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="name" placeholder="اسمك الكامل" value={name} onChange={(e) => setName(e.target.value)} className="pr-10" required />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="example@mail.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pr-10" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" required minLength={6} />
              </div>
            </div>
            <Button type="submit" className="w-full gradient-primary text-primary-foreground" disabled={loading}>
              {loading ? "جاري التحميل..." : isLogin ? "تسجيل الدخول" : "إنشاء حساب"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button onClick={() => setIsLogin(!isLogin)} className="text-sm text-primary hover:underline">
              {isLogin ? "ليس لديك حساب؟ أنشئ واحداً" : "لديك حساب؟ سجل الدخول"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

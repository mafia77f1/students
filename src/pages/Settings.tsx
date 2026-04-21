import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { supabase } from "@/integrations/supabase/client";
import { Settings as SettingsIcon, Moon, Sun, LogOut, User, Save, Lock, Mail, Camera, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Settings() {
  const { profile, signOut, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [name, setName] = useState(profile?.name || "");
  const [saving, setSaving] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const updateName = async () => {
    if (!profile || !name.trim()) return;
    setSaving(true);
    await supabase.from("profiles").update({ name: name.trim() }).eq("id", profile.id);
    await refreshProfile();
    setSaving(false);
    toast.success("تم تحديث الاسم ✅");
  };

  const updateEmail = async () => {
    if (!newEmail.trim()) return;
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) toast.error(error.message);
    else {
      toast.success("تم إرسال رابط التأكيد للإيميل الجديد 📧");
      setNewEmail("");
    }
  };

  const updatePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("كلمة السر يجب أن تكون 6 أحرف على الأقل");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("كلمات السر غير متطابقة");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) toast.error(error.message);
    else {
      toast.success("تم تحديث كلمة السر ✅");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <SettingsIcon className="h-5 w-5 text-primary" /> الإعدادات
      </h1>

      {/* Theme */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === "dark" ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-secondary" />}
              <span className="text-sm font-medium">{theme === "dark" ? "الوضع الداكن" : "الوضع الفاتح"}</span>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>

      {/* Edit Name */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><User className="h-4 w-4" /> الاسم</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك..." />
          <Button size="sm" onClick={updateName} disabled={saving || name === profile?.name} className="gap-2">
            <Save className="h-4 w-4" /> حفظ
          </Button>
        </CardContent>
      </Card>

      {/* Edit Email */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4" /> تغيير الإيميل</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="الإيميل الجديد..." />
          <Button size="sm" onClick={updateEmail} disabled={!newEmail.trim()} className="gap-2">
            <Save className="h-4 w-4" /> تحديث
          </Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Lock className="h-4 w-4" /> تغيير كلمة السر</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="كلمة السر الجديدة..." />
          <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="تأكيد كلمة السر..." />
          <Button size="sm" onClick={updatePassword} disabled={!newPassword} className="gap-2">
            <Save className="h-4 w-4" /> تحديث
          </Button>
        </CardContent>
      </Card>

      {/* Info */}
      <Card>
        <CardContent className="py-4 space-y-1 text-sm text-muted-foreground">
          <p>البلد: {profile?.country}</p>
          <p>المرحلة: {profile?.grade}</p>
          <p>الدور: {profile?.role === "teacher" ? "أستاذ" : "طالب"}</p>
        </CardContent>
      </Card>

      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => {
          localStorage.removeItem("splash_seen");
          toast.success("سيتم عرض شاشة الترحيب من جديد عند إعادة الفتح ✨");
          setTimeout(() => window.location.reload(), 600);
        }}
      >
        <Sparkles className="h-4 w-4 text-primary" /> إعادة عرض شاشة الترحيب
      </Button>

      <Button variant="outline" className="w-full gap-2 text-destructive" onClick={signOut}>
        <LogOut className="h-4 w-4" /> تسجيل الخروج
      </Button>
    </div>
  );
}

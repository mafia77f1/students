import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { Settings as SettingsIcon, Moon, Sun, LogOut, User, BookOpen, GraduationCap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <SettingsIcon className="h-6 w-6 text-primary" /> الإعدادات
      </h1>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">المظهر</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {theme === "dark" ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-secondary" />}
              <Label>{theme === "dark" ? "الوضع الداكن" : "الوضع الفاتح"}</Label>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">الحساب</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <button onClick={() => navigate("/profile")} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
            <User className="h-5 w-5 text-primary" />
            <span className="text-sm">الملف الشخصي</span>
          </button>
          <button onClick={() => navigate("/grades")} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="text-sm">الدرجات وخطط الدراسة</span>
          </button>
          {profile?.role === "teacher" && (
            <button onClick={() => navigate("/teachers")} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="text-sm">ملف الأستاذ</span>
            </button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">المعلومات</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>الاسم: {profile?.name}</p>
          <p>البلد: {profile?.country}</p>
          <p>المرحلة: {profile?.grade}</p>
          <p>الدور: {profile?.role === "teacher" ? "أستاذ" : "طالب"}</p>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full gap-2 text-destructive" onClick={signOut}>
        <LogOut className="h-4 w-4" /> تسجيل الخروج
      </Button>
    </div>
  );
}

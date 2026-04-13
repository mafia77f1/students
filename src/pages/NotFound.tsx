import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-primary mb-4">404</h1>
        <p className="text-muted-foreground mb-6">الصفحة غير موجودة</p>
        <Button onClick={() => navigate("/")} className="gradient-primary text-primary-foreground">
          الرجوع للرئيسية
        </Button>
      </div>
    </div>
  );
}

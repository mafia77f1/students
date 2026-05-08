import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Trophy, Users, Rocket, ArrowLeft } from "lucide-react";
import appIcon from "@/assets/app-icon.png";

const features = [
  { icon: Rocket, title: "ادرس بتركيز", desc: "جلسات بومودورو ذكية مع أهداف واضحة", color: "from-violet-500 to-fuchsia-500" },
  { icon: Users, title: "غرف جماعية", desc: "ادرس مع أصدقائك في غرف مباشرة", color: "from-cyan-400 to-blue-500" },
  { icon: Trophy, title: "تحديات و رتب", desc: "اربح XP وارتقِ من برونزي إلى أسطوري", color: "from-amber-400 to-rose-500" },
];

export default function Splash({ onFinish }: { onFinish: () => void }) {
  const navigate = useNavigate();

  const handleStart = () => {
    localStorage.setItem("splash_seen", "1");
    onFinish();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-between p-6 relative overflow-y-auto overflow-x-hidden gap-6">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10 max-w-md">
        <div className="relative mb-6">
          <img
            src={appIcon}
            alt="طلاب"
            className="w-28 h-28 rounded-[1.5rem] object-cover shadow-lg"
          />
        </div>

        <h1 className="text-5xl font-black gradient-text mb-3">
          طلاب
        </h1>
        <p className="text-base text-muted-foreground mb-10 leading-relaxed">
          منصتك الذكية للدراسة الجماعية الملعّبة 🚀<br />
          ادرس، تحدَّ، وارتقِ على لوحة الصدارة
        </p>

        <div className="space-y-3 w-full mb-8">
          {features.map((f, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border/60 bg-card p-4 flex items-center gap-3 text-right shadow-sm"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shrink-0 shadow-lg`}>
                <f.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="w-full max-w-md relative z-10">
        <Button
          onClick={handleStart}
          className="w-full gradient-primary text-white border-0 text-base py-6 gap-2 rounded-2xl font-black shadow-md"
        >
          ابدأ الرحلة <ArrowLeft className="h-5 w-5" />
        </Button>
        <p className="text-center text-[11px] text-muted-foreground mt-3">
          انضم لآلاف الطلاب وحقق أهدافك ✨
        </p>
      </div>
    </div>
  );
}

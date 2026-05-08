import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, Trophy, Users, Rocket, ArrowLeft } from "lucide-react";
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
      {/* Floating glow blobs */}
      <motion.div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/30 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-secondary/30 blur-3xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 7, repeat: Infinity }}
      />

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10 max-w-md">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="relative mb-6"
        >
          <img
            src={appIcon}
            alt="طلاب"
            className="w-32 h-32 rounded-[2rem] object-cover shadow-2xl"
            style={{ boxShadow: "0 0 60px hsl(var(--secondary) / 0.6), 0 0 100px hsl(var(--primary) / 0.3)" }}
          />
          <motion.div
            className="absolute -top-2 -right-2"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="h-7 w-7 text-secondary drop-shadow-lg" />
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-5xl font-black gradient-text mb-3"
        >
          طلاب
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-base text-muted-foreground mb-10 leading-relaxed"
        >
          منصتك الذكية للدراسة الجماعية الملعّبة 🚀<br />
          ادرس، تحدَّ، وارتقِ على لوحة الصدارة
        </motion.p>

        <div className="space-y-3 w-full mb-8">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.12 }}
              className="glass rounded-2xl p-4 flex items-center gap-3 text-right"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shrink-0 shadow-lg`}>
                <f.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <Button
          onClick={handleStart}
          className="w-full gradient-primary text-white border-0 text-base py-7 gap-2 rounded-2xl glow-primary font-black"
        >
          ابدأ الرحلة <ArrowLeft className="h-5 w-5" />
        </Button>
        <p className="text-center text-[11px] text-muted-foreground mt-3">
          انضم لآلاف الطلاب وحقق أهدافك ✨
        </p>
      </motion.div>
    </div>
  );
}

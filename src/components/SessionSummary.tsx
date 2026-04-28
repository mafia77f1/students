import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Clock, Target, Zap, Repeat, Home, PlayCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  subject: string;
  focusMinutes: number;          // actual focus completed in this session
  breakMinutes: number;          // break minutes consumed
  rounds: number;                // focus rounds completed
  xpEarned: number;
  targetMinutes: number;         // overall target for this subject
  doneSoFarMinutes: number;      // total minutes done across sessions for this subject (incl. now)
  onContinue: () => void;        // start a new session for same subject (resume)
}

export default function SessionSummary({
  subject, focusMinutes, breakMinutes, rounds, xpEarned,
  targetMinutes, doneSoFarMinutes, onContinue,
}: Props) {
  const navigate = useNavigate();
  const pct = Math.min(100, Math.round((doneSoFarMinutes / Math.max(1, targetMinutes)) * 100));
  const remaining = Math.max(0, targetMinutes - doneSoFarMinutes);
  const fmt = (m: number) => {
    const h = Math.floor(m / 60), mm = m % 60;
    return h > 0 ? `${h}س ${mm}د` : `${mm}د`;
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="overflow-hidden border-0 shadow-2xl">
          <div className="gradient-mesh p-6 text-white text-center relative">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <p className="text-xs opacity-80 font-bold mb-1">جلسة منتهية</p>
              <h2 className="text-2xl font-black">{subject}</h2>
              <div className="mt-5">
                <div className="text-5xl font-black drop-shadow-lg">{pct}%</div>
                <p className="text-xs opacity-90 mt-1">من هدف {fmt(targetMinutes)}</p>
              </div>
              <div className="mt-4 h-2.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8 }} className="h-full bg-white rounded-full" />
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      <div className="grid grid-cols-2 gap-2.5">
        {[
          { icon: Clock, label: "تركيز فعلي", value: fmt(focusMinutes), grad: "from-violet-500 to-fuchsia-500" },
          { icon: Repeat, label: "جولات", value: rounds, grad: "from-blue-500 to-cyan-500" },
          { icon: Zap, label: "XP", value: `+${xpEarned}`, grad: "from-amber-500 to-orange-500" },
          { icon: Target, label: "متبقي للهدف", value: fmt(remaining), grad: "from-emerald-500 to-teal-500" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
            <Card className="border-border/60">
              <CardContent className="p-3 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.grad} flex items-center justify-center shadow-md`}>
                  <s.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-medium">{s.label}</p>
                  <p className="font-black text-sm">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-border/60">
        <CardContent className="p-3 text-center text-xs text-muted-foreground">
          استراحات: {fmt(breakMinutes)} • وقت الجلسة الكلي: {fmt(focusMinutes + breakMinutes)}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={() => navigate("/")} variant="outline" className="flex-1 gap-2 rounded-xl h-12">
          <Home className="h-4 w-4" /> الرئيسية
        </Button>
        {remaining > 0 && (
          <Button onClick={onContinue} className="flex-[2] gap-2 rounded-xl h-12 gradient-primary text-white border-0 glow-primary font-black">
            <PlayCircle className="h-5 w-5" /> أكمل من حيث وقفت
          </Button>
        )}
      </div>
    </div>
  );
}

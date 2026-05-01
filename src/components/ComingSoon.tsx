import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function ComingSoon({ title, description }: { title: string; description?: string }) {
  const navigate = useNavigate();
  return (
    <div className="max-w-md mx-auto pt-10 text-center space-y-6">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative mx-auto w-32 h-32 rounded-3xl gradient-mesh flex items-center justify-center glow-primary"
      >
        <motion.div
          animate={{ rotate: [0, 12, -12, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <Sparkles className="h-14 w-14 text-white drop-shadow-lg" />
        </motion.div>
      </motion.div>

      <div className="space-y-2">
        <h1 className="text-2xl font-black gradient-text">{title}</h1>
        <p className="text-sm text-muted-foreground px-4">
          {description || "هذه الميزة قيد التطوير وراح تكون متاحة قريباً جداً 🚀"}
        </p>
        <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black border border-primary/20">
          🛠️ قريباً • Soon
        </div>
      </div>

      <Button
        onClick={() => navigate("/")}
        className="gradient-primary text-white border-0 rounded-xl gap-2 font-black"
      >
        رجوع للرئيسية <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

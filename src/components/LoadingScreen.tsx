import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

export function LoadingScreen({ label = "جاري التحميل..." }: { label?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* ambient blobs */}
      <motion.div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/30 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.25, 0.45, 0.25] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-secondary/30 blur-3xl"
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 6, repeat: Infinity }}
      />

      <div className="relative flex flex-col items-center gap-5">
        {/* orbiting dots */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_12px_hsl(var(--primary))]" />
          </motion.div>
          <motion.div
            className="absolute inset-2 rounded-full border-2 border-secondary/30"
            animate={{ rotate: -360 }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-secondary shadow-[0_0_10px_hsl(var(--secondary))]" />
          </motion.div>

          {/* center logo */}
          <motion.div
            className="w-14 h-14 rounded-2xl gradient-mesh flex items-center justify-center shadow-xl"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          >
            <BookOpen className="h-7 w-7 text-white" />
          </motion.div>
        </div>

        <motion.p
          className="text-sm font-bold gradient-text"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {label}
        </motion.p>
      </div>
    </div>
  );
}

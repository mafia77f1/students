import { Sparkles, Star, Flame, Crown, Gem, Rocket } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface LevelInfo {
  level: number;
  icon: LucideIcon;
  color: string; // tailwind gradient classes
  glow: string; // shadow color
  xpForCurrent: number;
  xpForNext: number;
  progress: number; // 0..100
}

// XP required to REACH level N (N >= 1). Formula: 200 * (N-1)^1.35
function xpFor(level: number) {
  if (level <= 1) return 0;
  return Math.round(200 * Math.pow(level - 1, 1.35));
}

export function levelFromXP(totalXP: number): number {
  let lvl = 1;
  while (xpFor(lvl + 1) <= totalXP) lvl++;
  return lvl;
}

export function getLevelInfo(totalXP: number): LevelInfo {
  const level = levelFromXP(totalXP);
  const xpForCurrent = xpFor(level);
  const xpForNext = xpFor(level + 1);
  const progress = Math.min(100, ((totalXP - xpForCurrent) / (xpForNext - xpForCurrent)) * 100);

  let icon: LucideIcon = Sparkles;
  let color = "from-slate-400 to-slate-300";
  let glow = "hsl(var(--muted-foreground))";

  if (level >= 50) { icon = Crown; color = "from-fuchsia-500 to-purple-500"; glow = "236 72% 60%"; }
  else if (level >= 30) { icon = Gem; color = "from-cyan-400 to-blue-500"; glow = "200 90% 55%"; }
  else if (level >= 20) { icon = Rocket; color = "from-violet-500 to-fuchsia-500"; glow = "270 80% 60%"; }
  else if (level >= 10) { icon = Flame; color = "from-amber-500 to-orange-500"; glow = "30 90% 55%"; }
  else if (level >= 5) { icon = Star; color = "from-yellow-400 to-amber-400"; glow = "45 90% 55%"; }

  return { level, icon, color, glow, xpForCurrent, xpForNext, progress };
}

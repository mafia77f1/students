// 6-rank system based on XP thresholds (no formula — fixed bands)
// Each rank has a title, emoji icon, and unlocked feature.

export interface RankInfo {
  level: number;          // 1..6
  title: string;          // الاسم
  emoji: string;          // 🔍 🔥 📚 ✨ 🧠 👑
  perk: string;           // الميزة المكتسبة
  color: string;          // tailwind gradient (from-... to-...)
  glow: string;           // hsl color for shadow
  minXP: number;
  maxXP: number;          // Infinity for last
  xpForCurrent: number;   // alias of minXP (for legacy use)
  xpForNext: number;      // maxXP+1 effectively
  progress: number;       // 0..100 within current band
}

const RANKS = [
  { level: 1, title: "مستكشف",  emoji: "🔍", perk: "فتح الملف الشخصي وتخصيص الصورة",                 min: 0,     max: 500,    color: "from-slate-400 to-zinc-400",       glow: "220 10% 60%" },
  { level: 2, title: "مكافح",   emoji: "🔥", perk: "الحصول على شعلة النشاط (Daily Streak)",            min: 501,   max: 2000,   color: "from-amber-500 to-orange-500",     glow: "30 90% 55%"  },
  { level: 3, title: "مثقف",    emoji: "📚", perk: "الانضمام لمجموعات المذاكرة الجماعية",              min: 2001,  max: 5000,   color: "from-emerald-500 to-teal-500",     glow: "160 80% 45%" },
  { level: 4, title: "متميز",   emoji: "✨", perk: "تغيير لون اسمك في المحادثات العامة",                min: 5001,  max: 10000,  color: "from-cyan-400 to-blue-500",        glow: "200 90% 55%" },
  { level: 5, title: "نابغة",   emoji: "🧠", perk: "إنشاء التحديات ودعوة الأصدقاء",                    min: 10001, max: 20000,  color: "from-violet-500 to-fuchsia-500",   glow: "270 80% 60%" },
  { level: 6, title: "علاّمة",  emoji: "👑", perk: "وضع الخبير: تصحيح إجابات الآخرين",                  min: 20001, max: Infinity, color: "from-fuchsia-500 to-purple-600", glow: "290 80% 60%" },
];

export function getRankInfo(totalXP: number): RankInfo {
  const xp = Math.max(0, totalXP || 0);
  const r = RANKS.find((x) => xp >= x.min && xp <= x.max) || RANKS[0];
  const next = RANKS.find((x) => x.min > r.min) || r;
  const span = (r.max === Infinity ? r.min + 1000 : r.max) - r.min;
  const progress = r.max === Infinity ? 100 : Math.min(100, Math.max(0, ((xp - r.min) / span) * 100));
  return {
    level: r.level,
    title: r.title,
    emoji: r.emoji,
    perk: r.perk,
    color: r.color,
    glow: r.glow,
    minXP: r.min,
    maxXP: r.max,
    xpForCurrent: r.min,
    xpForNext: next.min,
    progress,
  };
}

// Backwards-compatible aliases (older code imports getLevelInfo / icon)
export const getLevelInfo = getRankInfo;
export const levelFromXP = (xp: number) => getRankInfo(xp).level;
export const ALL_RANKS = RANKS;

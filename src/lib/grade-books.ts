// Iraqi curriculum book links per grade & subject.
// Replace href with real Ministry of Education PDF links anytime.
export interface BookLink {
  subject: string;
  href: string; // external PDF URL
  emoji: string;
  color: string; // tailwind gradient
}

// Default placeholder URL (Iraqi MoE site search). Replace per book later.
const PLACEHOLDER = "https://epedu.gov.iq/";

const COMMON: BookLink[] = [
  { subject: "الرياضيات", href: PLACEHOLDER, emoji: "🧮", color: "from-violet-400/80 to-fuchsia-400/80" },
  { subject: "الفيزياء", href: PLACEHOLDER, emoji: "⚛️", color: "from-cyan-400/80 to-blue-400/80" },
  { subject: "الكيمياء", href: PLACEHOLDER, emoji: "🧪", color: "from-emerald-400/80 to-teal-400/80" },
  { subject: "الأحياء", href: PLACEHOLDER, emoji: "🧬", color: "from-lime-400/80 to-emerald-400/80" },
  { subject: "اللغة العربية", href: PLACEHOLDER, emoji: "📖", color: "from-amber-400/80 to-orange-400/80" },
  { subject: "اللغة الإنجليزية", href: PLACEHOLDER, emoji: "🔤", color: "from-rose-400/80 to-pink-400/80" },
  { subject: "التاريخ", href: PLACEHOLDER, emoji: "🏛️", color: "from-yellow-500/80 to-amber-500/80" },
  { subject: "الجغرافيا", href: PLACEHOLDER, emoji: "🗺️", color: "from-teal-400/80 to-cyan-500/80" },
  { subject: "الحاسوب", href: PLACEHOLDER, emoji: "💻", color: "from-slate-400/80 to-zinc-400/80" },
  { subject: "البرمجة", href: PLACEHOLDER, emoji: "👨‍💻", color: "from-indigo-400/80 to-violet-400/80" },
  { subject: "التربية الإسلامية", href: PLACEHOLDER, emoji: "🕌", color: "from-emerald-500/80 to-green-500/80" },
];

export function getBooksForGrade(grade: string | undefined | null): BookLink[] {
  if (!grade) return COMMON;
  return COMMON;
}

export function getBookFor(subject: string, grade?: string | null): BookLink {
  const all = getBooksForGrade(grade);
  return (
    all.find((b) => b.subject === subject) || {
      subject,
      href: PLACEHOLDER,
      emoji: "📚",
      color: "from-primary/80 to-secondary/80",
    }
  );
}

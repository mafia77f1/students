// Per-subject target tracking via localStorage (per user)
// Key: study-target:{userId}:{subject} -> { targetMinutes, lastSessionId, lastUpdated }

export interface SubjectTarget {
  targetMinutes: number;
  lastSessionId?: string;
  lastUpdated: number; // ms epoch
}

const k = (userId: string, subject: string) => `study-target:${userId}:${subject}`;

export function getTarget(userId: string, subject: string): SubjectTarget | null {
  try {
    const raw = localStorage.getItem(k(userId, subject));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setTarget(userId: string, subject: string, t: SubjectTarget) {
  localStorage.setItem(k(userId, subject), JSON.stringify(t));
}

export function listTargets(userId: string, subjects: string[]): Record<string, SubjectTarget> {
  const out: Record<string, SubjectTarget> = {};
  for (const s of subjects) {
    const t = getTarget(userId, s);
    if (t) out[s] = t;
  }
  return out;
}

// Last opened book (per user)
const LAST_BOOK_KEY = (userId: string) => `last-book:${userId}`;
export function setLastBook(userId: string, subject: string) {
  localStorage.setItem(LAST_BOOK_KEY(userId), subject);
}
export function getLastBook(userId: string): string | null {
  return localStorage.getItem(LAST_BOOK_KEY(userId));
}

// Per-subject target tracking + resume state via localStorage (per user)

export interface SubjectTarget {
  targetMinutes: number;
  lastSessionId?: string;
  lastUpdated: number;
}

export interface ResumeState {
  subject: string;
  sessionId: string;
  round: number;
  roundSeconds: number;       // length of one focus round (sec)
  timeLeft: number;           // seconds remaining in current phase
  isBreak: boolean;
  studiedSeconds: number;     // total focus seconds banked
  breakSeconds: number;       // total break seconds banked
  savedAt: number;
}

const tk = (userId: string, subject: string) => `study-target:${userId}:${subject}`;
const rk = (userId: string, subject: string) => `study-resume:${userId}:${subject}`;
const LAST_BOOK_KEY = (userId: string) => `last-book:${userId}`;

export function getTarget(userId: string, subject: string): SubjectTarget | null {
  try {
    const raw = localStorage.getItem(tk(userId, subject));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setTarget(userId: string, subject: string, t: SubjectTarget) {
  localStorage.setItem(tk(userId, subject), JSON.stringify(t));
}

export function listTargets(userId: string, subjects: string[]): Record<string, SubjectTarget> {
  const out: Record<string, SubjectTarget> = {};
  for (const s of subjects) {
    const t = getTarget(userId, s);
    if (t) out[s] = t;
  }
  return out;
}

export function setResume(userId: string, state: ResumeState) {
  localStorage.setItem(rk(userId, state.subject), JSON.stringify(state));
}
export function getResume(userId: string, subject: string): ResumeState | null {
  try {
    const raw = localStorage.getItem(rk(userId, subject));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function clearResume(userId: string, subject: string) {
  localStorage.removeItem(rk(userId, subject));
}

export function setLastBook(userId: string, subject: string) {
  localStorage.setItem(LAST_BOOK_KEY(userId), subject);
}
export function getLastBook(userId: string): string | null {
  return localStorage.getItem(LAST_BOOK_KEY(userId));
}

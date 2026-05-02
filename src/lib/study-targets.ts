// Per-subject target tracking + resume state.
// Source of truth: Supabase (study_targets / study_resume / profiles.last_book).
// We keep a synchronous in-memory cache (hydrated on login) so existing UI
// code can read instantly, and writes are mirrored to Supabase in the background.

import { supabase } from "@/integrations/supabase/client";

export interface SubjectTarget {
  targetMinutes: number;
  lastSessionId?: string;
  lastUpdated: number;
}

export interface ResumeState {
  subject: string;
  sessionId: string;
  round: number;
  roundSeconds: number;
  timeLeft: number;
  isBreak: boolean;
  studiedSeconds: number;
  breakSeconds: number;
  savedAt: number;
}

// ---------- in-memory cache ----------
const targetsCache: Record<string, Record<string, SubjectTarget>> = {}; // userId -> subject -> target
const resumeCache: Record<string, Record<string, ResumeState>> = {};    // userId -> subject -> resume
const lastBookCache: Record<string, string | null> = {};                // userId -> subject

const lsTk = (u: string, s: string) => `study-target:${u}:${s}`;
const lsRk = (u: string, s: string) => `study-resume:${u}:${s}`;
const lsLast = (u: string) => `last-book:${u}`;

// ---------- hydration ----------
/** Load all cloud data for a user into the in-memory cache. */
export async function hydrateStudyState(userId: string, subjects: string[] = []) {
  if (!userId) return;
  targetsCache[userId] = targetsCache[userId] || {};
  resumeCache[userId] = resumeCache[userId] || {};

  // Seed from localStorage first (instant offline fallback)
  for (const s of subjects) {
    try {
      const t = localStorage.getItem(lsTk(userId, s));
      if (t) targetsCache[userId][s] = JSON.parse(t);
      const r = localStorage.getItem(lsRk(userId, s));
      if (r) resumeCache[userId][s] = JSON.parse(r);
    } catch { /* ignore */ }
  }
  lastBookCache[userId] = localStorage.getItem(lsLast(userId));

  // Then refresh from Supabase
  const [{ data: t }, { data: r }, { data: p }] = await Promise.all([
    supabase.from("study_targets").select("subject,target_minutes,last_session_id,updated_at").eq("user_id", userId),
    supabase.from("study_resume").select("*").eq("user_id", userId),
    supabase.from("profiles").select("last_book").eq("id", userId).maybeSingle(),
  ]);
  for (const row of (t as any[]) || []) {
    targetsCache[userId][row.subject] = {
      targetMinutes: row.target_minutes,
      lastSessionId: row.last_session_id ?? undefined,
      lastUpdated: new Date(row.updated_at).getTime(),
    };
  }
  for (const row of (r as any[]) || []) {
    resumeCache[userId][row.subject] = {
      subject: row.subject,
      sessionId: row.session_id,
      round: row.round,
      roundSeconds: row.round_seconds,
      timeLeft: row.time_left,
      isBreak: row.is_break,
      studiedSeconds: row.studied_seconds,
      breakSeconds: row.break_seconds,
      savedAt: new Date(row.saved_at).getTime(),
    };
  }
  if (p && (p as any).last_book !== undefined) {
    lastBookCache[userId] = (p as any).last_book ?? null;
  }
}

export function clearStudyCache(userId?: string) {
  if (!userId) return;
  delete targetsCache[userId];
  delete resumeCache[userId];
  delete lastBookCache[userId];
}

// ---------- targets ----------
export function getTarget(userId: string, subject: string): SubjectTarget | null {
  return targetsCache[userId]?.[subject] ?? null;
}

export function setTarget(userId: string, subject: string, t: SubjectTarget) {
  targetsCache[userId] = targetsCache[userId] || {};
  targetsCache[userId][subject] = t;
  try { localStorage.setItem(lsTk(userId, subject), JSON.stringify(t)); } catch { /* ignore */ }
  // Mirror to Supabase
  supabase.from("study_targets").upsert(
    {
      user_id: userId,
      subject,
      target_minutes: t.targetMinutes,
      last_session_id: t.lastSessionId ?? null,
    },
    { onConflict: "user_id,subject" }
  ).then(() => {});
}

export function listTargets(userId: string, subjects: string[]): Record<string, SubjectTarget> {
  const out: Record<string, SubjectTarget> = {};
  const bucket = targetsCache[userId] || {};
  for (const s of subjects) {
    if (bucket[s]) out[s] = bucket[s];
  }
  return out;
}

// ---------- resume ----------
export function setResume(userId: string, state: ResumeState) {
  resumeCache[userId] = resumeCache[userId] || {};
  resumeCache[userId][state.subject] = state;
  try { localStorage.setItem(lsRk(userId, state.subject), JSON.stringify(state)); } catch { /* ignore */ }
  supabase.from("study_resume").upsert(
    {
      user_id: userId,
      subject: state.subject,
      session_id: state.sessionId,
      round: state.round,
      round_seconds: state.roundSeconds,
      time_left: state.timeLeft,
      is_break: state.isBreak,
      studied_seconds: state.studiedSeconds,
      break_seconds: state.breakSeconds,
      saved_at: new Date(state.savedAt).toISOString(),
    },
    { onConflict: "user_id,subject" }
  ).then(() => {});
}

export function getResume(userId: string, subject: string): ResumeState | null {
  return resumeCache[userId]?.[subject] ?? null;
}

export function clearResume(userId: string, subject: string) {
  if (resumeCache[userId]) delete resumeCache[userId][subject];
  try { localStorage.removeItem(lsRk(userId, subject)); } catch { /* ignore */ }
  supabase.from("study_resume").delete().eq("user_id", userId).eq("subject", subject).then(() => {});
}

// ---------- last book ----------
export function setLastBook(userId: string, subject: string) {
  lastBookCache[userId] = subject;
  try { localStorage.setItem(lsLast(userId), subject); } catch { /* ignore */ }
  supabase.from("profiles").update({ last_book: subject }).eq("id", userId).then(() => {});
}

export function getLastBook(userId: string): string | null {
  return lastBookCache[userId] ?? null;
}

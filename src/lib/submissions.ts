/**
 * User submissions — localStorage-backed store for announcements submitted
 * through /submit (design/submit.md).
 *
 * There is no backend: submitted announcements live in localStorage and are
 * merged with the seed data from `src/data/announcements.ts` (which is never
 * modified). New submissions are "pending" until a Communications Office
 * admin approves them on /admin (`approveSubmission`); only APPROVED
 * submissions surface in the feeds via `getMergedAnnouncements()`.
 *
 * Also stores the in-progress submit-form draft ("Save draft" button).
 */
import { useEffect, useState } from "react";
import { ANNOUNCEMENTS, type Announcement } from "@/data/announcements";

const SUBMISSIONS_KEY = "student-notes.userSubmissions";
const DRAFT_KEY = "student-notes.submitDraft";

/** Moderation lifecycle: pending → approved (published) | rejected. */
export type SubmissionStatus = "pending" | "approved" | "rejected";

/** An announcement created via the submit form. */
export interface Submission extends Announcement {
  /** Display name of the submitting faculty member (from the auth provider). */
  submittedBy: string;
  /** ISO timestamp of when the form was submitted. */
  submittedAt: string;
  /** Selected audience checkboxes, e.g. ["Students", "Faculty"]. */
  audience: string[];
  /**
   * Moderation status. New submissions are "pending" (Communications Office
   * review on /admin); only "approved" ones merge into the public feeds.
   * Legacy "pending-review" values are normalized to "pending" on read.
   */
  status: SubmissionStatus;
}

/** The in-progress submit form state persisted by "Save draft". */
export interface SubmissionDraft {
  department: string;
  title: string;
  date: string;
  tag?: string;
  body: string;
  /** Image stored as a data URL so drafts/submissions survive reloads. */
  imageDataUrl?: string;
  audience: string[];
}

/* ------------------------------------------------------------------ */
/* Submissions                                                         */
/* ------------------------------------------------------------------ */

export function getSubmissions(): Submission[] {
  try {
    const raw = localStorage.getItem(SUBMISSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    // Normalize legacy "pending-review" values written by v2.
    return (parsed as Submission[]).map((s) => ({
      ...s,
      status:
        s.status === "approved" || s.status === "rejected" ? s.status : "pending",
    }));
  } catch {
    return [];
  }
}

function persist(list: Submission[]): void {
  try {
    localStorage.setItem(SUBMISSIONS_KEY, JSON.stringify(list));
  } catch {
    // localStorage full/blocked — the change still lives in memory.
  }
}

/** Append a submission (newest first) and persist. Returns the stored list. */
export function addSubmission(submission: Submission): Submission[] {
  const next = [{ ...submission, status: submission.status ?? "pending" }, ...getSubmissions()];
  persist(next);
  return next;
}

/** Set one submission's status; returns the updated list. */
function setStatus(id: string, status: SubmissionStatus): Submission[] {
  const next = getSubmissions().map((s) => (s.id === id ? { ...s, status } : s));
  persist(next);
  return next;
}

/** Admin queue action — publishing makes it visible in the public feeds. */
export function approveSubmission(id: string): Submission[] {
  return setStatus(id, "approved");
}

/** Admin queue action — rejected submissions never surface publicly. */
export function rejectSubmission(id: string): Submission[] {
  return setStatus(id, "rejected");
}

/** Submissions awaiting Communications Office review, newest first. */
export function getPendingSubmissions(): Submission[] {
  return getSubmissions().filter((s) => s.status === "pending");
}

/** Recently approved submissions, newest approval first (for the admin page). */
export function getApprovedSubmissions(): Submission[] {
  return getSubmissions().filter((s) => s.status === "approved");
}

/** Remove all user submissions (data controls / debugging). */
export function clearSubmissions(): void {
  try {
    localStorage.removeItem(SUBMISSIONS_KEY);
  } catch {
    /* noop */
  }
}

/**
 * Seed announcements merged with APPROVED user submissions only, sorted by
 * date desc (submissions win ties so fresh posts surface first). Pending and
 * rejected submissions stay invisible to students.
 */
export function getMergedAnnouncements(): Announcement[] {
  return [...getApprovedSubmissions(), ...ANNOUNCEMENTS].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
}

/**
 * React helper for the public feeds: reads `getMergedAnnouncements()` on
 * mount and re-reads on window focus + cross-tab `storage` events, so notes
 * approved on /admin appear as soon as the reader navigates back.
 */
export function useMergedAnnouncements(): Announcement[] {
  const [items, setItems] = useState<Announcement[]>(() => getMergedAnnouncements());
  useEffect(() => {
    const refresh = () => setItems(getMergedAnnouncements());
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  return items;
}

/* ------------------------------------------------------------------ */
/* Draft                                                               */
/* ------------------------------------------------------------------ */

export function saveDraft(draft: SubmissionDraft): void {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* noop */
  }
}

export function loadDraft(): SubmissionDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as SubmissionDraft) : null;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* noop */
  }
}

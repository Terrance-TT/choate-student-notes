/**
 * Admin — `/admin` (wired in App.tsx). The Communications Office moderation
 * queue, backed by the localStorage submission store (src/lib/submissions.ts).
 *
 * Guard (via the swappable AuthProvider from src/lib/auth.ts):
 *   - signed out          → the shared AuthStub account picker
 *   - signed in as faculty → polite "admin access only" card + switch account
 *   - signed in as admin   → pending queue with Approve / Reject, a
 *                            "Recently approved" list, and an empty state.
 *
 * Approving flips a submission to status "approved", which makes it surface
 * in every public feed via getMergedAnnouncements(). When school IT swaps in
 * the real Entra ID provider, admin rights come from security-group claims —
 * this screen stays exactly the same.
 */
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Toaster, toast } from "sonner";
import {
  Check,
  ChevronRight,
  Info,
  RefreshCcw,
  ShieldCheck,
  X,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { firstImage, getDepartment } from "@/data/announcements";
import { getAuthProvider, type User, type UserRole } from "@/lib/auth";
import {
  approveSubmission,
  getApprovedSubmissions,
  getPendingSubmissions,
  rejectSubmission,
  type Submission,
} from "@/lib/submissions";
import AuthStub from "@/components/submit/AuthStub";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/* ------------------------------------------------------------------ */
/* Teaching note — how moderation works here (demo vs production).     */
/* ------------------------------------------------------------------ */
function TeachingNote() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1, ease: EASE }}
      className="rounded-2xl border-2 border-gold-500 bg-gold-300/15 p-4"
    >
      <h2 className="flex items-center gap-2 font-display text-[1.0625rem] font-semibold text-navy-950">
        <Info className="h-5 w-5 shrink-0 text-gold-500" aria-hidden />
        How moderation works here
      </h2>
      <p className="mt-2 text-[0.875rem] leading-relaxed text-ink">
        In production, faculty submit notes → your Communications Office
        (admin) reviews them here → approved notes appear instantly in the
        student feed. In this demo, sign in as Demo Faculty on the Submit
        page, create a note, then switch to Demo Admin to approve it.
      </p>
      <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-soft">
        When IT connects Microsoft sign-in, admin rights come from your Entra
        ID security group — this screen stays exactly the same.
      </p>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/* Signed-in chip (same shape as the Submit page's).                   */
/* ------------------------------------------------------------------ */
function AccountChip({ user, onSwitch }: { user: User; onSwitch: () => void }) {
  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="mt-4 flex items-center gap-3 rounded-2xl border border-navy-900/10 bg-paper p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-900 font-display text-sm font-bold text-gold-500">
        {initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">{user.name}</span>
        <span className="meta-label block text-ink-soft" style={{ fontSize: "0.5625rem" }}>
          {user.role.toUpperCase()}
        </span>
      </span>
      <button
        type="button"
        onClick={onSwitch}
        className="flex min-h-[44px] shrink-0 items-center gap-1.5 px-2 text-sm font-medium text-choate-blue hover:underline"
      >
        <RefreshCcw className="h-3.5 w-3.5" aria-hidden />
        Switch account
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Pending submission card.                                            */
/* ------------------------------------------------------------------ */
function PendingCard({
  submission,
  index,
  onApprove,
  onReject,
}: {
  submission: Submission;
  index: number;
  onApprove: () => void;
  onReject: () => void;
}) {
  const dept = getDepartment(submission.department);
  const image = firstImage(submission);
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 32, transition: { duration: 0.25, ease: EASE } }}
      transition={{ duration: 0.4, delay: 0.15 + index * 0.06, ease: EASE }}
      className="overflow-hidden rounded-2xl border border-navy-900/10 bg-paper shadow-sm"
    >
      <div className="border-l-4 p-4" style={{ borderColor: dept.color }}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="meta-label" style={{ color: dept.color }}>
              {dept.name}
            </p>
            <h3 className="mt-1 font-display text-[1.125rem] font-semibold leading-tight text-navy-950">
              {submission.title}
            </h3>
          </div>
          {submission.tag && (
            <span
              className="meta-label shrink-0 rounded-full bg-event-red px-2.5 py-1 text-ivory"
              style={{ fontSize: "0.5625rem" }}
            >
              {submission.tag}
            </span>
          )}
        </div>

        <p className="meta-label mt-1.5 text-ink-soft" style={{ textTransform: "none", letterSpacing: "0.04em" }}>
          {submission.submittedBy} · {format(parseISO(submission.date), "EEE MMM d")} ·{" "}
          {submission.audience.join(", ")}
        </p>

        {/* full body preview */}
        <div className="mt-3 space-y-2.5">
          {submission.sections.map((s, i) => (
            <div key={i}>
              {s.heading && (
                <p className="flex items-center gap-1.5 text-sm font-semibold text-navy-950">
                  <span className="text-gold-500" aria-hidden>
                    ✦
                  </span>
                  {s.heading}
                </p>
              )}
              {s.body && (
                <p className="mt-0.5 text-[0.875rem] leading-relaxed text-ink">{s.body}</p>
              )}
            </div>
          ))}
        </div>

        {image && (
          <img
            src={image}
            alt="Submitted announcement graphic"
            className="mt-3 h-24 w-auto max-w-full rounded-xl border border-navy-900/10 object-cover"
          />
        )}

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onApprove}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-gold-500 text-sm font-semibold text-navy-950 transition-transform hover:bg-gold-400 active:scale-95"
          >
            <Check className="h-4 w-4" />
            Approve
          </button>
          <button
            type="button"
            onClick={onReject}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-event-red text-sm font-semibold text-event-red transition-colors hover:bg-event-red/10 active:scale-95"
          >
            <X className="h-4 w-4" />
            Reject
          </button>
        </div>
      </div>
    </motion.article>
  );
}

/* ------------------------------------------------------------------ */
/* Empty queue state — gold arch glyph.                                */
/* ------------------------------------------------------------------ */
function EmptyQueue() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="flex flex-col items-center rounded-2xl border border-dashed border-gold-500/50 bg-paper/60 px-6 py-10 text-center"
    >
      <svg
        viewBox="0 0 24 14"
        className="h-6 w-10 text-gold-500"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
      >
        <path d="M2 13 V8 C2 4 6 1.5 12 1.5 C18 1.5 22 4 22 8 V13" />
      </svg>
      <p className="mt-3 font-display text-lg font-semibold text-navy-950">All caught up</p>
      <p className="mt-1 text-sm text-ink-soft">
        Nothing waiting for review. New faculty submissions land here.
      </p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */

export default function Admin() {
  const [user, setUser] = useState<User | null>(() => getAuthProvider().getUser());
  const [signingIn, setSigningIn] = useState<UserRole | null>(null);
  const [pending, setPending] = useState<Submission[]>(() => getPendingSubmissions());
  const [approved, setApproved] = useState<Submission[]>(() => getApprovedSubmissions());

  const refreshQueue = useCallback(() => {
    setPending(getPendingSubmissions());
    setApproved(getApprovedSubmissions());
  }, []);

  // Re-read the store when returning to this tab (e.g. after submitting in
  // another tab) so the queue is never stale.
  useEffect(() => {
    window.addEventListener("focus", refreshQueue);
    window.addEventListener("storage", refreshQueue);
    return () => {
      window.removeEventListener("focus", refreshQueue);
      window.removeEventListener("storage", refreshQueue);
    };
  }, [refreshQueue]);

  const signIn = useCallback(async (role: UserRole) => {
    setSigningIn(role);
    try {
      setUser(await getAuthProvider().signIn(role));
    } finally {
      setSigningIn(null);
    }
  }, []);

  const switchAccount = useCallback(async () => {
    await getAuthProvider().signOut();
    setUser(null);
  }, []);

  const onApprove = (s: Submission) => {
    approveSubmission(s.id);
    refreshQueue();
    toast.success("Published — now visible in the feed", {
      description: `"${s.title}" is live for students.`,
    });
  };

  const onReject = (s: Submission) => {
    rejectSubmission(s.id);
    refreshQueue();
    toast.info("Submission rejected", {
      description: `"${s.title}" was removed from the queue.`,
    });
  };

  return (
    <div className="paper-grain min-h-[70dvh] px-5 pb-24 pt-6">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#0D2440",
            color: "#F7F3EA",
            border: "1px solid #13315C",
          },
        }}
      />

      {/* ---------------- header ---------------- */}
      <header>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="meta-label text-gold-500"
          style={{ color: "#9a7209" }}
        >
          Communications Office
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05, ease: EASE }}
          className="mt-1.5 font-display text-[2rem] font-bold leading-tight text-navy-950"
        >
          Review queue
        </motion.h1>
        {user && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: EASE }}
          >
            <AccountChip user={user} onSwitch={switchAccount} />
          </motion.div>
        )}
      </header>

      {/* ---------------- teaching note (always visible) ---------------- */}
      <div className="mt-5">
        <TeachingNote />
      </div>

      {/* ---------------- guarded body ---------------- */}
      <div className="mt-6">
        <AnimatePresence mode="wait" initial={false}>
          {!user ? (
            <motion.div
              key="signed-out"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <p className="meta-label mb-3 text-center text-ink-soft">
                Sign in to review submissions
              </p>
              {/* Reuse the shared stub screen (it owns the Entra ID docs). */}
              <div className="-mx-5">
                <AuthStub signingIn={signingIn} onSignIn={signIn} />
              </div>
            </motion.div>
          ) : user.role !== "admin" ? (
            <motion.div
              key="faculty"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="rounded-2xl border border-navy-900/10 bg-paper p-6 text-center shadow-sm"
            >
              <ShieldCheck className="mx-auto h-8 w-8 text-gold-500" aria-hidden />
              <h2 className="mt-3 font-display text-[1.25rem] font-semibold text-navy-950">
                Admin access only
              </h2>
              <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-soft">
                You&apos;re signed in as faculty. Switch to the Demo Admin
                account to review and approve submissions.
              </p>
              <button
                type="button"
                onClick={switchAccount}
                className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-navy-950 text-[0.9375rem] font-semibold text-ivory transition-colors hover:bg-navy-800 active:scale-[0.98]"
              >
                <RefreshCcw className="h-4 w-4" aria-hidden />
                Switch account
              </button>
              <Link
                to="/submit"
                className="mt-2 inline-flex min-h-[44px] items-center justify-center px-2 text-[0.875rem] font-medium text-choate-blue hover:underline"
              >
                Back to the Submit page →
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="queue"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <p className="meta-label flex items-center gap-2 text-ink-soft">
                <span className="h-1.5 w-1.5 rounded-full bg-gold-500" aria-hidden />
                {pending.length} awaiting review
              </p>

              <div className="mt-3 flex flex-col gap-4">
                <AnimatePresence mode="popLayout">
                  {pending.map((s, i) => (
                    <PendingCard
                      key={s.id}
                      submission={s}
                      index={i}
                      onApprove={() => onApprove(s)}
                      onReject={() => onReject(s)}
                    />
                  ))}
                </AnimatePresence>
                {pending.length === 0 && <EmptyQueue />}
              </div>

              {/* ---------------- recently approved ---------------- */}
              {approved.length > 0 && (
                <div className="mt-10">
                  <p className="meta-label text-gold-500" style={{ color: "#9a7209" }}>
                    Recently approved
                  </p>
                  <ul className="mt-1">
                    {approved.slice(0, 5).map((s, i) => (
                      <motion.li
                        key={s.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: i * 0.04 }}
                      >
                        <Link
                          to={`/departments?dept=${s.department}&note=${s.id}`}
                          className="group flex min-h-[44px] w-full items-center gap-3 border-b border-dotted border-navy-900/20 py-3 text-left"
                        >
                          <Check className="h-4 w-4 shrink-0 text-dept-green" aria-hidden />
                          <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-medium text-ink group-hover:text-navy-950">
                            {s.title}
                          </span>
                          <span className="meta-label shrink-0 text-ink-soft">
                            {format(parseISO(s.date), "MMM d")}
                          </span>
                          <ChevronRight className="h-4 w-4 shrink-0 text-ink-soft/60 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

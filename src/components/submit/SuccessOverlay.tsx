/**
 * Submit — success lifecycle (design/submit.md). Full-sheet overlay: gold
 * check circle draws itself (0.6s stroke animation), "Submitted for review",
 * moderation copy, and "View feed" / "Submit another" buttons sliding up
 * with a 0.08s stagger. A Sonner toast mirrors the confirmation (fired by
 * the parent on submit).
 */
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router";
import { ShieldCheck } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

export default function SuccessOverlay({ onSubmitAnother }: { onSubmitAnother: () => void }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="paper-grain fixed inset-0 z-[70] mx-auto flex w-full max-w-[480px] flex-col items-center justify-center px-8 text-center"
      role="status"
      aria-live="polite"
    >
      {/* Gold check circle — self-drawing stroke animation (0.6s). */}
      <motion.svg
        viewBox="0 0 72 72"
        className="h-20 w-20"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      >
        <motion.circle
          cx="36"
          cy="36"
          r="32"
          fill="none"
          stroke="#D4A017"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.6, ease: EASE }}
        />
        <motion.path
          d="M22 37.5 L31.5 47 L50 26"
          fill="none"
          stroke="#D4A017"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.4, delay: 0.45, ease: EASE }}
        />
      </motion.svg>

      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.5, ease: EASE }}
        className="mt-6 font-display text-[1.5rem] font-semibold text-navy-950"
      >
        Submitted for review
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.58, ease: EASE }}
        className="mt-2 max-w-xs text-[0.875rem] leading-relaxed text-ink-soft"
      >
        The Communications Office reviews submissions before they appear in
        Student Notes. You'll get an email when it's live.
      </motion.p>

      {/* Teaching note — how the demo mirrors production moderation. */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.62, ease: EASE }}
        className="mt-5 flex max-w-xs items-start gap-2.5 rounded-xl border border-gold-500/50 bg-gold-300/15 p-3 text-left"
      >
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold-500" aria-hidden />
        <p className="text-[0.8125rem] leading-relaxed text-ink-soft">
          In production, a Communications Office admin reviews your note before
          it appears. In this demo, switch to the Demo Admin account to approve
          it.{" "}
          <Link to="/admin" className="font-semibold text-choate-blue underline underline-offset-2">
            Open the review queue →
          </Link>
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.7, ease: EASE }}
        className="mt-8 flex w-full max-w-xs flex-col gap-3"
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-gold-500 text-[0.9375rem] font-semibold text-navy-950 shadow-sm transition-colors hover:bg-gold-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          View feed
        </button>
        <button
          type="button"
          onClick={onSubmitAnother}
          className="flex h-12 w-full items-center justify-center rounded-xl border border-navy-900/15 bg-transparent text-[0.9375rem] font-semibold text-navy-950 transition-colors hover:bg-navy-950/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
        >
          Submit another
        </button>
      </motion.div>
    </motion.div>
  );
}

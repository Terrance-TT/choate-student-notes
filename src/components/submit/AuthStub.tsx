/**
 * Submit/Admin — State A (unauthenticated): the DemoAuthProvider placeholder
 * screen (design/submit.md). A clearly-labeled sign-in stub with the
 * visually-flagged "AUTH PROVIDER: DEMO (STUB)" notice, TWO demo sign-in
 * options — Demo Faculty (submits notes) and Demo Admin (approves them on
 * /admin) — and a collapsible "For IT" accordion documenting the Microsoft
 * Entra ID (MSAL) swap path, where role comes from security-group claims
 * instead of these buttons. No Microsoft code ships — only the interface
 * and docs.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Cog, Loader2, PenLine, ShieldCheck, Wrench } from "lucide-react";
import type { UserRole } from "@/lib/auth";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const PROVIDER_SPEC = `interface AuthProvider {
  signIn(role?: UserRole): Promise<User>; // role = DEMO ONLY
  signOut(): Promise<void>;
  getUser(): User | null;         // { name, email, role: 'faculty' | 'admin' }
}
// Today:   DemoAuthProvider  (this stub — role picked by button)
// Later:   MsalAuthProvider  (@azure/msal-browser, Entra ID —
//           role derived from security-group claims)`;

const IT_STEPS = [
  "Register the app in the Microsoft Entra portal (single-tenant, Choate's directory).",
  "Install @azure/msal-browser.",
  "Implement MsalAuthProvider with PublicClientApplication (scopes: User.Read).",
  "Restrict access by faculty security group; map the Communications Office group to role 'admin' via group claims.",
  "Flip one config flag — no changes to this form or the admin queue.",
];

/** "Connecting" with a cycling ellipsis while the demo redirect runs. */
function ConnectingLabel() {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d % 3) + 1), 350);
    return () => clearInterval(t);
  }, []);
  return <span>Connecting{".".repeat(dots)}</span>;
}

/** Collapsible "For IT" accordion — height + opacity layout animation. */
function ForITAccordion() {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-6 w-full max-w-sm rounded-2xl border border-navy-900/10 bg-paper/70">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-[44px] w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="meta-label flex items-center gap-2 text-navy-900">
          <Wrench className="h-3.5 w-3.5 text-gold-500" />
          For IT — connect Microsoft Entra ID
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.25 }}>
          <ChevronDown className="h-4 w-4 text-ink-soft" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="it-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <pre className="overflow-x-auto rounded-xl bg-navy-950 p-3 font-mono text-[0.6875rem] leading-relaxed text-ivory/85">
                {PROVIDER_SPEC}
              </pre>
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[0.8125rem] leading-relaxed text-ink-soft">
                {IT_STEPS.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="mt-3 text-[0.8125rem] leading-relaxed text-ink-soft">
                Full prose version lives in{" "}
                <Link to="/about#it" className="font-medium text-choate-blue hover:underline">
                  About → IT integration guide
                </Link>
                .
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AuthStub({
  signingIn,
  onSignIn,
}: {
  /** Which demo account is mid-sign-in (null = idle). */
  signingIn: UserRole | null;
  onSignIn: (role: UserRole) => void;
}) {
  return (
    <div className="paper-grain flex min-h-[calc(100dvh-56px)] flex-col items-center justify-center px-5 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="w-full max-w-sm rounded-2xl border border-navy-900/10 bg-paper p-7 text-center shadow-lg shadow-navy-950/5"
      >
        <img src="/crest.svg" alt="Choate crest" className="mx-auto h-12 w-12" />

        <h1 className="mt-4 font-display text-[1.5rem] font-semibold text-navy-950">
          Faculty sign-in
        </h1>
        <p className="mt-2 text-[0.875rem] leading-relaxed text-ink-soft">
          Submitting announcements requires a faculty or admin account. Reading
          never does. Pick a demo account below — approve submissions with the
          admin one.
        </p>

        {/* Placeholder provider notice — pulsing dashed gold border signals
            "intentionally unfinished". */}
        <motion.div
          animate={{
            borderColor: [
              "rgba(212, 160, 23, 0.6)",
              "rgba(212, 160, 23, 1)",
              "rgba(212, 160, 23, 0.6)",
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="mt-5 rounded-xl border border-dashed bg-gold-300/20 p-3 text-left"
        >
          <p className="meta-label flex items-center gap-1.5 text-gold-500" style={{ color: "#9a7209" }}>
            <Cog className="h-3.5 w-3.5 shrink-0" />
            Auth provider: demo (stub)
          </p>
          <p className="mt-1.5 font-mono text-[0.6875rem] leading-relaxed text-ink-soft">
            This screen is a placeholder. School IT connects Microsoft Entra ID
            here — role then comes from your security groups, not these
            buttons. No Microsoft code is included yet.
          </p>
        </motion.div>

        {/* Demo account picker — two roles so the submit → review → publish
            loop can be rehearsed. Real Entra sign-in replaces both buttons. */}
        <button
          type="button"
          onClick={() => onSignIn("faculty")}
          disabled={signingIn !== null}
          className="mt-5 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-navy-950 text-[0.9375rem] font-semibold text-ivory shadow-sm transition-colors hover:bg-navy-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-80"
        >
          {signingIn === "faculty" ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <ConnectingLabel />
            </>
          ) : (
            <>
              <PenLine className="h-5 w-5" />
              Continue as Demo Faculty
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => onSignIn("admin")}
          disabled={signingIn !== null}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border-2 border-gold-500 text-[0.9375rem] font-semibold text-navy-950 transition-colors hover:bg-gold-500/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-60"
        >
          {signingIn === "admin" ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <ConnectingLabel />
            </>
          ) : (
            <>
              <ShieldCheck className="h-5 w-5 text-gold-500" />
              Continue as Demo Admin
            </>
          )}
        </button>
        <p className="meta-label mt-2 text-ink-soft/70">
          not connected to Microsoft — demo mode
        </p>

        <div className="mt-2 border-t border-navy-900/8 pt-4">
          <Link
            to="/about#it"
            className="inline-flex min-h-[44px] items-center justify-center px-2 text-[0.8125rem] font-medium text-ink-soft hover:text-choate-blue"
          >
            IT: how to connect our real identity system →
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.12, ease: EASE }}
        className="flex w-full max-w-sm justify-center"
      >
        <ForITAccordion />
      </motion.div>
    </div>
  );
}

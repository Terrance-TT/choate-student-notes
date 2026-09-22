/**
 * About — `/about` (design/about.md).
 * What Student Notes is, why reading needs no sign-in (before/after story),
 * how the feed is organized, and the deep-linkable `#it` inverted technical
 * insert: the school-IT handoff guide for swapping the DemoAuthProvider for
 * Microsoft Entra ID (MSAL). Footer is rendered by Layout.
 */
import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const BEFORE_STEPS = [
  "Open email link",
  "Sign in",
  "Authenticate",
  "Find the right tab",
  "Expand each department row…",
];

const ORG_ROWS = [
  {
    lead: "Digest first",
    line: "An AI digest lists every club, event, and happening by title at the top. Sixty seconds and you're caught up.",
  },
  {
    lead: "Departments second",
    line: "The same groupings the Communications Office already uses — no re-learning.",
  },
  {
    lead: "Detail on tap",
    line: "Every note expands into a full sheet with flyers, dates, and add-to-calendar.",
  },
];

const NOT_DONE = [
  "No Microsoft SDK bundled",
  "No tenant IDs hardcoded",
  "No tokens stored beyond the provider's own cache",
  "Reading never gated",
];

/** Inline code chip for the inverted IT section. */
function Code({ children }: { children: string }) {
  return (
    <code className="whitespace-nowrap rounded bg-navy-900 px-1.5 py-0.5 font-mono text-[0.8125rem] text-gold-300">
      {children}
    </code>
  );
}

/* ------------------------------------------------------------------ */
/* Section 1 — header                                                  */
/* ------------------------------------------------------------------ */
function PageHeader() {
  const items = [
    <p key="eyebrow" className="meta-label text-gold-500">
      About
    </p>,
    <h1 key="title" className="mt-1.5 font-display text-[2rem] font-bold leading-tight text-navy-950">
      Student Notes, rebuilt for students.
    </h1>,
    <p key="sub" className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">
      Choate Rosemary Hall's weekly announcements — open to everyone, readable
      in one glance.
    </p>,
  ];
  return (
    <header className="px-5 pt-6">
      {items.map((node, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.08, ease: EASE }}
        >
          {node}
        </motion.div>
      ))}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Section 2 — "Why no sign-in?" before/after                          */
/* ------------------------------------------------------------------ */
function WhyPublic() {
  return (
    <section className="px-5 pt-10">
      <h2 className="font-display text-[1.375rem] font-semibold text-navy-950">
        Why no sign-in?
      </h2>

      <div className="mt-5">
        {/* Before — the old gated flow */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="rounded-2xl border border-ink-soft/30 bg-paper p-5"
        >
          <p className="meta-label text-ink-soft">Before</p>
          <ol className="mt-3 space-y-2">
            {BEFORE_STEPS.map((s, i) => (
              <li key={s} className="flex items-baseline gap-3">
                <span className="meta-label shrink-0 text-ink-soft">{i + 1}.</span>
                <span className="text-[0.9375rem] text-ink-soft line-through decoration-ink-soft/50">
                  {s}
                </span>
              </li>
            ))}
          </ol>
        </motion.div>

        {/* gold arrow drawn between the two cards */}
        <svg
          viewBox="0 0 24 48"
          className="mx-auto my-2 h-12 w-6 text-gold-500"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <motion.path
            d="M12 3 V38 M5 32 L12 41 L19 32"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.4, ease: EASE }}
          />
        </svg>

        {/* After — the new public flow */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, delay: 0.15, ease: EASE }}
          className="rounded-2xl border-2 border-gold-500 bg-paper p-5"
        >
          <p className="meta-label text-gold-500">
            <span aria-hidden>✦</span> After
          </p>
          <p className="mt-3 flex items-baseline gap-3">
            <span className="meta-label shrink-0 text-gold-500">1.</span>
            <span className="font-display text-[1.125rem] font-semibold text-navy-950">
              Open the link → you're reading.
            </span>
          </p>
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.4, delay: 0.1, ease: EASE }}
        className="mt-6 text-[0.9375rem] leading-[1.65] text-ink"
      >
        Announcements are not secrets. Requiring authentication to read a lunch
        menu or a blood-drive time kept information from the students it was
        meant for. Student Notes is public to read, and always will be. Only
        submitting requires an account.
      </motion.p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section 3 — "How it's organized"                                    */
/* ------------------------------------------------------------------ */
function HowOrganized() {
  return (
    <section className="px-5 pt-10">
      <h2 className="font-display text-[1.375rem] font-semibold text-navy-950">
        How it's organized
      </h2>
      <div className="mt-5 space-y-4">
        {ORG_ROWS.map((row, i) => (
          <motion.div
            key={row.lead}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, delay: i * 0.1, ease: EASE }}
            className="flex items-start gap-4 rounded-2xl border border-navy-900/8 bg-paper p-4"
          >
            <motion.span
              initial={{ scale: 0.8 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                delay: i * 0.1 + 0.1,
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold-500 font-mono text-sm font-semibold text-navy-950"
            >
              {i + 1}
            </motion.span>
            <div className="min-w-0">
              <p className="font-display text-base font-semibold text-navy-950">
                {row.lead}
              </p>
              <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink-soft">
                {row.line}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section 4 — #it — IT integration guide (inverted technical insert)  */
/* ------------------------------------------------------------------ */
function CodeCard() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="mt-4 overflow-x-auto rounded-xl bg-navy-900 p-4"
    >
      <pre className="font-mono text-[0.8125rem] leading-relaxed">
        <span className="text-ivory/40">
          {"// src/lib/auth.ts — the only interface IT needs to satisfy"}
        </span>
        {"\n"}
        <span className="text-blue-400">interface</span>{" "}
        <span className="text-gold-300">AuthProvider</span>{" "}
        <span className="text-ivory/70">{"{"}</span>
        {"\n  "}
        <span className="text-ivory">signIn</span>
        <span className="text-ivory/70">(): </span>
        <span className="text-blue-400">Promise</span>
        <span className="text-ivory/70">{"<"}</span>
        <span className="text-gold-300">User</span>
        <span className="text-ivory/70">{">;"}</span>
        {"\n  "}
        <span className="text-ivory">signOut</span>
        <span className="text-ivory/70">(): </span>
        <span className="text-blue-400">Promise</span>
        <span className="text-ivory/70">{"<"}</span>
        <span className="text-gold-300">void</span>
        <span className="text-ivory/70">{">;"}</span>
        {"\n  "}
        <span className="text-ivory">getUser</span>
        <span className="text-ivory/70">(): </span>
        <span className="text-gold-300">User</span>
        <span className="text-ivory/70">{" | null;"}</span>{" "}
        <span className="text-ivory/40">
          {"// { name, email, role: 'faculty' | 'admin' }"}
        </span>
        {"\n"}
        <span className="text-ivory/70">{"}"}</span>
        <span
          aria-hidden
          className="ml-1 inline-block h-3.5 w-[7px] animate-caret-blink bg-gold-500 align-middle"
          style={{ animationDuration: "1s" }}
        />
      </pre>
    </motion.div>
  );
}

function MsalSteps() {
  const steps = [
    <>
      Register a <strong className="font-semibold text-ivory">single-page application</strong>{" "}
      in the Microsoft Entra admin center (redirect URI = this site's{" "}
      <Code>/submit</Code> route).
    </>,
    <>
      <Code>npm install @azure/msal-browser</Code>
    </>,
    <>
      Implement <Code>MsalAuthProvider</Code> wrapping{" "}
      <Code>PublicClientApplication</Code> (<Code>loginPopup</Code> or{" "}
      <Code>loginRedirect</Code>, scopes <Code>["User.Read"]</Code>).
    </>,
    <>
      Map the signed-in account to <Code>User</Code>; restrict to the
      faculty/admin security group via group claims or an allow-list.
    </>,
    <>
      Set the provider in one line of config:{" "}
      <Code>setAuthProvider(new MsalAuthProvider(msalConfig))</Code> — see{" "}
      <Code>src/lib/auth.ts</Code>.
    </>,
  ];
  return (
    <ol className="mt-4 space-y-4">
      {steps.map((s, i) => (
        <li key={i} className="flex items-start gap-3">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 20,
              delay: i * 0.06,
            }}
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold-500 font-mono text-xs font-semibold text-navy-950"
          >
            {i + 1}
          </motion.span>
          <p className="min-w-0 text-[0.9375rem] leading-[1.65] text-ivory/80">
            {s}
          </p>
        </li>
      ))}
    </ol>
  );
}

function ItGuide({ pulse }: { pulse: boolean }) {
  return (
    <div className="px-5 pt-10">
      <motion.section
        id="it"
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5, ease: EASE }}
        animate={
          pulse
            ? {
                borderColor: [
                  "rgba(212,160,23,0)",
                  "rgba(212,160,23,1)",
                  "rgba(212,160,23,0.35)",
                ],
                transition: { duration: 1.2, times: [0, 0.4, 1], ease: "easeOut" },
              }
            : { borderColor: "rgba(212,160,23,0)" }
        }
        className="scroll-mt-20 rounded-3xl border-2 border-transparent bg-navy-950 px-6 py-8"
      >
        <p className="meta-label text-gold-400">For school IT</p>
        <h2 className="mt-2 font-display text-[1.375rem] font-semibold text-ivory">
          IT Integration Guide
        </h2>
        <p className="mt-2 text-[0.9375rem] leading-[1.65] text-ivory/70">
          Reading never requires an account. The only gated surface is the{" "}
          <Code>/submit</Code> flow — and its authentication is a single
          swappable interface, not a vendor lock-in.
        </p>

        {/* 4.1 — where auth plugs in */}
        <h3 className="meta-label mt-8 text-gold-300">01 · Where auth plugs in</h3>
        <CodeCard />
        <p className="mt-4 text-[0.9375rem] leading-[1.65] text-ivory/70">
          Today this interface is satisfied by <Code>DemoAuthProvider</Code>.
          The submit form, route guard, and signed-in UI already consume it —
          swap the provider, keep everything else.
        </p>

        {/* 4.2 — connecting Microsoft Entra ID */}
        <h3 className="meta-label mt-8 text-gold-300">
          02 · Connecting Microsoft Entra ID (recommended)
        </h3>
        <MsalSteps />

        {/* 4.3 — deliberately not done */}
        <h3 className="meta-label mt-8 text-gold-300">
          03 · What we deliberately did not do
        </h3>
        <ul className="mt-4 space-y-2.5">
          {NOT_DONE.map((item) => (
            <li key={item} className="flex items-baseline gap-2.5">
              <span className="shrink-0 text-gold-500" aria-hidden>
                ✦
              </span>
              <span className="text-[0.9375rem] leading-relaxed text-ivory/80">
                {item}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[0.9375rem] leading-[1.65] text-ivory/70">
          No Microsoft code ships with this site — only the interface above and
          these notes.
        </p>

        {/* 4.4 — contact card */}
        <div className="mt-8 flex items-center gap-3 rounded-xl border border-navy-800 bg-navy-900 p-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-500/10">
            <Mail className="h-5 w-5 text-gold-400" />
          </span>
          <p className="meta-label leading-relaxed text-ivory/70">
            Communications Office · communications@choate.edu-style placeholder ·
            IT Services
          </p>
        </div>
      </motion.section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section 5 — credits / colophon                                      */
/* ------------------------------------------------------------------ */
function Colophon() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="flex flex-col items-center px-5 pb-16 pt-12 text-center"
    >
      <img src="/crest.svg" alt="" className="h-8 w-8" />
      <p className="mt-3 text-[0.9375rem] text-ink">
        Built for the Choate community{" "}
        <span className="text-gold-500" aria-hidden>
          ✦
        </span>{" "}
        Blue &amp; gold, always.
      </p>
      <p className="meta-label mt-2 text-ink-soft">
        Student Notes v1.0 · React + Tailwind
      </p>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */

export default function About() {
  const { hash } = useLocation();
  const [pulse, setPulse] = useState(false);

  // `/about#it` deep link: smooth-scroll to the IT insert, then pulse its
  // gold border once (design/about.md §4).
  useEffect(() => {
    if (hash !== "#it") return;
    const t = setTimeout(() => {
      document.getElementById("it")?.scrollIntoView({ behavior: "smooth", block: "start" });
      setPulse(true);
    }, 200);
    return () => clearTimeout(t);
  }, [hash]);

  return (
    <div className="paper-grain min-h-[70dvh]">
      <PageHeader />
      <WhyPublic />
      <HowOrganized />
      <ItGuide pulse={pulse} />
      <Colophon />
    </div>
  );
}

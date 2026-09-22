/**
 * Placeholder pages — scaffold only. The page agents replace each of these
 * with the full implementations per design.md §11 (digest.md, departments.md,
 * submit.md, settings.md, about.md).
 */
import type { ReactNode } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

function Shell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="hero-gradient min-h-[60dvh] px-5 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="meta-label text-gold-300">{eyebrow}</p>
        <h1 className="mt-2 font-display text-[2rem] font-bold text-ivory">{title}</h1>
        <div className="mt-4 text-[0.9375rem] leading-relaxed text-ivory/75">{children}</div>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-ivory/30 px-5 py-2.5 text-sm font-semibold text-ivory hover:border-gold-500/60 hover:text-gold-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
      </motion.div>
    </div>
  );
}

export function DigestPage() {
  return (
    <Shell eyebrow="✦ AI Digest" title="This Week's Digest">
      <p>
        Full AI digest of every club, event, and happening by title, grouped by
        department — with regenerate and copy/share controls. Coming soon.
      </p>
    </Shell>
  );
}

export function DepartmentsPage() {
  return (
    <Shell eyebrow="Browse" title="Departments">
      <p>
        Browse the archive by department — index cards leading into filtered
        feeds of every announcement. Coming soon.
      </p>
    </Shell>
  );
}

export function SubmitPage() {
  return (
    <Shell eyebrow="Faculty" title="Submit an Announcement">
      <p>
        Announcement submission, gated by the modular auth provider (demo
        sign-in now, Microsoft Entra ID when school IT connects it). Coming
        soon.
      </p>
    </Shell>
  );
}

export function SettingsPage() {
  return (
    <Shell eyebrow="Configure" title="Settings">
      <p>
        AI provider configuration (base URL, API key, model), digest cache, and
        data controls. Coming soon.
      </p>
    </Shell>
  );
}

export function AboutPage() {
  return (
    <Shell eyebrow="About" title="About Student Notes">
      <p>
        Why Student Notes is public, how the AI digest works, and the IT
        integration guide (<span className="text-gold-300">#it</span>) for
        swapping in Microsoft auth. Coming soon.
      </p>
    </Shell>
  );
}

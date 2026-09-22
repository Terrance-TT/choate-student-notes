/**
 * Footer — design.md §7.7. Dark navy, gold arch line-art, links,
 * "No sign-in required to read — ever." tagline, IT handoff link.
 */
import { Link } from "react-router";

const LINKS = [
  { label: "Digest", to: "/digest" },
  { label: "Departments", to: "/departments" },
  { label: "Submit", to: "/submit" },
  { label: "Settings", to: "/settings" },
  { label: "About", to: "/about" },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-navy-950 pb-28 pt-12 md:pb-12">
      {/* gold arch line-art, stroke-draws on entry */}
      <svg
        viewBox="0 0 480 120"
        className="draw-on pointer-events-none absolute inset-x-0 top-0 mx-auto w-72 text-gold-500/40"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden
        style={{ ["--draw-len" as string]: "900" }}
      >
        <path d="M60 120 V70 C60 30 140 8 240 8 C340 8 420 30 420 70 V120" />
        <path d="M100 120 V76 C100 46 160 28 240 28 C320 28 380 46 380 76 V120" />
        <path d="M0 120 H480" />
      </svg>

      <div className="relative flex flex-col items-center px-6 pt-16 text-center">
        <img src="/crest.svg" alt="" className="h-9 w-9" />
        <p className="mt-3 font-display text-lg font-semibold text-ivory">
          Choate Rosemary Hall · Student Notes
        </p>
        <p className="meta-label mt-2 text-gold-300">
          No sign-in required to read — ever.
        </p>

        <nav aria-label="Footer" className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm text-ivory/60 underline-offset-4 hover:text-gold-300 hover:underline"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <Link
          to="/about#it"
          className="meta-label mt-8 rounded-full border border-gold-500/40 px-5 py-2.5 text-gold-400 hover:border-gold-500 hover:text-gold-300"
        >
          Faculty &amp; IT →
        </Link>
        <p className="meta-label mt-6 text-ivory/30">
          Wallingford, Connecticut
        </p>
      </div>
    </footer>
  );
}

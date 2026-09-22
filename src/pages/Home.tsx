/**
 * Home — `/` public landing (design/home.md).
 * Dark hero with huge CHOATE type → titles-only summary card → Footer
 * (rendered by Layout). The full announcement detail lives on `/digest`
 * and `/departments` — this page is intentionally just the front door.
 */
import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router";
import {
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { type Announcement } from "@/data/announcements";
import { useMergedAnnouncements } from "@/lib/submissions";
import DetailSheet from "@/components/DetailSheet";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/* ------------------------------------------------------------------ */
/* Gold dust particle field — the page's single canvas effect.         */
/* Isolated + memoized; paused when the hero leaves the viewport.      */
/* ------------------------------------------------------------------ */
const ParticleField = memo(function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 40 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.8 + Math.random() * 1.4,
      speed: 0.0004 + Math.random() * 0.0009,
      phase: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 0.0002,
    }));

    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(canvas);

    let raf = 0;
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (!visible) return;
      const { width: w, height: h } = canvas;
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        const y = (((p.y + t * p.speed) % 1.2) - 0.1) * h;
        const x = (p.x + Math.sin(t * 0.0004 + p.phase) * 0.02 + t * p.drift) * w;
        const alpha = reduced ? 0.35 : 0.2 + 0.4 * (0.5 + 0.5 * Math.sin(t * 0.001 + p.phase));
        ctx.beginPath();
        ctx.arc(x, y, p.r * devicePixelRatio, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232, 185, 60, ${alpha.toFixed(3)})`;
        ctx.fill();
      }
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      aria-hidden
    />
  );
});

/* ------------------------------------------------------------------ */
/* Section 1 — Hero / Masthead                                        */
/* ------------------------------------------------------------------ */
function Hero({ items }: { items: Announcement[] }) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  // Parallax: content 0.4×, arches 0.15×, fade to 0.3 (design/home.md §1)
  const contentY = useTransform(scrollYProgress, [0, 1], [0, 240]);
  const archY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const fade = useTransform(scrollYProgress, [0, 1], [1, 0.3]);

  const noteCount = items.length;
  const deptCount = new Set(items.map((a) => a.department)).size;

  return (
    <section ref={ref} className="hero-gradient relative flex min-h-[72dvh] flex-col overflow-hidden">
      {/* gold arch line-art, draws itself on load */}
      <motion.img
        src="/hero-arch.svg"
        alt=""
        className="draw-on pointer-events-none absolute bottom-0 left-1/2 w-[160%] max-w-none -translate-x-1/2 opacity-25"
        style={{ y: archY, ["--draw-len" as string]: "2400" }}
      />
      <ParticleField />

      <motion.div
        style={{ y: contentY, opacity: fade }}
        className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-16 text-center"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="relative"
        >
          <img src="/crest.svg" alt="Choate crest" className="h-14 w-14" />
          {/* slow shine sweep across the crest */}
          <motion.span
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                "linear-gradient(115deg, transparent 30%, rgba(245,214,123,0.5) 50%, transparent 70%)",
              backgroundSize: "250% 100%",
              mixBlendMode: "screen",
            }}
            animate={{ backgroundPosition: ["120% 0%", "-120% 0%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: EASE }}
          className="meta-label mt-5 text-gold-300"
        >
          Choate Rosemary Hall · Student Notes
        </motion.p>

        {/* CHOATE — character-level split animation. `whitespace-nowrap` +
            a conservative clamp guarantee the word never breaks mid-word,
            even at 320px (6 chars of Fraunces 900 ≈ 207px at 14.5vw). */}
        <h1
          className="gold-shimmer-text mt-2 whitespace-nowrap font-display font-black leading-none"
          style={{ fontSize: "clamp(2.75rem, 14.5vw, 5.5rem)", letterSpacing: "0.02em", perspective: 600 }}
          aria-label="CHOATE"
        >
          {"CHOATE".split("").map((ch, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ y: 60, rotateX: -40, opacity: 0 }}
              animate={{ y: 0, rotateX: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 + i * 0.05, ease: EASE }}
              aria-hidden
            >
              {ch}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7, ease: EASE }}
          className="mt-4 text-[0.9375rem] text-ivory/80"
        >
          Every announcement. No sign-in. One glance.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.78, ease: EASE }}
          className="meta-label mt-3 text-gold-300"
        >
          Week of Wed Sep 16 · {noteCount} notes · {deptCount} departments
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.9, ease: EASE }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            to="/digest"
            className="flex h-12 items-center gap-2 rounded-full bg-gold-500 px-6 text-sm font-semibold text-navy-950 transition-transform hover:bg-gold-400 active:scale-[0.96]"
          >
            <Sparkles className="h-4 w-4" /> Today&apos;s Digest
          </Link>
        </motion.div>
      </motion.div>

      {/* gold hairline + arch glyph divider */}
      <div className="relative z-10 flex items-center gap-3 px-6 pb-5">
        <span className="h-px flex-1 bg-gold-500/30" />
        <svg viewBox="0 0 24 14" className="h-3.5 w-6 text-gold-500" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path d="M2 13 V8 C2 4 6 1.5 12 1.5 C18 1.5 22 4 22 8 V13" />
        </svg>
        <span className="h-px flex-1 bg-gold-500/30" />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Section 2 — Summary card: titles only, straight from the data.      */
/* No AI call — each title deep-links into the shared DetailSheet.     */
/* ------------------------------------------------------------------ */
const SUMMARY_TITLE_COUNT = 5;

function SummaryCard({
  items,
  onOpen,
}: {
  items: Announcement[];
  onOpen: (a: Announcement) => void;
}) {
  const preview = useMemo(
    () =>
      [...items]
        .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
        .slice(0, SUMMARY_TITLE_COUNT),
    [items],
  );
  const more = Math.max(0, items.length - preview.length);

  return (
    <section id="digest-preview" className="bg-navy-950 px-5 pb-12 pt-2">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="gold-shimmer-border rounded-2xl p-px"
      >
        <div className="rounded-2xl bg-navy-900 p-5">
          <div className="flex items-center justify-between">
            <p className="meta-label flex items-center gap-2 text-gold-500">
              <motion.span
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                aria-hidden
              >
                ✦
              </motion.span>
              Summary
            </p>
            <span className="meta-label rounded-full bg-navy-800 px-2.5 py-1 text-gold-300">
              Sep 16
            </span>
          </div>

          <motion.p
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: 0.15, ease: EASE }}
            className="mt-4 text-base font-medium leading-relaxed text-ivory"
          >
            {preview.map((a, i) => (
              <span key={a.id}>
                {i > 0 && <span className="text-ivory/40">, </span>}
                <button
                  onClick={() => onOpen(a)}
                  className="group inline text-left font-semibold text-gold-300 transition-colors hover:text-gold-400 active:text-gold-400"
                >
                  <span className="relative">
                    {a.title}
                    <span
                      className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-gold-300 transition-transform duration-300 group-hover:scale-x-100 group-active:scale-x-100"
                      aria-hidden
                    />
                  </span>
                </button>
              </span>
            ))}
            {more > 0 && <span className="text-ivory/40">, …</span>}
          </motion.p>

          <div className="mt-4 flex items-center justify-between border-t border-navy-800 pt-3">
            <span className="meta-label text-ivory/50">
              {more > 0 ? `+${more} more` : ""}
            </span>
            <Link
              to="/digest"
              className="group flex items-center gap-1 text-sm font-semibold text-gold-400 hover:text-gold-300"
            >
              View full digest
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/** Small gold arch divider — keeps the hero → summary → footer rhythm. */
function ArchDivider() {
  return (
    <div className="flex items-center gap-3 bg-navy-950 px-6 pb-10" aria-hidden>
      <span className="h-px flex-1 bg-gold-500/20" />
      <svg
        viewBox="0 0 24 14"
        className="h-3.5 w-6 text-gold-500/70"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M2 13 V8 C2 4 6 1.5 12 1.5 C18 1.5 22 4 22 8 V13" />
      </svg>
      <span className="h-px flex-1 bg-gold-500/20" />
    </div>
  );
}

/* ------------------------------------------------------------------ */

export default function Home() {
  const [open, setOpen] = useState<Announcement | null>(null);
  // Seeds + APPROVED submissions; re-reads on focus so newly approved notes
  // appear when the reader navigates back from /admin.
  const items = useMergedAnnouncements();
  return (
    <>
      <Hero items={items} />
      <SummaryCard items={items} onOpen={setOpen} />
      <ArchDivider />
      <DetailSheet announcement={open} onClose={() => setOpen(null)} />
    </>
  );
}

/**
 * AI Digest — `/digest` (design/digest.md).
 *
 * The "60-second brief": every club, event, and happening by title, grouped
 * by department, on the app's signature dark-navy surface. Generation,
 * caching, and the local fallback all live in `@/lib/ai`; this page renders
 * the result with regenerate + copy/share controls and deep-links each line
 * into the shared DetailSheet.
 */
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  Newspaper,
  RefreshCw,
  Share2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  DEPARTMENTS,
  type Announcement,
  type Department,
} from "@/data/announcements";
import {
  getAIConfig,
  getDigest,
  hasApiKey,
  type DigestResult,
} from "@/lib/ai";
import { useMergedAnnouncements } from "@/lib/submissions";
import DetailSheet from "@/components/DetailSheet";
import {
  getDigestStyle,
  getIncludedDepartments,
  type DigestStyle,
} from "@/components/settings/prefs";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/* ------------------------------------------------------------------ */
/* Perpetual animations — isolated + memoized (perf guardrail).        */
/* ------------------------------------------------------------------ */

/** Gold ✦ in the title — slowly rotates (20s loop). */
const RotatingSparkle = memo(function RotatingSparkle() {
  return (
    <motion.span
      className="inline-block text-gold-500"
      animate={{ rotate: 360 }}
      transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      aria-hidden
    >
      ✦
    </motion.span>
  );
});

/** Centered gold ✦ pulsing over the skeleton. */
const PulsingSparkle = memo(function PulsingSparkle() {
  return (
    <motion.span
      className="text-2xl text-gold-500"
      animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.1, 0.85] }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    >
      ✦
    </motion.span>
  );
});

/* ------------------------------------------------------------------ */
/* Skeleton — 6 shimmer lines (navy-800, gradient sweep 1.4s loop).    */
/* ------------------------------------------------------------------ */

const SKELETON_WIDTHS = ["88%", "72%", "80%", "64%", "76%", "58%"];

function DigestSkeleton() {
  return (
    <div className="py-6" aria-busy="true" aria-label="Generating digest">
      <div className="flex justify-center pb-5">
        <PulsingSparkle />
      </div>
      <div className="space-y-3.5">
        {SKELETON_WIDTHS.map((w, i) => (
          <div
            key={i}
            className="relative h-4 overflow-hidden rounded-full bg-navy-800"
            style={{ width: w }}
          >
            <motion.div
              className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-ivory/10 to-transparent"
              animate={{ x: ["-100%", "220%"] }}
              transition={{
                duration: 1.4,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.08,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Line → announcement matching (deep links into the DetailSheet).     */
/* ------------------------------------------------------------------ */

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function matchAnnouncement(line: string, items: Announcement[]): Announcement | undefined {
  const lead = norm(line.split("—")[0] ?? line);
  const whole = norm(line);
  return items.find((a) => {
    if (whole.includes(norm(a.title))) return true;
    if (lead.length >= 8 && norm(a.title).includes(lead)) return true;
    return a.sections.some((s) => {
      if (!s.heading) return false;
      const h = norm(s.heading);
      return lead.length >= 6 && (lead.includes(h) || h.includes(lead));
    });
  });
}

/** Strip a trailing "· EVENT" marker — the tag is rendered as a pill. */
function stripEventSuffix(line: string, isEvent: boolean): string {
  return isEvent ? line.replace(/\s*[·\-—]?\s*EVENT\s*$/i, "") : line;
}

/* ------------------------------------------------------------------ */
/* Department block — collapsible, staggered cascade.                  */
/* ------------------------------------------------------------------ */

/** Gold, underlined-on-hover title that opens the DetailSheet. */
function TitleLink({
  title,
  isEvent,
  match,
  onOpen,
}: {
  title: string;
  isEvent: boolean;
  match: Announcement | undefined;
  onOpen: (a: Announcement) => void;
}) {
  return (
    <button
      onClick={() => match && onOpen(match)}
      disabled={!match}
      className="group inline text-left font-semibold text-gold-300 transition-colors hover:text-gold-400 active:text-gold-400 disabled:cursor-default disabled:text-ivory"
    >
      <span className="relative">
        {title}
        <span
          className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-gold-300 transition-transform duration-300 group-hover:scale-x-100 group-active:scale-x-100"
          aria-hidden
        />
      </span>
      {match && (
        <ChevronRight
          className="ml-0.5 inline-block h-3.5 w-3.5 -translate-y-px text-gold-500"
          aria-hidden
        />
      )}
      {isEvent && (
        <span className="meta-label ml-2 inline-block -translate-y-px rounded-full bg-event-red px-2 py-0.5 text-ivory" style={{ fontSize: "0.5625rem" }}>
          EVENT
        </span>
      )}
    </button>
  );
}

function DepartmentBlock({
  group,
  index,
  collapsed,
  style,
  items,
  onToggle,
  onOpen,
}: {
  group: DigestResult["groups"][number];
  index: number;
  collapsed: boolean;
  style: DigestStyle;
  items: Announcement[];
  onToggle: () => void;
  onOpen: (a: Announcement) => void;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.1, ease: EASE }}
      className="border-l-2 border-gold-500 pl-4"
    >
      <button
        onClick={onToggle}
        aria-expanded={!collapsed}
        className="flex min-h-[44px] w-full items-center gap-3 text-left"
      >
        <span
          className="meta-label shrink-0"
          style={{ color: group.color }}
        >
          {group.departmentName}
        </span>
        <span className="h-px flex-1 bg-ivory/10" aria-hidden />
        <motion.span
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="text-ivory/50"
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="lines"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            {style === "summary" ? (
              /* Summary — titles only, comma-separated inline flow. */
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 + 0.1, ease: EASE }}
                className="pb-1 pt-1 text-base leading-loose text-ivory"
              >
                {group.lines.map((rawLine, li) => {
                  const match = matchAnnouncement(rawLine, items);
                  const isEvent = match?.tag === "EVENT";
                  const title = stripEventSuffix(rawLine, isEvent).replace(/\s*—\s*.*$/, "");
                  return (
                    <span key={`${li}-${rawLine.slice(0, 24)}`}>
                      {li > 0 && <span className="text-ivory/40">, </span>}
                      <TitleLink title={title} isEvent={isEvent} match={match} onOpen={onOpen} />
                    </span>
                  );
                })}
              </motion.p>
            ) : (
              /* Digest — title + one-sentence per item. */
              <ul>
                {group.lines.map((rawLine, li) => {
                  const match = matchAnnouncement(rawLine, items);
                  const isEvent = match?.tag === "EVENT";
                  const line = stripEventSuffix(rawLine, isEvent);
                  const [title, ...rest] = line.split(" — ");
                  const clause = rest.join(" — ");
                  return (
                    <motion.li
                      key={`${li}-${rawLine.slice(0, 24)}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.1 + 0.1 + li * 0.05,
                        ease: EASE,
                      }}
                      className="flex items-start gap-2.5"
                    >
                      <motion.span
                        className="mt-[0.7em] h-px w-3 shrink-0 origin-left bg-gold-500"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{
                          duration: 0.3,
                          delay: index * 0.1 + 0.15 + li * 0.05,
                          ease: EASE,
                        }}
                        aria-hidden
                      />
                      <div className="min-h-[44px] flex-1 py-2 text-base font-medium leading-snug text-ivory">
                        <TitleLink
                          title={title ?? line}
                          isEvent={isEvent}
                          match={match}
                          onOpen={onOpen}
                        />
                        {clause && (
                          <span className="text-ivory/75"> — {clause}</span>
                        )}
                      </div>
                    </motion.li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/* "Show all" — full-text view (third view mode layered over both      */
/* digest styles): every announcement's complete sections, inline.     */
/* ------------------------------------------------------------------ */

function FullTextView({
  groups,
  onOpen,
}: {
  groups: { dept: Department; items: Announcement[] }[];
  onOpen: (a: Announcement) => void;
}) {
  return (
    <div className="space-y-9 pb-2">
      {groups.map(({ dept, items }, gi) => (
        <motion.section
          key={dept.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: gi * 0.08, ease: EASE }}
        >
          <header className="flex items-center gap-3">
            <span className="meta-label shrink-0" style={{ color: dept.color }}>
              {dept.name}
            </span>
            <span className="h-px flex-1 bg-ivory/10" aria-hidden />
            <span className="meta-label shrink-0 text-ivory/40">{items.length}</span>
          </header>

          <div className="mt-4 space-y-8 border-l-2 pl-4" style={{ borderColor: dept.color }}>
            {items.map((a, i) => (
              <motion.article
                key={a.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: gi * 0.08 + 0.08 + i * 0.05, ease: EASE }}
              >
                {/* Title stays a gold deep-link into the DetailSheet. */}
                <h3 className="font-display text-[1.25rem] leading-snug">
                  <TitleLink title={a.title} isEvent={false} match={a} onOpen={onOpen} />
                  {a.tag && (
                    <span
                      className="meta-label ml-2 inline-block -translate-y-px rounded-full bg-event-red px-2 py-0.5 align-middle text-ivory"
                      style={{ fontSize: "0.5625rem" }}
                    >
                      {a.tag}
                    </span>
                  )}
                </h3>
                <p className="meta-label mt-1 text-ivory/45">
                  {format(parseISO(a.date), "EEE MMM d").toUpperCase()}
                </p>

                {a.sections.map((s, si) => (
                  <div key={si} className="mt-3.5">
                    {s.heading && (
                      <h4 className="flex items-center gap-2 font-display text-base font-semibold text-ivory">
                        <span className="text-gold-500" aria-hidden>
                          ✦
                        </span>
                        {s.heading}
                      </h4>
                    )}
                    {s.body && (
                      <p className="mt-1.5 text-[0.9375rem] leading-[1.65] text-ivory/85">
                        {s.body}
                      </p>
                    )}
                    {s.image && (
                      <figure className="mt-3">
                        <img
                          src={s.image}
                          alt={s.imageCaption ?? s.heading ?? a.title}
                          className="w-full rounded-xl border border-navy-800 object-cover"
                        />
                        {s.imageCaption && (
                          <figcaption
                            className="meta-label mt-2 text-ivory/45"
                            style={{ textTransform: "none", letterSpacing: "0.04em" }}
                          >
                            {s.imageCaption}
                          </figcaption>
                        )}
                      </figure>
                    )}
                  </div>
                ))}
              </motion.article>
            ))}
          </div>
        </motion.section>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Digest() {
  const [digest, setDigest] = useState<DigestResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiFailed, setAiFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [spinKey, setSpinKey] = useState(0);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<Announcement | null>(null);
  // "Show all" — full-text view mode, layered over both digest styles.
  const [showAll, setShowAll] = useState(false);

  const included = useMemo(() => getIncludedDepartments(), []);
  const cfg = getAIConfig();

  // Seeds + APPROVED submissions (re-read on mount/focus via the hook), so
  // notes approved on /admin join the digest when the reader returns.
  const merged = useMergedAnnouncements();
  const digestItems = useMemo(
    () => merged.filter((a) => included.has(a.department)),
    [merged, included],
  );
  // Content signature — the digest reload effect keys on this, NOT on the
  // array identity, so a plain window focus never flashes the skeleton.
  const itemsSig = useMemo(
    () => digestItems.map((a) => `${a.id}:${a.date}`).join("|"),
    [digestItems],
  );

  // Digest-style pref from Settings — honored live: re-read on mount,
  // on window focus, and on cross-tab `storage` events. Changing it
  // re-runs `load` below (style is part of the digest cache key, so a
  // previously generated style resolves instantly from cache).
  const [style, setStyle] = useState<DigestStyle>(() => getDigestStyle());

  useEffect(() => {
    const refresh = () => setStyle(getDigestStyle());
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const load = useCallback(
    async (force: boolean) => {
      setLoading(true);
      const result = await getDigest({ force, items: digestItems, style });
      setDigest(result);
      // A key is configured but we still got the local summarizer → the
      // endpoint failed and lib/ai already fell back automatically.
      setAiFailed(hasApiKey() && !result.aiGenerated);
      setLoading(false);
    },
    [digestItems, style],
  );

  useEffect(() => {
    let live = true;
    setLoading(true);
    getDigest({ items: digestItems, style }).then((result) => {
      if (!live) return;
      setDigest(result);
      setAiFailed(hasApiKey() && !result.aiGenerated);
      setLoading(false);
    });
    return () => {
      live = false;
    };
    // itemsSig stands in for digestItems (same content ⇒ same sig) so a
    // window-focus identity change alone doesn't retrigger the skeleton.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsSig, style]);

  const onRegenerate = () => {
    if (loading) return;
    setSpinKey((k) => k + 1);
    void load(true);
  };

  const deptIds = useMemo(() => new Set(DEPARTMENTS.map((d) => d.id)), []);
  const groups = useMemo(
    () =>
      (digest?.groups ?? []).filter(
        (g) => !deptIds.has(g.department) || included.has(g.department),
      ),
    [digest, deptIds, included],
  );

  // Full-text view: every included announcement, canonical department order.
  const fullGroups = useMemo(
    () =>
      DEPARTMENTS.map((d) => ({
        dept: d,
        items: digestItems
          .filter((a) => a.department === d.id)
          .sort((a, b) => Date.parse(b.date) - Date.parse(a.date)),
      })).filter((g) => g.items.length > 0),
    [digestItems],
  );

  const digestText = useCallback(() => {
    if (!digest) return "";
    const body = groups
      .map(
        (g) =>
          `${g.departmentName.toUpperCase()}\n${g.lines
            .map((l) => `✦ ${l}`)
            .join("\n")}`,
      )
      .join("\n\n");
    return `CHOATE STUDENT NOTES — THE DIGEST\nWeek of Wed Sep 16\n\n${body}`;
  }, [digest, groups]);

  const onCopyShare = async () => {
    const text = digestText();
    if (!text) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "The Digest — Choate Student Notes", text });
        return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return; // user cancelled
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — no-op
    }
  };

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const generatedTime = digest
    ? format(parseISO(digest.generatedAt), "h:mm a")
    : "";

  return (
    <div className="hero-gradient px-5 pb-12 pt-8">
      {/* ---------------- Section 1 — header ---------------- */}
      <header>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="meta-label text-gold-300"
        >
          Week of Wed Sep 16
        </motion.p>

        <h1 className="mt-2 font-display text-[2rem] font-bold text-ivory">
          {["The", "Digest"].map((word, i) => (
            <span key={word} className="inline-block overflow-hidden pb-1 align-bottom">
              <motion.span
                className="inline-block"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: EASE }}
              >
                {word}
                {i === 0 && "\u00A0"}
              </motion.span>
            </span>
          ))}{" "}
          <motion.span
            className="inline-block"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
          >
            <RotatingSparkle />
          </motion.span>
        </h1>

        {/* status row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          className="meta-label mt-3 flex items-center gap-2"
        >
          {digest?.aiGenerated ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-dept-green" aria-hidden />
              <span className="text-ivory/70">
                AI generated · {cfg.model} · {generatedTime}
              </span>
            </>
          ) : (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-gold-500" aria-hidden />
              <Link to="/settings" className="text-gold-300 underline-offset-2 hover:underline">
                Local summary · add API key in Settings for AI
              </Link>
            </>
          )}
        </motion.div>

        {/* action row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4, ease: EASE }}
          className="mt-5 flex gap-2"
        >
          <button
            onClick={onRegenerate}
            disabled={loading}
            className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full bg-gold-500 text-[0.8125rem] font-semibold text-navy-950 transition-transform active:scale-95 disabled:opacity-80"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <motion.span
                key={spinKey}
                animate={spinKey > 0 ? { rotate: 360 } : undefined}
                transition={{ duration: 0.6, ease: EASE }}
                className="inline-flex"
              >
                <RefreshCw className="h-4 w-4" />
              </motion.span>
            )}
            {loading ? "Summarizing…" : "Regenerate"}
          </button>
          <button
            onClick={onCopyShare}
            disabled={!digest || loading || showAll}
            className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full border border-ivory/40 text-[0.8125rem] font-semibold text-ivory transition-colors hover:border-gold-500/70 hover:text-gold-300 active:scale-95 disabled:opacity-50"
          >
            {copied ? <Check className="h-4 w-4 text-gold-400" /> : <Share2 className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy / Share"}
          </button>
          {/* Third view mode: expand every announcement to its full text,
              inline, on this same dark surface. Works over both styles. */}
          <button
            onClick={() => setShowAll((v) => !v)}
            aria-pressed={showAll}
            className="flex h-12 flex-1 items-center justify-center gap-1.5 rounded-full border border-gold-500 text-[0.8125rem] font-semibold text-gold-300 transition-colors hover:bg-gold-500/10 hover:text-gold-400 active:scale-95"
          >
            {showAll ? (
              <Newspaper className="h-4 w-4" />
            ) : (
              <BookOpen className="h-4 w-4" />
            )}
            {showAll ? "Back to digest" : "Show all"}
          </button>
        </motion.div>
      </header>

      {/* error / fallback notice */}
      <AnimatePresence>
        {aiFailed && !loading && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-5 overflow-hidden text-sm leading-relaxed text-ivory/70"
          >
            Couldn&apos;t reach the AI provider — showing local summary instead.{" "}
            <Link to="/settings" className="text-gold-400 underline underline-offset-2">
              Check Settings →
            </Link>
          </motion.p>
        )}
      </AnimatePresence>

      {/* ---------------- Section 2 — digest body / show-all ---------------- */}
      <div className="py-6">
        <AnimatePresence mode="wait" initial={false}>
          {showAll ? (
            <motion.div
              key="full-text"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="overflow-hidden"
            >
              <FullTextView groups={fullGroups} onOpen={setOpen} />
            </motion.div>
          ) : (
            <motion.div
              key="digest-lines"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="overflow-hidden"
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="skeleton"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, transition: { duration: 0.2 } }}
                  >
                    <DigestSkeleton />
                  </motion.div>
                ) : (
                  <motion.div
                    key={`${digest?.generatedAt ?? "empty"}-${digest?.aiGenerated ?? false}-${style}`}
                    exit={{
                      opacity: 0,
                      x: -8,
                      transition: { duration: 0.2 },
                    }}
                    className="space-y-6"
                  >
                    {groups.map((g, gi) => (
                      <DepartmentBlock
                        key={g.department}
                        group={g}
                        index={gi}
                        collapsed={collapsed.has(g.department)}
                        style={style}
                        items={digestItems}
                        onToggle={() => toggle(g.department)}
                        onOpen={setOpen}
                      />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ---------------- Section 3 — "How this works" ---------------- */}
      <motion.aside
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="gold-shimmer-border rounded-2xl p-px"
      >
        <div className="rounded-2xl bg-navy-900 p-5">
          <h2 className="font-display text-[1.125rem] font-semibold text-ivory">
            Powered by your own key
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ivory/75">
            This digest is generated from the week&apos;s Student Notes using any
            OpenAI-compatible API. Your base URL, key, and model are stored only
            on this device — never on our servers. No key? We fall back to a
            built-in local summary.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              to="/settings"
              className="group flex items-center gap-1 text-sm font-semibold text-gold-400 underline-offset-4 decoration-gold-500 hover:text-gold-300 hover:underline"
            >
              Configure in Settings
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/about"
              className="group flex items-center gap-1 text-sm font-semibold text-ivory/60 underline-offset-4 hover:text-gold-300 hover:underline"
            >
              About the project
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </motion.aside>

      {/* deep-link target — the shared announcement bottom sheet */}
      <DetailSheet announcement={open} onClose={() => setOpen(null)} />
    </div>
  );
}

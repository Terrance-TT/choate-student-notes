/**
 * Top bar — design.md §7.1 — plus the search overlay (§7.6).
 * Sticky inside the phone shell; compresses 56px → 48px on scroll down.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { Search, X, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { DEPARTMENTS, getDepartment, previewText } from "@/data/announcements";
import { getMergedAnnouncements } from "@/lib/submissions";

const RECENT_KEY = "student-notes.recentSearches";

function getRecents(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function pushRecent(q: string) {
  const next = [q, ...getRecents().filter((r) => r !== q)].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

/** Full-screen navy search overlay (§7.6). */
function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [recents, setRecents] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    // Reset + focus after the slide-down animation starts.
    const t = setTimeout(() => {
      setRecents(getRecents());
      setQuery("");
      inputRef.current?.focus();
    }, 120);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    // Seeds + approved submissions, read fresh each time the overlay opens.
    return getMergedAnnouncements().filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.sections.some((s) => s.body.toLowerCase().includes(q) || s.heading?.toLowerCase().includes(q)) ||
        getDepartment(a.department).name.toLowerCase().includes(q),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, open]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof results>();
    for (const r of results) {
      const list = map.get(r.department) ?? [];
      list.push(r);
      map.set(r.department, list);
    }
    return DEPARTMENTS.filter((d) => map.has(d.id)).map((d) => ({
      dept: d,
      items: map.get(d.id)!,
    }));
  }, [results]);

  const go = (path: string) => {
    if (query.trim()) {
      pushRecent(query.trim());
      setRecents(getRecents());
    }
    onClose();
    navigate(path);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] mx-auto flex w-full max-w-[480px] flex-col bg-navy-950/95 backdrop-blur-md"
          initial={{ y: "-100%" }}
          animate={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={{ top: 0, bottom: 0.4 }}
          onDragEnd={(_, info) => {
            if (info.offset.y > 90 || info.velocity.y > 500) onClose();
          }}
        >
          <div className="flex items-center gap-3 px-5 pt-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-0 top-1/2 h-5 w-5 -translate-y-1/2 text-gold-500" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes, clubs, events…"
                className="w-full border-b border-gold-500/40 bg-transparent py-3 pl-8 pr-2 font-display text-xl text-ivory caret-gold-500 placeholder:text-ivory/40 focus:border-gold-500 focus:outline-none"
              />
            </div>
            <button
              onClick={onClose}
              aria-label="Close search"
              className="flex h-11 w-11 items-center justify-center rounded-full text-ivory/70 hover:bg-navy-800 hover:text-ivory"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-24 pt-6">
            {query.trim() === "" && recents.length > 0 && (
              <div>
                <p className="meta-label text-gold-300">Recent searches</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {recents.map((r) => (
                    <button
                      key={r}
                      onClick={() => setQuery(r)}
                      className="rounded-full border border-navy-800 px-4 py-2 text-sm text-ivory/80 hover:border-gold-500/50 hover:text-ivory"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {query.trim() !== "" && grouped.length === 0 && (
              <p className="mt-8 text-center text-sm text-ivory/50">
                No notes match “{query}”.
              </p>
            )}

            {grouped.map(({ dept, items }) => (
              <div key={dept.id} className="mt-6 first:mt-0">
                <p className="meta-label flex items-center gap-2" style={{ color: dept.color }}>
                  <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: dept.color }} />
                  {dept.name}
                </p>
                <ul className="mt-2 divide-y divide-navy-800/60">
                  {items.map((a) => (
                    <li key={a.id}>
                      <button
                        onClick={() => go(`/departments?dept=${a.department}&note=${a.id}`)}
                        className="flex w-full items-center gap-3 py-3 text-left"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-display text-[1.05rem] font-semibold text-ivory">
                            {a.title}
                          </span>
                          <span className="block truncate text-xs text-ivory/50">
                            {previewText(a)}
                          </span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-gold-500" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [compact, setCompact] = useState(false);
  const { scrollY } = useScroll();
  const lastY = useRef(0);

  useMotionValueEvent(scrollY, "change", (y) => {
    const goingDown = y > lastY.current;
    lastY.current = y;
    setCompact(y > 64 && goingDown);
    if (y < 32) setCompact(false);
  });

  const today = format(new Date(), "EEE MMM d").toUpperCase();

  return (
    <>
      <motion.header
        className="sticky top-0 z-50 border-b border-navy-800/60 bg-navy-950/85 backdrop-blur-md"
        animate={{ height: compact ? 48 : 56 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex h-full items-center justify-between px-5">
          <Link to="/" className="flex min-w-0 items-center gap-2.5">
            <img src="/crest.svg" alt="Choate crest" className="h-7 w-7 shrink-0" />
            <span className="truncate font-display text-base font-semibold text-ivory">
              Student Notes
            </span>
            <span className="shrink-0 text-gold-500" aria-hidden>
              ✦
            </span>
            <span className="meta-label hidden shrink-0 text-gold-300 min-[380px]:inline">
              {today}
            </span>
          </Link>
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="flex h-11 w-11 items-center justify-center rounded-full text-ivory/80 hover:bg-navy-800 hover:text-gold-300"
          >
            <Search className="h-5 w-5" />
          </button>
        </div>
      </motion.header>
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

/**
 * Departments — `/departments` (design/departments.md).
 * Accent-coded department index cards that drill in to per-department feeds
 * with an animated view swap. Deep-linkable via `?dept=…&note=…` — the
 * Navbar search overlay and DetailSheet share links both land here. A `note`
 * param opens the shared DetailSheet. Below the week's notes: an "Earlier
 * notes" dotted-rule archive and a Submit CTA. Footer is rendered by Layout.
 */
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ChevronRight, PenLine, Search } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  DEPARTMENTS,
  type Announcement,
  type Department,
} from "@/data/announcements";
import { useMergedAnnouncements } from "@/lib/submissions";
import { ARCHIVE, archiveFor } from "@/components/departments/archive";
import AnnouncementCard from "@/components/AnnouncementCard";
import DetailSheet from "@/components/DetailSheet";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

/** Contact lines shown on each index card (Plex Mono, uppercase). */
const CONTACTS: Record<string, string> = {
  "student-academic-life": "From the Head of Student and Academic Life, Will Gilyard",
  "student-activities": "From the Student Activities Office",
  "clubs-organizations": "From the Clubs & Organizations Office",
  "student-services-kiosk": "From Student Services",
  arts: "From the Arts Department Office",
  athletics: "From the Athletics Department",
};

/**
 * The global search overlay lives inside the Navbar's internal state. Rather
 * than duplicating it, the nudge banner activates the Navbar's own search
 * button (the single source of truth for the overlay).
 */
function openGlobalSearch() {
  document
    .querySelector<HTMLButtonElement>('header button[aria-label="Search"]')
    ?.click();
}

/* ------------------------------------------------------------------ */
/* Section 1 — page header                                             */
/* ------------------------------------------------------------------ */
function PageHeader({ noteCount }: { noteCount: number }) {
  const items = [
    <p key="eyebrow" className="meta-label text-gold-500">
      Archive
    </p>,
    <h1 key="title" className="mt-1.5 font-display text-[2rem] font-bold leading-tight text-navy-950">
      Departments
    </h1>,
    <p key="sub" className="mt-2 text-[0.9375rem] leading-relaxed text-ink-soft">
      Every note from every office, organized the way the Communications
      Office publishes them.
    </p>,
    <p key="stats" className="meta-label mt-4 text-ink-soft">
      {DEPARTMENTS.length} departments · {noteCount} notes this
      week · Updated Wed Sep 16
    </p>,
  ];
  return (
    <header className="px-5 pt-6">
      {items.map((node, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: i * 0.08, ease: EASE }}
        >
          {node}
        </motion.div>
      ))}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Section 2 — department index cards                                  */
/* ------------------------------------------------------------------ */
function IndexCard({
  dept,
  notes,
  index,
  onOpen,
}: {
  dept: Department;
  notes: Announcement[];
  index: number;
  onOpen: () => void;
}) {
  const latest = notes[0];
  return (
    <motion.button
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 + index * 0.07, ease: EASE }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpen}
      className="group relative w-full overflow-hidden rounded-2xl border border-navy-900/8 bg-paper py-4 pl-6 pr-4 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      {/* 6px accent bar — shared element that morphs into the detail header band */}
      <motion.span
        layoutId={`dept-bar-${dept.id}`}
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ background: dept.color }}
        transition={{ duration: 0.4, ease: EASE }}
      />
      {/* watermark dot pattern in the accent color at 6% opacity */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-12 h-44 w-44 rounded-full"
        style={{
          backgroundImage: `radial-gradient(${dept.color} 1.4px, transparent 1.4px)`,
          backgroundSize: "13px 13px",
          opacity: 0.06,
        }}
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-[1.375rem] font-semibold leading-tight text-navy-950">
              {dept.name}
            </h3>
            <p className="meta-label mt-1 text-ink-soft">{CONTACTS[dept.id]}</p>
          </div>
          <span
            className="meta-label mt-1 shrink-0 rounded-full px-2.5 py-1"
            style={{ background: `${dept.color}1F`, color: dept.color }}
          >
            {notes.length} note{notes.length === 1 ? "" : "s"}
          </span>
        </div>

        {latest && (
          <p className="mt-2.5 truncate text-[0.9375rem] text-ink">
            <span className="text-ink-soft">This week: </span>
            {latest.title}
          </p>
        )}

        <div className="mt-1.5 flex justify-end">
          <ChevronRight
            className="h-5 w-5 transition-transform group-hover:translate-x-0.5"
            style={{ color: dept.color }}
          />
        </div>
      </div>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* Section 4 — search nudge banner                                     */
/* ------------------------------------------------------------------ */
function SearchNudge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.4, ease: EASE }}
      className="relative mt-10 overflow-hidden rounded-2xl bg-navy-900 px-6 py-7 text-center"
    >
      <span className="meta-label text-gold-500" aria-hidden>
        ✦
      </span>
      <h3 className="mt-2 font-display text-[1.375rem] font-semibold text-ivory">
        Looking for something specific?
      </h3>
      <p className="mt-1.5 text-sm text-ivory/60">
        Search every note from every department — titles, flyers, and all.
      </p>
      <button
        onClick={openGlobalSearch}
        className="mt-4 inline-flex h-11 items-center gap-2 rounded-full bg-gold-500 px-6 text-sm font-semibold text-navy-950 transition-transform hover:bg-gold-400 active:scale-95"
      >
        <Search className="h-4 w-4" />
        Search all notes
      </button>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Section 3 — department detail view (in-page drill-in)               */
/* ------------------------------------------------------------------ */
function DeptDetail({
  dept,
  notes,
  onBack,
  onOpenNote,
}: {
  dept: Department;
  notes: Announcement[];
  onBack: () => void;
  onOpenNote: (a: Announcement) => void;
}) {
  const archive = archiveFor(dept.id);
  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24, transition: { duration: 0.25, ease: EASE } }}
      transition={{ duration: 0.35, delay: 0.05, ease: EASE }}
    >
      {/* accent band — morphs from the index card's left bar via layoutId */}
      <motion.div
        layoutId={`dept-bar-${dept.id}`}
        className="h-3 w-full"
        style={{ background: dept.color }}
        transition={{ duration: 0.4, ease: EASE }}
      />

      <div className="flex items-center gap-2 px-5 pt-4">
        <button
          onClick={onBack}
          aria-label="Back to all departments"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-navy-950 transition-colors hover:bg-navy-900/5"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h2 className="truncate font-display text-xl font-semibold text-navy-950">
            {dept.name}
          </h2>
          <p className="meta-label mt-0.5 text-ink-soft">Wed Sep 16</p>
        </div>
      </div>

      {/* this week's feed — same cards + bottom-sheet behavior as home */}
      <div className="mt-5 flex flex-col gap-3 px-5">
        {notes.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.06, ease: EASE }}
          >
            <AnnouncementCard
              announcement={a}
              onOpen={onOpenNote}
              layoutIdPrefix={`dept-${dept.id}-`}
            />
          </motion.div>
        ))}
        {notes.length === 0 && (
          <p className="py-6 text-center text-sm text-ink-soft">
            No notes from this office this week.
          </p>
        )}
      </div>

      {/* "Earlier notes" — compact dotted-rule archive */}
      <div className="mt-10 px-5">
        <p className="meta-label text-gold-500">Earlier notes</p>
        <ul>
          {archive.map((a, i) => (
            <motion.li
              key={a.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 + i * 0.04 }}
            >
              <button
                onClick={() => onOpenNote(a)}
                className="group flex w-full items-center gap-3 border-b border-dotted border-navy-900/20 py-3.5 text-left"
              >
                <span className="min-w-0 flex-1 truncate text-[0.9375rem] font-medium text-ink group-hover:text-navy-950">
                  {a.title}
                </span>
                <span className="meta-label shrink-0 text-ink-soft">
                  {format(parseISO(a.date), "MMM d")}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-soft/60 transition-transform group-hover:translate-x-0.5" />
              </button>
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Submit CTA */}
      <Link
        to="/submit"
        className="mx-5 mt-10 flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-gold-500 font-display text-base font-semibold text-navy-950 transition-colors hover:bg-gold-500/10 active:scale-[0.98]"
      >
        <PenLine className="h-4 w-4 text-gold-500" />
        Submit an announcement
        <ArrowRight className="h-4 w-4 text-gold-500" />
      </Link>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */

export default function Departments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const deptParam = searchParams.get("dept");
  const noteParam = searchParams.get("note");

  // Seeds + APPROVED submissions (re-read on mount/focus), so notes approved
  // on /admin appear here when the reader navigates back.
  const announcements = useMergedAnnouncements();
  const allNotes = useMemo<Announcement[]>(
    () => [...announcements, ...ARCHIVE],
    [announcements],
  );

  // `?note=…` opens the shared DetailSheet (search overlay + share links).
  const openNote = useMemo(
    () => (noteParam ? allNotes.find((a) => a.id === noteParam) ?? null : null),
    [noteParam, allNotes],
  );

  // Active department: explicit ?dept=…, or inferred from the open note so a
  // bare `?note=…` deep link lands on that department's feed behind the sheet.
  const dept = useMemo(() => {
    if (deptParam) {
      const d = DEPARTMENTS.find((x) => x.id === deptParam);
      if (d) return d;
    }
    if (openNote) {
      const d = DEPARTMENTS.find((x) => x.id === openNote.department);
      if (d) return d;
    }
    return null;
  }, [deptParam, openNote]);

  const notesByDept = useMemo(() => {
    const map = new Map<string, Announcement[]>();
    for (const d of DEPARTMENTS) {
      map.set(
        d.id,
        announcements.filter((a) => a.department === d.id).sort(
          (a, b) => Date.parse(b.date) - Date.parse(a.date),
        ),
      );
    }
    return map;
  }, [announcements]);

  const openDept = (id: string) => setSearchParams({ dept: id });
  const showNote = (a: Announcement) =>
    setSearchParams({ dept: a.department, note: a.id });
  const closeNote = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("note");
    setSearchParams(next, { replace: true });
  };
  const goBack = () => setSearchParams({});

  return (
    <div className="paper-grain min-h-[70dvh] pb-16">
      <PageHeader noteCount={announcements.length} />

      <LayoutGroup>
        <AnimatePresence mode="wait">
          {dept ? (
            <DeptDetail
              key="detail"
              dept={dept}
              notes={notesByDept.get(dept.id) ?? []}
              onBack={goBack}
              onOpenNote={showNote}
            />
          ) : (
            <motion.div
              key="index"
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24, transition: { duration: 0.25, ease: EASE } }}
              transition={{ duration: 0.35, delay: 0.05, ease: EASE }}
              className="px-5 pt-8"
            >
              <div className="flex flex-col gap-3">
                {DEPARTMENTS.map((d, i) => (
                  <IndexCard
                    key={d.id}
                    dept={d}
                    notes={notesByDept.get(d.id) ?? []}
                    index={i}
                    onOpen={() => openDept(d.id)}
                  />
                ))}
              </div>
              <SearchNudge />
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>

      <DetailSheet announcement={openNote} onClose={closeNote} />
    </div>
  );
}

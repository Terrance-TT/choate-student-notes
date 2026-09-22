/**
 * Detail bottom sheet — design.md §7.5. Thumb-friendly full announcement
 * view: springs up from bottom, drag-to-dismiss, share + calendar footer.
 */
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Share2, CalendarPlus, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { format, parseISO } from "date-fns";
import { getDepartment, type Announcement } from "@/data/announcements";

function share(a: Announcement) {
  const text = `${a.title} — Choate Student Notes`;
  const url = `${window.location.origin}/departments?note=${a.id}`;
  if (navigator.share) {
    navigator.share({ title: a.title, text, url }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(`${text}\n${url}`).catch(() => {});
  }
}

export default function DetailSheet({
  announcement,
  onClose,
}: {
  announcement: Announcement | null;
  onClose: () => void;
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (announcement) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [announcement, onClose]);

  const dept = announcement ? getDepartment(announcement.department) : null;

  return (
    <AnimatePresence>
      {announcement && dept && (
        <>
          <motion.div
            className="fixed inset-0 z-[80] bg-navy-950/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[90] mx-auto flex h-[92dvh] w-full max-w-[480px] flex-col rounded-t-3xl bg-paper shadow-2xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
          >
            {/* drag handle */}
            <div className="flex justify-center pt-3">
              <div className="h-1.5 w-10 rounded-full bg-navy-900/15" />
            </div>

            {/* header */}
            <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-2">
              <div className="border-l-4 pl-3" style={{ borderColor: dept.color }}>
                <p className="meta-label" style={{ color: dept.color }}>
                  {dept.name}
                </p>
                <p className="meta-label mt-1 text-ink-soft">
                  {format(parseISO(announcement.date), "EEE MMM d").toUpperCase()}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-ivory"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* content */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6" data-lenis-prevent>
              <h2 className="font-display text-[1.375rem] font-semibold leading-tight text-navy-950">
                {announcement.title}
              </h2>
              {announcement.tag && (
                <span className="meta-label mt-2 inline-block rounded-full bg-event-red px-2.5 py-1 text-ivory" style={{ fontSize: "0.5625rem" }}>
                  {announcement.tag}
                </span>
              )}

              {announcement.sections.map((s, i) => (
                <motion.section
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.08, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="mt-5"
                >
                  {s.heading && (
                    <h3 className="flex items-center gap-2 font-display text-base font-semibold text-navy-950">
                      <span className="text-gold-500" aria-hidden>✦</span>
                      {s.heading}
                    </h3>
                  )}
                  <p className="mt-1.5 text-[0.9375rem] leading-[1.65] text-ink">{s.body}</p>
                  {s.image && (
                    <figure className="mt-3">
                      <motion.img
                        src={s.image}
                        alt={s.imageCaption ?? s.heading ?? announcement.title}
                        className="w-full cursor-zoom-in rounded-xl border border-navy-900/8 object-cover"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setLightbox(s.image!)}
                      />
                      {s.imageCaption && (
                        <figcaption className="meta-label mt-2 text-ink-soft" style={{ textTransform: "none", letterSpacing: "0.04em" }}>
                          {s.imageCaption}
                        </figcaption>
                      )}
                    </figure>
                  )}
                </motion.section>
              ))}
            </div>

            {/* footer bar */}
            <div className="flex items-center gap-2 border-t border-navy-900/8 bg-paper px-5 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
              <button
                onClick={() => share(announcement)}
                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-gold-500 text-sm font-semibold text-gold-500 transition-transform active:scale-95"
              >
                <Share2 className="h-4 w-4" /> Share
              </button>
              {announcement.tag === "EVENT" && (
                <button
                  className="flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-gold-500 text-sm font-semibold text-navy-950 transition-transform active:scale-95"
                  onClick={() => {
                    const d = announcement.date.replaceAll("-", "");
                    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                      announcement.title,
                    )}&dates=${d}/${d}&details=${encodeURIComponent(
                      announcement.sections.map((s) => s.body).join("\n\n"),
                    )}`;
                    window.open(url, "_blank", "noopener");
                  }}
                >
                  <CalendarPlus className="h-4 w-4" /> Add to calendar
                </button>
              )}
              <Link
                to="/departments"
                onClick={onClose}
                className="flex h-11 items-center gap-1 whitespace-nowrap px-2 text-sm font-semibold text-choate-blue"
              >
                All <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* lightbox */}
            <AnimatePresence>
              {lightbox && (
                <motion.div
                  className="absolute inset-0 z-10 flex items-center justify-center rounded-t-3xl bg-navy-950/90 p-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setLightbox(null)}
                >
                  <motion.img
                    src={lightbox}
                    alt=""
                    className="max-h-full max-w-full rounded-xl object-contain"
                    initial={{ scale: 0.85 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

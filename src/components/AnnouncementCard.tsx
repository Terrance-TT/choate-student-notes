/**
 * Announcement card — design.md §7.3. The feed atom: date chip, department
 * tag, title, clamped preview, thumbnail, EVENT pill. Tap opens the detail
 * bottom sheet (handled by parent via onOpen).
 */
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { firstImage, getDepartment, previewText, type Announcement } from "@/data/announcements";

export default function AnnouncementCard({
  announcement,
  onOpen,
  layoutIdPrefix = "",
}: {
  announcement: Announcement;
  onOpen: (a: Announcement) => void;
  layoutIdPrefix?: string;
}) {
  const dept = getDepartment(announcement.department);
  const date = parseISO(announcement.date);
  const image = firstImage(announcement);

  return (
    <motion.button
      layout
      onClick={() => onOpen(announcement)}
      whileTap={{ scale: 0.98 }}
      className="group w-full rounded-2xl border border-navy-900/8 bg-paper p-4 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        {/* circular navy date chip with gold day number */}
        <motion.div
          layoutId={`${layoutIdPrefix}chip-${announcement.id}`}
          className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full bg-navy-900"
        >
          <span className="font-display text-sm font-bold leading-none text-gold-500">
            {format(date, "d")}
          </span>
          <span className="meta-label mt-0.5 leading-none text-ivory/60" style={{ fontSize: "0.5rem" }}>
            {format(date, "MMM")}
          </span>
        </motion.div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className="meta-label border-l-2 pl-2"
              style={{ color: dept.color, borderColor: dept.color }}
            >
              {dept.short}
            </span>
            {announcement.tag && (
              <span className="meta-label rounded-full bg-event-red px-2 py-0.5 text-ivory" style={{ fontSize: "0.5625rem" }}>
                {announcement.tag}
              </span>
            )}
          </div>
          <motion.h3
            layoutId={`${layoutIdPrefix}title-${announcement.id}`}
            className="mt-1.5 font-display text-[1.125rem] font-semibold leading-snug text-navy-950"
          >
            {announcement.title}
          </motion.h3>
          <p className="mt-1 line-clamp-2 text-[0.9375rem] leading-relaxed text-ink-soft">
            {previewText(announcement)}
          </p>
        </div>

        {image && (
          <img
            src={image}
            alt=""
            className="h-[72px] w-[72px] shrink-0 rounded-xl object-cover"
            loading="lazy"
          />
        )}
      </div>

      <div className="mt-2 flex items-center justify-end gap-1 text-xs font-medium text-choate-blue">
        Tap to expand
        <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </motion.button>
  );
}

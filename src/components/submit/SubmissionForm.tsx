/**
 * Submit — State B (authenticated): the announcement submission form
 * (design/submit.md). Department select, title (80-char counter), date,
 * single-select tag pills, markdown-lite body with toolbar, drag-and-drop
 * image upload (data URL, no backend), audience checkboxes, live
 * student-view preview (debounced 200ms), sticky submit bar, inline
 * validation, draft saving, and the success lifecycle. Submissions append to
 * the localStorage-backed store in src/lib/submissions.ts, merged with the
 * seed data on read.
 */
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Bold,
  Heading2,
  ImagePlus,
  List,
  Mail,
  RefreshCcw,
  X,
} from "lucide-react";
import { DEPARTMENTS, type Announcement, type AnnouncementSection } from "@/data/announcements";
import type { User } from "@/lib/auth";
import {
  addSubmission,
  clearDraft,
  loadDraft,
  saveDraft,
  type Submission,
} from "@/lib/submissions";
import AnnouncementCard from "@/components/AnnouncementCard";
import SuccessOverlay from "@/components/submit/SuccessOverlay";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];
const TAGS = ["EVENT", "REMINDER", "DEADLINE"] as const;
const AUDIENCES = ["Students", "Faculty", "Parents"] as const;
const MAX_TITLE = 80;
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const fieldVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

const formVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

/** Strip the markdown-lite markers for display contexts. */
function stripMd(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1");
}

/**
 * Markdown-lite body → announcement sections. Blank lines separate topics;
 * a leading "## " line becomes the section heading. One image max (v1) rides
 * on the first section, mirroring the seed data shape.
 */
function parseBodyToSections(body: string, image?: string): AnnouncementSection[] {
  const sections: AnnouncementSection[] = body
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const lines = chunk.split("\n");
      const first = lines[0] ?? "";
      if (first.startsWith("## ")) {
        return {
          heading: stripMd(first.slice(3).trim()),
          body: stripMd(lines.slice(1).join("\n").trim()),
        };
      }
      return { body: stripMd(chunk) };
    })
    .filter((s) => s.heading || s.body);

  if (sections.length === 0) sections.push({ body: "" });
  if (image) sections[0] = { ...sections[0], image };
  return sections;
}

type Errors = Partial<Record<"department" | "title" | "body", string>>;

export default function SubmissionForm({
  user,
  onSignOut,
}: {
  user: User;
  onSignOut: () => void;
}) {
  const [draft] = useState(() => loadDraft());

  const [department, setDepartment] = useState(draft?.department ?? "");
  const [title, setTitle] = useState(draft?.title ?? "");
  const [date, setDate] = useState(draft?.date ?? format(new Date(), "yyyy-MM-dd"));
  const [tag, setTag] = useState<string>(draft?.tag ?? "");
  const [body, setBody] = useState(draft?.body ?? "");
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(draft?.imageDataUrl);
  const [audience, setAudience] = useState<string[]>(draft?.audience ?? ["Students"]);
  const [previewOn, setPreviewOn] = useState(false);

  const [errors, setErrors] = useState<Errors>({});
  const [shakeKey, setShakeKey] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [success, setSuccess] = useState(false);

  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  /* ---- live student-view preview (debounced 200ms) ---- */
  const [preview, setPreview] = useState<Announcement | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      setPreview({
        id: "submit-preview",
        department: department || DEPARTMENTS[0].id,
        title: title.trim() || "Untitled announcement",
        date: date || format(new Date(), "yyyy-MM-dd"),
        ...(tag ? { tag } : {}),
        sections: parseBodyToSections(body, imageDataUrl),
      });
    }, 200);
    return () => clearTimeout(t);
  }, [department, title, date, tag, body, imageDataUrl]);

  /* Gold border pulse on each debounced content update (0.4s glow). */
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (preview) setPulse((p) => p + 1);
  }, [preview]);

  /* Restore notice for a returning draft. */
  useEffect(() => {
    if (draft && (draft.title || draft.body)) {
      toast.info("Draft restored", {
        description: "Your saved draft from this device was loaded.",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- validation ---------------- */
  const validate = (): Errors => {
    const errs: Errors = {};
    if (!department) errs.department = "Choose a department";
    if (!title.trim()) errs.title = "Give the announcement a title";
    else if (title.trim().length > MAX_TITLE) errs.title = `Keep the title under ${MAX_TITLE} characters`;
    if (!body.trim()) errs.body = "Write the announcement body";
    return errs;
  };

  const validateField = (field: keyof Errors) => {
    setErrors((prev) => ({ ...prev, [field]: validate()[field] }));
  };

  /* ---------------- toolbar (markdown-lite inserts) ---------------- */
  const insertMarkup = (kind: "bold" | "bullet" | "heading") => {
    const el = bodyRef.current;
    if (!el) return;
    const { selectionStart: s, selectionEnd: e, value } = el;
    let next = value;
    let pos = e;
    if (kind === "bold") {
      const sel = value.slice(s, e) || "bold text";
      next = `${value.slice(0, s)}**${sel}**${value.slice(e)}`;
      pos = s + sel.length + 4;
    } else {
      const lineStart = value.lastIndexOf("\n", Math.max(0, s - 1)) + 1;
      const prefix = kind === "bullet" ? "• " : "## ";
      next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
      pos = s + prefix.length;
    }
    setBody(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(pos, pos);
    });
  };

  /* ---------------- image upload (local only) ---------------- */
  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("That file isn't an image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Keep images under 3 MB — they're stored on this device only.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  /* ---------------- actions ---------------- */
  const resetForm = () => {
    setDepartment("");
    setTitle("");
    setDate(format(new Date(), "yyyy-MM-dd"));
    setTag("");
    setBody("");
    setImageDataUrl(undefined);
    setAudience(["Students"]);
    setErrors({});
  };

  const handleSaveDraft = () => {
    saveDraft({
      department,
      title,
      date,
      ...(tag ? { tag } : {}),
      body,
      ...(imageDataUrl ? { imageDataUrl } : {}),
      audience,
    });
    toast.success("Draft saved", { description: "Stored on this device only." });
  };

  const handleSubmit = () => {
    const errs = validate();
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) {
      setShakeKey((k) => k + 1);
      toast.error("A few fields need attention before submitting.");
      return;
    }
    const submission: Submission = {
      id: `user-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      department,
      title: title.trim(),
      date,
      ...(tag ? { tag } : {}),
      sections: parseBodyToSections(body, imageDataUrl),
      submittedBy: user.name,
      submittedAt: new Date().toISOString(),
      audience,
      status: "pending",
    };
    addSubmission(submission);
    clearDraft();
    resetForm();
    setSuccess(true);
    toast.success("Submitted for review", {
      description: "You'll get an email when it's live in Student Notes.",
    });
  };

  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const role = user.role.toUpperCase();

  const inputCls =
    "h-12 rounded-xl border-navy-900/15 bg-paper text-ink shadow-none caret-gold-500 placeholder:text-ink-soft/50 focus-visible:border-navy-900/60 focus-visible:ring-navy-900/15";

  return (
    <div className="paper-grain min-h-[100dvh]">
      <div className="px-5 pb-48 pt-10">
        {/* ---------------- header + signed-in chip ---------------- */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <p className="meta-label text-gold-500" style={{ color: "#9a7209" }}>
            Faculty tools
          </p>
          <h1 className="mt-2 font-display text-[2rem] font-bold leading-tight text-navy-950">
            New announcement
          </h1>

          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-navy-900/10 bg-paper p-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy-900 font-display text-sm font-bold text-gold-500">
              {initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink">{user.name}</span>
              <span className="meta-label block text-ink-soft" style={{ fontSize: "0.5625rem" }}>
                {role}
              </span>
            </span>
            <button
              type="button"
              onClick={onSignOut}
              className="flex min-h-[44px] shrink-0 items-center gap-1.5 px-2 text-sm font-medium text-choate-blue hover:underline"
            >
              <RefreshCcw className="h-3.5 w-3.5" aria-hidden />
              Switch account
            </button>
          </div>
        </motion.div>

        {/* ---------------- form ---------------- */}
        <motion.div
          variants={formVariants}
          initial="hidden"
          animate="show"
          className="mt-8 flex flex-col gap-6"
        >
          {/* 1. Department */}
          <motion.div variants={fieldVariants}>
            <label htmlFor="submit-dept" className="meta-label text-ink-soft">
              Department
            </label>
            <Select
              value={department}
              onValueChange={(v) => {
                setDepartment(v);
                setErrors((p) => ({ ...p, department: undefined }));
              }}
            >
              <SelectTrigger
                id="submit-dept"
                className={cn(inputCls, "mt-2 w-full")}
                aria-invalid={!!errors.department}
              >
                <SelectValue placeholder="Choose a department" />
              </SelectTrigger>
              <SelectContent className="max-w-[calc(480px-2.5rem)]">
                {DEPARTMENTS.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: d.color }}
                      />
                      {d.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.department && (
              <p className="mt-1.5 font-mono text-[0.6875rem] tracking-[0.08em] text-event-red">
                {errors.department}
              </p>
            )}
          </motion.div>

          {/* 2. Title */}
          <motion.div variants={fieldVariants}>
            <div className="flex items-baseline justify-between">
              <label htmlFor="submit-title" className="meta-label text-ink-soft">
                Title
              </label>
              <span className="meta-label text-ink-soft/60" style={{ fontSize: "0.5625rem" }}>
                {title.length}/{MAX_TITLE}
              </span>
            </div>
            <Input
              id="submit-title"
              value={title}
              maxLength={MAX_TITLE}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((p) => ({ ...p, title: undefined }));
              }}
              onBlur={() => title && validateField("title")}
              placeholder="e.g. Red Cross Blood Drive"
              aria-invalid={!!errors.title}
              className={cn(inputCls, "mt-2")}
            />
            {errors.title && (
              <p className="mt-1.5 font-mono text-[0.6875rem] tracking-[0.08em] text-event-red">
                {errors.title}
              </p>
            )}
          </motion.div>

          {/* 3. Date */}
          <motion.div variants={fieldVariants}>
            <label htmlFor="submit-date" className="meta-label text-ink-soft">
              Date
            </label>
            <Input
              id="submit-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={cn(inputCls, "mt-2")}
            />
          </motion.div>

          {/* 4. Tag pills (single-select) */}
          <motion.div variants={fieldVariants}>
            <span className="meta-label text-ink-soft">Tag · optional</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {TAGS.map((t) => {
                const active = tag === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTag(active ? "" : t)}
                    aria-pressed={active}
                    className={cn(
                      "meta-label flex min-h-[44px] items-center rounded-full border px-4 transition-colors",
                      active
                        ? t === "EVENT"
                          ? "border-event-red bg-event-red text-ivory"
                          : t === "REMINDER"
                            ? "border-choate-blue bg-choate-blue text-ivory"
                            : "border-gold-500 bg-gold-500 text-navy-950"
                        : "border-navy-900/20 bg-paper text-ink-soft hover:border-navy-900/40",
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* 5. Body + toolbar-lite */}
          <motion.div variants={fieldVariants}>
            <div className="flex items-center justify-between">
              <label htmlFor="submit-body" className="meta-label text-ink-soft">
                Announcement
              </label>
              <div className="flex gap-1">
                {(
                  [
                    { kind: "bold", icon: Bold, label: "Bold" },
                    { kind: "bullet", icon: List, label: "Bullet list" },
                    { kind: "heading", icon: Heading2, label: "Sub-heading" },
                  ] as const
                ).map(({ kind, icon: Icon, label }) => (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => insertMarkup(kind)}
                    title={label}
                    aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-navy-900/15 bg-paper text-ink-soft transition-colors hover:border-gold-500/60 hover:text-navy-950"
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
              </div>
            </div>
            <Textarea
              ref={bodyRef}
              id="submit-body"
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                if (errors.body) setErrors((p) => ({ ...p, body: undefined }));
              }}
              onBlur={() => body && validateField("body")}
              rows={5}
              placeholder="Write the announcement. Use blank lines to separate topics (e.g. Yearbook, then Blood Drive)."
              aria-invalid={!!errors.body}
              className={cn(inputCls, "mt-2 min-h-[140px] py-3 leading-relaxed")}
            />
            {errors.body && (
              <p className="mt-1.5 font-mono text-[0.6875rem] tracking-[0.08em] text-event-red">
                {errors.body}
              </p>
            )}
          </motion.div>

          {/* 6. Image drop zone */}
          <motion.div variants={fieldVariants}>
            <span className="meta-label text-ink-soft">Image · optional, one max</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                handleFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {imageDataUrl ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                className="relative mt-2 w-fit"
              >
                <img
                  src={imageDataUrl}
                  alt="Uploaded announcement graphic"
                  className="h-[120px] w-auto max-w-full rounded-xl border border-navy-900/10 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setImageDataUrl(undefined)}
                  aria-label="Remove image"
                  className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-navy-950 text-ivory shadow-md transition-colors hover:bg-event-red"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFile(e.dataTransfer.files?.[0]);
                }}
                className={cn(
                  "mt-2 flex h-[120px] w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all",
                  dragOver
                    ? "scale-[1.02] border-gold-500 bg-gold-300/15"
                    : "border-navy-900/25 bg-paper/60 hover:border-navy-900/45",
                )}
              >
                <ImagePlus
                  className={cn("h-6 w-6", dragOver ? "text-gold-500" : "text-ink-soft/60")}
                />
                <span className="text-sm font-medium text-ink-soft">
                  Drop a flyer or graphic, or <span className="text-choate-blue underline">browse</span>
                </span>
                <span className="meta-label text-ink-soft/50" style={{ fontSize: "0.5625rem" }}>
                  Stored on this device only
                </span>
              </button>
            )}
          </motion.div>

          {/* 7. Audience */}
          <motion.div variants={fieldVariants}>
            <span className="meta-label text-ink-soft">Audience</span>
            <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
              {AUDIENCES.map((a) => {
                const checked = audience.includes(a);
                return (
                  <label
                    key={a}
                    className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-sm font-medium text-ink"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(c) =>
                        setAudience((prev) =>
                          c === true ? [...prev, a] : prev.filter((x) => x !== a),
                        )
                      }
                      className="h-5 w-5 rounded-md border-navy-900/30 data-[state=checked]:border-navy-900 data-[state=checked]:bg-navy-900 data-[state=checked]:text-gold-500"
                    />
                    {a}
                  </label>
                );
              })}
            </div>
          </motion.div>

          {/* 8. Preview toggle + live student-view card */}
          <motion.div variants={fieldVariants}>
            <label className="flex min-h-[44px] cursor-pointer items-center justify-between gap-4 rounded-2xl border border-navy-900/10 bg-paper p-3.5">
              <span className="text-sm font-medium text-ink">
                Preview as students will see it
              </span>
              <Switch
                checked={previewOn}
                onCheckedChange={setPreviewOn}
                className="data-[state=checked]:bg-gold-500"
              />
            </label>

            <AnimatePresence>
              {previewOn && preview && (
                <motion.div
                  key="preview"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4"
                >
                  <p className="meta-label mb-2 text-ink-soft/60">Live preview</p>
                  <motion.div
                    key={pulse}
                    initial={{
                      boxShadow: "0 0 0 2px rgba(212, 160, 23, 0.9)",
                      borderRadius: "1rem",
                    }}
                    animate={{ boxShadow: "0 0 0 0px rgba(212, 160, 23, 0)" }}
                    transition={{ duration: 0.4, ease: EASE }}
                  >
                    <AnnouncementCard
                      announcement={preview}
                      onOpen={() =>
                        toast.info("Preview only", {
                          description: "Students tap the card to open the full announcement.",
                        })
                      }
                      layoutIdPrefix="submit-"
                    />
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

        {/* ---------------- moderation note ---------------- */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="mt-10 flex items-start gap-3 rounded-2xl border border-navy-900/10 bg-ivory p-4"
        >
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-gold-500" />
          <p className="text-[0.8125rem] leading-relaxed text-ink-soft">
            All submissions are reviewed by the Communications Office before
            publishing. Posts appear in the next Student Notes cycle.
          </p>
        </motion.div>
      </div>

      {/* ---------------- sticky submit bar (above tab bar) ---------------- */}
      <motion.div
        key={shakeKey}
        animate={shakeKey > 0 ? { x: [0, -6, 6, -6, 6, 0] } : undefined}
        transition={{ duration: 0.3 }}
        className="sticky bottom-[76px] z-40 px-5 pb-4 md:bottom-6"
      >
        <div className="flex gap-3 rounded-2xl border border-navy-900/10 bg-paper/95 p-3 shadow-lg shadow-navy-950/10 backdrop-blur">
          <button
            type="button"
            onClick={handleSubmit}
            className="h-[52px] flex-1 rounded-xl bg-gold-500 text-[0.9375rem] font-bold text-navy-950 shadow-sm transition-colors hover:bg-gold-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-900 focus-visible:ring-offset-2 focus-visible:ring-offset-paper active:scale-[0.98]"
          >
            Submit announcement
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="h-[52px] shrink-0 rounded-xl px-4 text-[0.9375rem] font-semibold text-ink-soft transition-colors hover:bg-navy-950/5 hover:text-navy-950"
          >
            Save draft
          </button>
        </div>
      </motion.div>

      {/* ---------------- success lifecycle ---------------- */}
      <AnimatePresence>
        {success && (
          <SuccessOverlay
            onSubmitAnother={() => {
              resetForm();
              setSuccess(false);
              window.scrollTo({ top: 0 });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

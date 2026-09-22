/**
 * Local-only user preferences for the digest & appearance (settings.md §3–§4).
 * Everything is stored in localStorage under the `student-notes.*` namespace —
 * no accounts, no servers. Appearance prefs are applied app-wide by setting
 * attributes/styles on the root element; `applyAppearancePrefs()` runs at
 * module import so stored prefs survive reloads.
 */

import { DEPARTMENTS } from "@/data/announcements";
import { clearDigestCache } from "@/lib/ai";

const LS_STYLE = "student-notes.digest.style";
const LS_DEPTS = "student-notes.digest.departments";
const LS_MOTION = "student-notes.ui.reduceMotion";
const LS_TEXT = "student-notes.ui.textSize";

/* ------------------------------------------------------------------ */
/* Digest style (settings.md §3)                                       */
/* ------------------------------------------------------------------ */

/**
 * "summary" — announcement titles only (comma-separated, no AI needed).
 * "digest"  — title + one-sentence summary per item (AI when configured).
 * Legacy v1 values are mapped: "titles" → summary, "one-liners"/"sentences" → digest.
 */
export type DigestStyle = "summary" | "digest";

export const DIGEST_STYLES: { id: DigestStyle; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "digest", label: "Digest" },
];

export function getDigestStyle(): DigestStyle {
  const v = localStorage.getItem(LS_STYLE);
  return v === "summary" || v === "titles" ? "summary" : "digest";
}

/** Persist style; clears the digest cache so the next digest regenerates. */
export function setDigestStyle(style: DigestStyle): void {
  localStorage.setItem(LS_STYLE, style);
  clearDigestCache();
}

/* ------------------------------------------------------------------ */
/* Included departments (settings.md §3)                               */
/* ------------------------------------------------------------------ */

export function getIncludedDepartments(): Set<string> {
  try {
    const raw = localStorage.getItem(LS_DEPTS);
    if (!raw) return new Set(DEPARTMENTS.map((d) => d.id));
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) throw new Error("bad");
    const ids = new Set(parsed.filter((x): x is string => typeof x === "string"));
    return ids.size > 0 ? ids : new Set(DEPARTMENTS.map((d) => d.id));
  } catch {
    return new Set(DEPARTMENTS.map((d) => d.id));
  }
}

/** Persist inclusion set; clears the digest cache (prompt contents change). */
export function setIncludedDepartments(ids: Set<string>): void {
  localStorage.setItem(LS_DEPTS, JSON.stringify([...ids]));
  clearDigestCache();
}

/* ------------------------------------------------------------------ */
/* Appearance (settings.md §4)                                         */
/* ------------------------------------------------------------------ */

export function getReduceMotion(): boolean {
  const stored = localStorage.getItem(LS_MOTION);
  if (stored === "1") return true;
  if (stored === "0") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function setReduceMotion(on: boolean): void {
  localStorage.setItem(LS_MOTION, on ? "1" : "0");
  document.documentElement.dataset.reduceMotion = on ? "1" : "0";
}

export type TextSize = "s" | "m" | "l";

export const TEXT_SIZES: { id: TextSize; label: string; scale: number }[] = [
  { id: "s", label: "S", scale: 0.875 },
  { id: "m", label: "M", scale: 1 },
  { id: "l", label: "L", scale: 1.125 },
];

export function getTextSize(): TextSize {
  const v = localStorage.getItem(LS_TEXT);
  return v === "s" || v === "l" ? v : "m";
}

export function setTextSize(size: TextSize): void {
  localStorage.setItem(LS_TEXT, size);
  applyTextSize(size);
}

export function applyTextSize(size: TextSize): void {
  const scale = TEXT_SIZES.find((t) => t.id === size)?.scale ?? 1;
  document.documentElement.style.fontSize = `${16 * scale}px`;
}

/** Re-apply stored appearance prefs (called at module import). */
export function applyAppearancePrefs(): void {
  applyTextSize(getTextSize());
  document.documentElement.dataset.reduceMotion = getReduceMotion() ? "1" : "0";
}

/** Remove every `student-notes.*` key (settings.md §4 danger zone). */
export function clearAllLocalData(): void {
  const doomed: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith("student-notes.")) doomed.push(k);
  }
  doomed.forEach((k) => localStorage.removeItem(k));
  applyTextSize("m");
  document.documentElement.dataset.reduceMotion = String(
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 1 : 0,
  );
}

if (typeof document !== "undefined") {
  applyAppearancePrefs();
}

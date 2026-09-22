/**
 * AI digest client — design.md §8.
 *
 * Generates the "Student Notes digest" via any OpenAI-compatible Chat
 * Completions endpoint. Configuration lives in localStorage ONLY and is
 * sent nowhere except the configured endpoint:
 *
 *   student-notes.ai.baseUrl  (default "https://api.openai.com/v1")
 *   student-notes.ai.apiKey   (no default — digest falls back locally)
 *   student-notes.ai.model    (default "gpt-4o-mini")
 *
 * If no API key is configured (or the request fails), a deterministic local
 * summarizer produces the digest so the page is never empty.
 *
 * Results are cached in localStorage keyed by a hash of the announcement
 * content + model, so repeat visits don't re-hit the API.
 */

import {
  ANNOUNCEMENTS,
  DEPARTMENTS,
  getDepartment,
  type Announcement,
} from "@/data/announcements";

const DEPARTMENT_IDS = new Set(DEPARTMENTS.map((d) => d.id));

export interface AIConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

/**
 * Digest rendering style. "summary" = announcement titles only (no AI
 * needed); "digest" = title + one-sentence per item (AI when configured,
 * local fallback otherwise). Mirrors `DigestStyle` in
 * `@/components/settings/prefs` — duplicated here so this module stays
 * import-cycle-free (prefs.ts imports clearDigestCache from here).
 */
export type DigestStyle = "summary" | "digest";

const LS_STYLE = "student-notes.digest.style";

/** Read the stored digest style (default "digest"; legacy "titles" → summary). */
export function getStoredDigestStyle(): DigestStyle {
  const v = localStorage.getItem(LS_STYLE);
  return v === "summary" || v === "titles" ? "summary" : "digest";
}

export interface DigestResult {
  /** Rendered digest lines, grouped by department. */
  groups: { department: string; departmentName: string; color: string; lines: string[] }[];
  /** True when produced by the configured AI endpoint, false for local fallback. */
  aiGenerated: boolean;
  /** ISO timestamp of generation. */
  generatedAt: string;
}

const LS_BASE_URL = "student-notes.ai.baseUrl";
const LS_API_KEY = "student-notes.ai.apiKey";
const LS_MODEL = "student-notes.ai.model";
const LS_CACHE_PREFIX = "student-notes.digest.";

export const DEFAULT_BASE_URL = "https://api.openai.com/v1";
export const DEFAULT_MODEL = "gpt-4o-mini";

export function getAIConfig(): AIConfig {
  return {
    baseUrl: (localStorage.getItem(LS_BASE_URL) ?? DEFAULT_BASE_URL).replace(/\/+$/, ""),
    apiKey: localStorage.getItem(LS_API_KEY) ?? "",
    model: localStorage.getItem(LS_MODEL) ?? DEFAULT_MODEL,
  };
}

export function setAIConfig(cfg: Partial<AIConfig>): void {
  if (cfg.baseUrl !== undefined) localStorage.setItem(LS_BASE_URL, cfg.baseUrl);
  if (cfg.apiKey !== undefined) localStorage.setItem(LS_API_KEY, cfg.apiKey);
  if (cfg.model !== undefined) localStorage.setItem(LS_MODEL, cfg.model);
}

export function hasApiKey(): boolean {
  return getAIConfig().apiKey.trim().length > 0;
}

/** Stable string hash (FNV-1a) — used for cache keys. */
export function contentHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

const DIGEST_PROMPT =
  "You are summarizing Choate Rosemary Hall's weekly Student Notes for busy students. " +
  "List every club, event, and happening by title, grouped by department, one line each, " +
  "with date/location when present. Be terse.";

const SUMMARY_PROMPT =
  "You are listing Choate Rosemary Hall's weekly Student Notes for busy students. " +
  "List only the announcement titles, one bullet per title, grouped by department " +
  "(one department heading line, then its titles). No summaries, no descriptions, " +
  "no dates — titles only. Be terse.";

function promptFor(style: DigestStyle): string {
  return style === "summary" ? SUMMARY_PROMPT : DIGEST_PROMPT;
}

function announcementsPayload(items: Announcement[]): string {
  return items
    .map(
      (a) =>
        `Department: ${getDepartment(a.department).name}\nTitle: ${a.title}\nDate: ${a.date}${
          a.tag ? `\nTag: ${a.tag}` : ""
        }\n${a.sections.map((s) => `${s.heading ? s.heading + ": " : ""}${s.body}`).join("\n")}`,
    )
    .join("\n\n");
}

function digestCacheKey(items: Announcement[], model: string, style: DigestStyle): string {
  return LS_CACHE_PREFIX + contentHash(announcementsPayload(items) + "|" + model + "|" + style);
}

/** Parse a markdown-ish AI response into department groups. */
function parseAIDigest(text: string): DigestResult["groups"] {
  const groups: DigestResult["groups"] = [];
  let current: DigestResult["groups"][number] | null = null;
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const isBullet = /^[-*•✦]/.test(line);
    const heading = line.replace(/^#+\s*/, "").replace(/\*\*/g, "").replace(/:$/, "");
    if (!isBullet) {
      // Best-effort: map the heading back to a known department id.
      const slug = heading.toLowerCase().replace(/[^a-z]+/g, "-").replace(/^-|-$/g, "");
      const aliases: Record<string, string> = {
        "head-of-student-academic-life": "student-academic-life",
        "arts-department": "arts",
        clubs: "clubs-organizations",
        activities: "student-activities",
      };
      const knownId = aliases[slug] ?? slug;
      const isKnown =
        DEPARTMENT_IDS.has(knownId);
      const dept = isKnown
        ? getDepartment(knownId)
        : { id: slug || "general", name: heading, short: heading, color: "#D4A017" };
      current = { department: dept.id, departmentName: dept.name, color: dept.color, lines: [] };
      groups.push(current);
    } else {
      const text2 = line.replace(/^[-*•✦]\s*/, "").replace(/\*\*/g, "");
      if (!current) {
        current = { department: "general", departmentName: "This Week", color: "#D4A017", lines: [] };
        groups.push(current);
      }
      current.lines.push(text2);
    }
  }
  return groups.filter((g) => g.lines.length > 0);
}

/** Deterministic local summarizer — used when no API key is set or on error. */
export function localDigest(
  items: Announcement[] = ANNOUNCEMENTS,
  style: DigestStyle = "digest",
): DigestResult {
  const byDept = new Map<string, Announcement[]>();
  for (const a of items) {
    const list = byDept.get(a.department) ?? [];
    list.push(a);
    byDept.set(a.department, list);
  }
  const groups: DigestResult["groups"] = [];
  for (const [deptId, anns] of byDept) {
    const dept = getDepartment(deptId);
    const lines =
      style === "summary"
        ? anns.map((a) => a.title)
        : anns.flatMap((a) =>
            a.sections.map((s) => {
              const first = s.body.split(/(?<=[.!?])\s+/)[0] ?? s.body;
              const lead = s.heading ?? a.title;
              return `${lead} — ${first}`;
            }),
          );
    groups.push({ department: deptId, departmentName: dept.name, color: dept.color, lines });
  }
  return { groups, aiGenerated: false, generatedAt: new Date().toISOString() };
}

/**
 * Get the digest: cached → AI endpoint (if key) → local fallback.
 * Pass `force: true` to bypass the cache ("Regenerate").
 * `style` defaults to the stored Settings pref (`student-notes.digest.style`)
 * and is part of the cache key, so toggling style never serves stale output.
 */
export async function getDigest(opts?: {
  force?: boolean;
  items?: Announcement[];
  style?: DigestStyle;
}): Promise<DigestResult> {
  const items = opts?.items ?? ANNOUNCEMENTS;
  const style = opts?.style ?? getStoredDigestStyle();
  const cfg = getAIConfig();
  const cacheKey = digestCacheKey(items, cfg.model, style);

  if (!opts?.force) {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as DigestResult;
      } catch {
        localStorage.removeItem(cacheKey);
      }
    }
  }

  let result: DigestResult;
  if (cfg.apiKey.trim()) {
    try {
      const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
          model: cfg.model,
          messages: [
            { role: "system", content: promptFor(style) },
            { role: "user", content: announcementsPayload(items) },
          ],
          temperature: 0.3,
        }),
      });
      if (!res.ok) throw new Error(`Digest API ${res.status}`);
      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      const text = json.choices?.[0]?.message?.content ?? "";
      const groups = parseAIDigest(text);
      if (groups.length === 0) throw new Error("Empty digest");
      result = { groups, aiGenerated: true, generatedAt: new Date().toISOString() };
    } catch (err) {
      console.warn("[student-notes] AI digest failed, using local fallback:", err);
      result = localDigest(items, style);
    }
  } else {
    result = localDigest(items, style);
  }

  try {
    localStorage.setItem(cacheKey, JSON.stringify(result));
  } catch {
    // storage full — digest still returned, just not cached
  }
  return result;
}

/**
 * Clear all cached digests (used by Settings).
 * NB: the cache prefix `student-notes.digest.` also prefixes the *preference*
 * keys `student-notes.digest.style` / `student-notes.digest.departments` —
 * those are settings, not cache, and must survive a cache clear.
 */
const PREF_KEYS = new Set([LS_STYLE, "student-notes.digest.departments"]);

export function clearDigestCache(): void {
  const doomed: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(LS_CACHE_PREFIX) && !PREF_KEYS.has(k)) doomed.push(k);
  }
  doomed.forEach((k) => localStorage.removeItem(k));
}

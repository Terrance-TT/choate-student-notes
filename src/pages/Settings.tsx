/**
 * Settings — `/settings` (design/settings.md).
 *
 * Control-room surface for the OpenAI-compatible AI provider that powers the
 * digest, plus digest cache/style controls, appearance, and the clear-local-
 * data danger zone. Everything lives in localStorage — no accounts, no
 * servers. All digest generation/caching goes through `@/lib/ai`.
 */
import { memo, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Loader2,
  PlugZap,
  Trash2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  ANNOUNCEMENTS,
  DEPARTMENTS,
} from "@/data/announcements";
import {
  DEFAULT_BASE_URL,
  DEFAULT_MODEL,
  clearDigestCache,
  getAIConfig,
  getDigest,
  hasApiKey,
  setAIConfig,
} from "@/lib/ai";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import {
  DIGEST_STYLES,
  TEXT_SIZES,
  applyTextSize,
  clearAllLocalData,
  getDigestStyle,
  getIncludedDepartments,
  getReduceMotion,
  getTextSize,
  setDigestStyle,
  setIncludedDepartments,
  setReduceMotion,
  setTextSize,
  type DigestStyle,
  type TextSize,
} from "@/components/settings/prefs";

const EASE = [0.22, 1, 0.36, 1] as [number, number, number, number];

const MODEL_SUGGESTIONS = [
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-4.1-mini",
  "llama-3.1-70b",
  "qwen2.5",
  "mistral-large",
];

const inputCls =
  "h-12 rounded-xl border-navy-800 bg-navy-800 px-4 text-[0.9375rem] text-ivory placeholder:text-ivory/35 focus-visible:border-blue-400 focus-visible:ring-blue-400/40";

/* ------------------------------------------------------------------ */
/* Isolated perpetual animation — status pill dot pulse.               */
/* ------------------------------------------------------------------ */

const PulseDot = memo(function PulseDot({ className }: { className?: string }) {
  return (
    <motion.span
      className={cn("h-1.5 w-1.5 rounded-full", className)}
      animate={{ opacity: [1, 0.3, 1] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    />
  );
});

/* ------------------------------------------------------------------ */
/* Card shell — shared entrance animation (slide up 24px + fade).      */
/* ------------------------------------------------------------------ */

function Card({
  delay = 0,
  shimmer = false,
  flash = false,
  children,
  className,
}: {
  delay?: number;
  shimmer?: boolean;
  flash?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const inner = (
    <div className={cn("rounded-2xl bg-navy-900 p-5", className)}>{children}</div>
  );
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay, ease: EASE }}
      animate={
        flash
          ? {
              boxShadow: [
                "0 0 0 1px rgba(212,160,23,0)",
                "0 0 0 3px rgba(212,160,23,0.95)",
                "0 0 0 1px rgba(212,160,23,0)",
              ],
            }
          : { boxShadow: "0 0 0 1px rgba(212,160,23,0)" }
      }
      style={{ borderRadius: "1rem" }}
      className={cn(shimmer && "gold-shimmer-border p-px")}
    >
      {inner}
    </motion.section>
  );
}

function CardHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="meta-label flex items-center gap-2 text-gold-500">
      <span aria-hidden>✦</span>
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Segmented control — animated gold pill via layoutId.                */
/* ------------------------------------------------------------------ */

function Segmented<T extends string>({
  options,
  value,
  onChange,
  pillId,
  ariaLabel,
}: {
  options: readonly { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  pillId: string;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex rounded-full border border-navy-800 bg-navy-950/60 p-1"
    >
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          aria-pressed={value === o.id}
          className="relative min-h-[40px] flex-1 rounded-full px-2 text-xs font-semibold"
        >
          {value === o.id && (
            <motion.span
              layoutId={pillId}
              className="absolute inset-0 rounded-full bg-gold-500"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          <span
            className={cn(
              "relative z-10 transition-colors",
              value === o.id ? "text-navy-950" : "text-ivory/65",
            )}
          >
            {o.label}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Connection status                                                   */
/* ------------------------------------------------------------------ */

type ConnState =
  | { kind: "connected"; model: string }
  | { kind: "unconfigured" }
  | { kind: "failed"; message: string };

function StatusPill({ conn }: { conn: ConnState }) {
  const key = conn.kind;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={key}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className={cn(
          "meta-label inline-flex items-center gap-1.5 rounded-full px-2.5 py-1",
          conn.kind === "connected" && "bg-dept-green/20 text-[#7FD4B6]",
          conn.kind === "unconfigured" && "bg-gold-500/15 text-gold-300",
          conn.kind === "failed" && "bg-event-red/25 text-[#F2B0A8]",
        )}
        style={{ fontSize: "0.5625rem" }}
      >
        {conn.kind === "connected" && (
          <>
            <PulseDot className="bg-dept-green" />
            Connected · {conn.model}
          </>
        )}
        {conn.kind === "unconfigured" && (
          <>
            <PulseDot className="bg-gold-500" />
            Not configured
          </>
        )}
        {conn.kind === "failed" && (
          <>
            <span className="h-1.5 w-1.5 rounded-full bg-event-red" aria-hidden />
            Connection failed
          </>
        )}
      </motion.span>
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Test-connection result                                              */
/* ------------------------------------------------------------------ */

type TestResult =
  | { ok: true; latency: number }
  | { ok: false; message: string };

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Settings() {
  /* --- provider form --- */
  const initial = getAIConfig();
  const [baseUrl, setBaseUrl] = useState(initial.baseUrl);
  const [apiKey, setApiKey] = useState(initial.apiKey);
  const [model, setModel] = useState(initial.model);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [flash, setFlash] = useState(false);
  const [conn, setConn] = useState<ConnState>(
    hasApiKey()
      ? { kind: "connected", model: initial.model }
      : { kind: "unconfigured" },
  );

  /* --- digest controls --- */
  const [style, setStyle] = useState<DigestStyle>(getDigestStyle());
  const [depts, setDepts] = useState<Set<string>>(getIncludedDepartments());
  const [cacheInfo, setCacheInfo] = useState<{
    generatedAt: string;
    label: string;
  } | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  /* --- appearance --- */
  const [reduceMotion, setReduceMotionState] = useState(getReduceMotion());
  const [textSize, setTextSizeState] = useState<TextSize>(getTextSize());
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let live = true;
    getDigest().then((d) => {
      if (!live) return;
      setCacheInfo({
        generatedAt: d.generatedAt,
        label: d.aiGenerated ? getAIConfig().model : "local summary",
      });
    });
    return () => {
      live = false;
    };
  }, []);

  /* --- provider handlers --- */

  const onTest = async () => {
    if (testing) return;
    setTesting(true);
    setTestResult(null);
    const url = `${(baseUrl.trim() || DEFAULT_BASE_URL).replace(/\/+$/, "")}/chat/completions`;
    const started = performance.now();
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey.trim() ? { Authorization: `Bearer ${apiKey.trim()}` } : {}),
        },
        body: JSON.stringify({
          model: model.trim() || DEFAULT_MODEL,
          messages: [{ role: "user", content: "Say OK" }],
          max_tokens: 1,
        }),
      });
      const latency = Math.round(performance.now() - started);
      if (!res.ok) {
        const bodyText = await res.text().catch(() => "");
        const message = `HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ""}${
          bodyText ? ` — ${bodyText.slice(0, 140)}` : ""
        }`;
        setTestResult({ ok: false, message });
        setConn({ kind: "failed", message });
      } else {
        setTestResult({ ok: true, latency });
        setConn({ kind: "connected", model: model.trim() || DEFAULT_MODEL });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Network error — unreachable endpoint";
      setTestResult({ ok: false, message });
      setConn({ kind: "failed", message });
    } finally {
      setTesting(false);
    }
  };

  const onSave = () => {
    const cfg = {
      baseUrl: (baseUrl.trim() || DEFAULT_BASE_URL).replace(/\/+$/, ""),
      apiKey: apiKey.trim(),
      model: model.trim() || DEFAULT_MODEL,
    };
    setAIConfig(cfg);
    clearDigestCache(); // provider changed — stale digests must regenerate
    setConn(
      cfg.apiKey
        ? { kind: "connected", model: cfg.model }
        : { kind: "unconfigured" },
    );
    setFlash(true);
    window.setTimeout(() => setFlash(false), 650);
    toast.success("Provider saved");
  };

  const onClearKey = () => {
    setApiKey("");
    setAIConfig({ apiKey: "" });
    setTestResult(null);
    setConn({ kind: "unconfigured" });
    toast("API key cleared");
  };

  /* --- digest control handlers --- */

  const onRegenerate = async () => {
    if (regenerating) return;
    setRegenerating(true);
    const items = ANNOUNCEMENTS.filter((a) => depts.has(a.department));
    const d = await getDigest({ force: true, items });
    setCacheInfo({
      generatedAt: d.generatedAt,
      label: d.aiGenerated ? getAIConfig().model : "local summary",
    });
    setRegenerating(false);
    toast.success("Digest regenerated");
  };

  const onClearCache = () => {
    clearDigestCache();
    setCacheInfo(null);
    toast("Digest cache cleared");
  };

  const onStyleChange = (s: DigestStyle) => {
    setStyle(s);
    setDigestStyle(s); // clears digest cache so the next digest uses it
    toast.success("Digest style saved");
  };

  const toggleDept = (id: string) => {
    setDepts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) return prev; // keep at least one department
        next.delete(id);
      } else {
        next.add(id);
      }
      setIncludedDepartments(next); // clears digest cache (prompt contents change)
      return next;
    });
  };

  /* --- appearance handlers --- */

  const onReduceMotion = (on: boolean) => {
    setReduceMotionState(on);
    setReduceMotion(on);
  };

  const onTextSize = (s: TextSize) => {
    setTextSizeState(s);
    setTextSize(s);
  };

  const onClearAll = () => {
    clearAllLocalData();
    setBaseUrl(DEFAULT_BASE_URL);
    setApiKey("");
    setModel(DEFAULT_MODEL);
    setConn({ kind: "unconfigured" });
    setTestResult(null);
    setStyle("digest");
    setDepts(new Set(DEPARTMENTS.map((d) => d.id)));
    setReduceMotionState(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
    setTextSizeState("m");
    applyTextSize("m");
    setCacheInfo(null);
    setConfirmOpen(false);
    toast.success("Local data cleared");
  };

  return (
    <div className="hero-gradient px-5 pb-12 pt-6">
      <Toaster
        theme="dark"
        position="top-center"
        toastOptions={{
          style: {
            background: "#0D2440",
            border: "1px solid #13315C",
            color: "#F7F3EA",
          },
        }}
      />

      {/* ---------------- Section 1 — header ---------------- */}
      <header>
        {[
          <p key="e" className="meta-label text-gold-300">
            Configure
          </p>,
          <h1 key="t" className="mt-2 font-display text-[2rem] font-bold text-ivory">
            Settings
          </h1>,
          <p key="s" className="mt-2 text-[0.9375rem] text-ivory/70">
            Everything here stays on this device.
          </p>,
        ].map((node, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08, ease: EASE }}
          >
            {node}
          </motion.div>
        ))}
      </header>

      <div className="mt-6 space-y-5">
        {/* ---------------- Section 2 — AI provider ---------------- */}
        <Card shimmer flash={flash}>
          <div className="flex items-center justify-between gap-3">
            <CardHeading>AI Digest Provider</CardHeading>
            <StatusPill conn={conn} />
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="ai-base-url" className="meta-label text-ivory/60">
                Base URL
              </label>
              <Input
                id="ai-base-url"
                className={cn(inputCls, "mt-1.5")}
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={DEFAULT_BASE_URL}
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                inputMode="url"
              />
              <p className="mt-1.5 text-xs leading-relaxed text-ivory/50">
                Works with OpenAI, OpenRouter, Azure OpenAI-style endpoints, LM
                Studio, Ollama, and any /v1/chat/completions-compatible server.
              </p>
            </div>

            <div>
              <label htmlFor="ai-api-key" className="meta-label text-ivory/60">
                API Key
              </label>
              <div className="relative mt-1.5">
                <Input
                  id="ai-api-key"
                  type={showKey ? "text" : "password"}
                  className={cn(inputCls, "pr-12")}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-…"
                  autoCapitalize="off"
                  autoCorrect="off"
                  spellCheck={false}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  aria-label={showKey ? "Hide API key" : "Show API key"}
                  className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-ivory/60 hover:text-gold-300"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-ivory/50">
                Stored only in this browser&apos;s local storage. Never sent
                anywhere except the Base URL above.
              </p>
            </div>

            <div>
              <label htmlFor="ai-model" className="meta-label text-ivory/60">
                Model
              </label>
              <Input
                id="ai-model"
                className={cn(inputCls, "mt-1.5")}
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={DEFAULT_MODEL}
                list="model-suggestions"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <datalist id="model-suggestions">
                {MODEL_SUGGESTIONS.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </div>

            {/* test connection */}
            <button
              onClick={onTest}
              disabled={testing}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-ivory/40 text-sm font-semibold text-ivory transition-colors hover:border-gold-500/70 hover:text-gold-300 active:scale-[0.98] disabled:opacity-70"
            >
              {testing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PlugZap className="h-4 w-4" />
              )}
              {testing ? "Testing…" : "Test connection"}
            </button>

            <AnimatePresence initial={false}>
              {testResult && (
                <motion.div
                  key={testResult.ok ? "ok" : `fail-${testResult.message}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="overflow-hidden"
                >
                  {testResult.ok ? (
                    <p className="flex items-center gap-2 rounded-xl bg-dept-green/15 px-4 py-3 text-sm font-medium text-[#7FD4B6]">
                      <Check className="h-4 w-4 shrink-0" />
                      Connected · {testResult.latency}ms
                    </p>
                  ) : (
                    <p className="rounded-xl bg-event-red/20 px-4 py-3 text-sm leading-relaxed text-[#F2B0A8]">
                      {testResult.message}
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-3">
              <button
                onClick={onSave}
                className="flex h-12 flex-1 items-center justify-center rounded-full bg-gold-500 text-sm font-semibold text-navy-950 transition-transform active:scale-[0.98]"
              >
                Save
              </button>
              <button
                onClick={onClearKey}
                className="flex h-12 items-center justify-center rounded-full px-5 text-sm font-semibold text-[#E8837A] transition-colors hover:bg-event-red/15"
              >
                Clear key
              </button>
            </div>
          </div>
        </Card>

        {/* ---------------- Section 3 — digest controls ---------------- */}
        <Card delay={0.1}>
          <CardHeading>Digest Controls</CardHeading>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="meta-label text-ivory/60">
              {cacheInfo
                ? `Cached digest · generated ${format(
                    parseISO(cacheInfo.generatedAt),
                    "MMM d, h:mm a",
                  )} · ${cacheInfo.label}`
                : "No cached digest — regenerates on next view"}
            </p>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={onRegenerate}
              disabled={regenerating}
              className="flex h-11 items-center justify-center gap-2 rounded-full border border-gold-500/70 px-5 text-sm font-semibold text-gold-400 transition-colors hover:bg-gold-500/10 active:scale-95 disabled:opacity-70"
            >
              {regenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {regenerating ? "Summarizing…" : "Regenerate now"}
            </button>
            <button
              onClick={onClearCache}
              className="flex h-11 items-center px-2 text-sm font-semibold text-ivory/60 underline-offset-4 hover:text-gold-300 hover:underline"
            >
              Clear cache
            </button>
          </div>

          <p className="meta-label mt-6 text-ivory/60">Digest style</p>
          <div className="mt-2">
            <Segmented
              options={DIGEST_STYLES}
              value={style}
              onChange={onStyleChange}
              pillId="digest-style-pill"
              ariaLabel="Digest style"
            />
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-ivory/50">
            Summary: announcement titles only — instant, no AI key needed.
            Digest: each title plus a one-sentence summary, written by your AI
            provider (built-in local summary without a key). Changing this
            clears the cached digest and applies the next time you open the
            Digest tab.
          </p>

          <p className="meta-label mt-6 text-ivory/60">Include departments</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEPARTMENTS.map((d) => {
              const on = depts.has(d.id);
              return (
                <button
                  key={d.id}
                  onClick={() => toggleDept(d.id)}
                  aria-pressed={on}
                  className="flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors"
                  style={
                    on
                      ? {
                          borderColor: d.color,
                          backgroundColor: `${d.color}26`,
                          color: "#F7F3EA",
                        }
                      : {
                          borderColor: "rgba(247,243,234,0.15)",
                          color: "rgba(247,243,234,0.55)",
                        }
                  }
                >
                  <AnimatePresence initial={false}>
                    {on && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 20 }}
                        className="inline-flex"
                      >
                        <Check className="h-3.5 w-3.5" style={{ color: d.color }} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {d.name}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs text-ivory/50">
            Excluded departments are omitted from the digest prompt.
          </p>
        </Card>

        {/* ---------------- Section 4 — appearance & data ---------------- */}
        <Card delay={0.2}>
          <CardHeading>Appearance &amp; Data</CardHeading>

          <button
            onClick={() => onReduceMotion(!reduceMotion)}
            className="mt-4 flex min-h-[44px] w-full items-center justify-between gap-3 text-left"
            aria-pressed={reduceMotion}
          >
            <span>
              <span className="block text-sm font-semibold text-ivory">
                Reduce motion
              </span>
              <span className="mt-0.5 block text-xs text-ivory/50">
                Mirrors your system setting; override it here.
              </span>
            </span>
            <Switch
              checked={reduceMotion}
              onCheckedChange={onReduceMotion}
              onClick={(e) => e.stopPropagation()}
              aria-label="Reduce motion"
              className="h-7 w-12 border-navy-800 data-[state=checked]:bg-gold-500 data-[state=unchecked]:bg-navy-800 [&>span]:size-5 [&>span]:data-[state=checked]:translate-x-[calc(100%+6px)]"
            />
          </button>
          <AnimatePresence initial={false}>
            {reduceMotion && (
              <motion.p
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden text-xs text-gold-300"
              >
                Animations minimized.
              </motion.p>
            )}
          </AnimatePresence>

          <p className="meta-label mt-6 text-ivory/60">Text size</p>
          <div className="mt-2">
            <Segmented
              options={TEXT_SIZES}
              value={textSize}
              onChange={onTextSize}
              pillId="text-size-pill"
              ariaLabel="Text size"
            />
          </div>

          <div className="mt-6 border-t border-navy-800 pt-5">
            <p className="meta-label text-event-red">Danger zone</p>
            <button
              onClick={() => setConfirmOpen(true)}
              className="mt-2 flex min-h-[44px] items-center gap-2 text-sm font-semibold text-[#E8837A] underline-offset-4 hover:underline"
            >
              <Trash2 className="h-4 w-4" />
              Clear all local data
            </button>
          </div>
        </Card>

        {/* ---------------- Section 5 — about link ---------------- */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.4, delay: 0.25, ease: EASE }}
        >
          <Link
            to="/about"
            className="flex min-h-[56px] items-center gap-3 rounded-2xl bg-navy-900 px-5 py-4 transition-colors hover:bg-navy-800"
          >
            <img src="/crest.svg" alt="" className="h-7 w-7 shrink-0" />
            <span className="flex-1 text-sm font-semibold text-ivory">
              About Student Notes &amp; IT integration
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-gold-500" />
          </Link>
        </motion.div>
      </div>

      {/* ---------------- Confirm dialog — clear all ---------------- */}
      <AnimatePresence>
        {confirmOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-[80] bg-navy-950/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setConfirmOpen(false)}
            />
            <div className="pointer-events-none fixed inset-0 z-[90] flex items-center justify-center p-6">
              <motion.div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="clear-data-title"
                className="pointer-events-auto w-full max-w-[360px] rounded-2xl border border-navy-800 bg-navy-900 p-5 shadow-2xl"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: EASE }}
              >
                <h2
                  id="clear-data-title"
                  className="font-display text-[1.125rem] font-semibold text-ivory"
                >
                  Clear all local data?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ivory/70">
                  This removes your API key, cached digest, and drafts on this
                  device.
                </p>
                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => setConfirmOpen(false)}
                    className="flex h-11 flex-1 items-center justify-center rounded-full border border-ivory/30 text-sm font-semibold text-ivory transition-colors hover:border-gold-500/60"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onClearAll}
                    className="flex h-11 flex-1 items-center justify-center rounded-full bg-event-red text-sm font-semibold text-ivory transition-transform active:scale-95"
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

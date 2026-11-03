"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m, useReducedMotion } from "motion/react";

// Adapted from 21st.dev progressive-flux-loader (Isaac chose its look, shortened). The bar
// climbs on a timer for smoothness but is gated like the Upload button: it stops at
// HOLD_PCT until the caller reaches the real done step (only after the 2xx), and the
// caller unmounts it on error, so it can't show "complete" for a save that failed.
// No percentage is shown as text or announced. Must render inside LazyMotion
// (import-sheet provides it), so only m.* is used.

export const CLIMB_MS = 5000;
export const HOLD_PCT = 90;
export const STILL_SAVING_MS = 3000;
const TICK_MS = 100;

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;
const FLUX_FROM = "var(--flux-from, #1d6ffb)";
const FLUX_TO = "var(--flux-to, #74e1ff)";
const FLUX_MID = `color-mix(in oklab, ${FLUX_FROM}, ${FLUX_TO})`;
const FLUX_GRADIENT = `linear-gradient(90deg, ${FLUX_FROM} 0%, ${FLUX_MID} 35%, ${FLUX_TO} 55%, ${FLUX_MID} 78%, ${FLUX_FROM} 100%)`;
const BAR_GLOW = `0 0 18px color-mix(in oklab, ${FLUX_FROM} 55%, transparent), 0 0 32px color-mix(in oklab, ${FLUX_TO} 40%, transparent), inset 0 1.5px 0 rgba(255, 255, 255, 0.5), inset 0 -2px 3px rgba(0, 40, 120, 0.35)`;
const SHEEN_GRADIENT = "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.55) 50%, transparent 100%)";

export interface ImportProgressProps {
  steps: [string, string, string];
  activeStep: 0 | 1 | 2;
}

/** Bar position for the time since saving started; never past HOLD_PCT until done. */
export function progressPercent(elapsedMs: number, done: boolean) {
  if (done) return 100;
  return Math.min(HOLD_PCT, Math.round((Math.max(0, elapsedMs) / CLIMB_MS) * HOLD_PCT));
}

/** Original phases (uploading → processing → finalizing → complete) with real step text: the
 *  real step moves the label forward, the timer only adds "Finalizing" and "Still saving…". */
export function progressLabel(steps: ImportProgressProps["steps"], activeStep: 0 | 1 | 2, elapsedMs: number) {
  if (activeStep !== 1) return steps[activeStep];
  if (elapsedMs >= CLIMB_MS + STILL_SAVING_MS) return "Still saving…";
  if (progressPercent(elapsedMs, false) >= 75) return "Finalizing";
  return steps[1];
}

function useElapsed(stopped: boolean) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (stopped) return;
    const start = Date.now();
    const timer = window.setInterval(() => {
      const next = Date.now() - start;
      setElapsed(next);
      // Nothing changes after "Still saving…" until the real response
      if (next >= CLIMB_MS + STILL_SAVING_MS) window.clearInterval(timer);
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [stopped]);
  return elapsed;
}

function FluxLabel({ label, reduced }: { label: string; reduced: boolean }) {
  const base =
    "absolute inset-0 flex items-center justify-center text-center text-2xl font-semibold tracking-tight sm:text-3xl";

  if (reduced) {
    return (
      <div aria-hidden data-testid="progress-label" className={base}>
        {label}
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={label}
        aria-hidden
        data-testid="progress-label"
        className={base}
        style={{ transformStyle: "preserve-3d" }}
        initial={{ opacity: 0, z: -380, scale: 0.65, filter: "blur(14px)" }}
        animate={{
          opacity: [0, 1, 1, 1],
          z: [-380, 60, -8, 0],
          scale: [0.65, 1.08, 0.985, 1],
          filter: ["blur(14px)", "blur(0px)", "blur(0px)", "blur(0px)"],
        }}
        exit={{ opacity: 0, z: 220, scale: 1.35, filter: "blur(10px)", transition: { duration: 0.45, ease: [0.7, 0, 0.84, 0] } }}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
      >
        <span className="inline-flex">
          {Array.from(label).map((char, i) => (
            <m.span
              key={i}
              data-letter
              className="inline-block whitespace-pre"
              initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.45, ease: EASE_OUT_EXPO, delay: 0.18 + i * 0.035 }}
            >
              {char}
            </m.span>
          ))}
        </span>
      </m.div>
    </AnimatePresence>
  );
}

export function ImportProgress({ steps, activeStep }: ImportProgressProps) {
  const reduced = !!useReducedMotion();
  const done = activeStep === 2;
  const elapsed = useElapsed(done);
  const pct = progressPercent(elapsed, done);
  const label = progressLabel(steps, activeStep, elapsed);

  return (
    <div className="brand-surface flex w-full flex-col items-center gap-8 rounded-2xl px-6 py-12 text-[var(--brand-navy-fg)]">
      <div className="relative h-16 w-full select-none" style={reduced ? undefined : { perspective: "1000px" }}>
        <FluxLabel label={label} reduced={reduced} />
      </div>

      <div
        aria-hidden
        className="relative h-5 w-full max-w-md overflow-hidden rounded-full bg-white/10 shadow-[inset_0_2px_3px_rgba(0,0,0,0.45),inset_0_-1px_2px_rgba(255,255,255,0.05)]"
      >
        <m.div
          data-testid="progress-bar"
          data-progress={pct}
          className="absolute inset-0 overflow-hidden rounded-full"
          style={{ originX: 0, background: FLUX_GRADIENT, boxShadow: reduced ? undefined : BAR_GLOW }}
          initial={false}
          animate={{ scaleX: pct / 100 }}
          transition={reduced ? { duration: 0 } : { duration: 0.55, ease: EASE_OUT_EXPO }}
        >
          {!reduced && !done ? (
            <m.span
              data-testid="progress-sheen"
              className="pointer-events-none absolute inset-y-0 left-0 w-1/2 rounded-full"
              style={{ background: SHEEN_GRADIENT, mixBlendMode: "screen" }}
              animate={{ x: ["-110%", "210%"] }}
              transition={{ duration: 1.6, ease: "linear", repeat: Infinity }}
            />
          ) : null}
        </m.div>
      </div>

      <p className="sr-only" aria-live="polite">
        {label}
      </p>
    </div>
  );
}

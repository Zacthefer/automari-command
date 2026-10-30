"use client";

// TEMPORARY: deleted with src/app/dev before merge (job 005, AC34).
// Left: the 21st.dev progressive-flux-loader, ported to motion/react
// with its own fake-percentage driver. Right: our ImportProgress, driven by the same
// hold rules as useCsvImport (each step ≥ 700ms, done only after the "response").

import * as React from "react";
import { AnimatePresence, LazyMotion, domAnimation, motion, useReducedMotion, type Transition } from "motion/react";
import { Button } from "@/components/ui/button";
import { ImportProgress } from "@/components/imports/import-progress";
import { STEP_HOLD_MS } from "@/components/imports/use-csv-import";

// ── 21st.dev original, ported ───────────────────────────────────────────────

interface ProgressiveFluxPhase {
  at: number;
  label: string;
}

const FLUX_FROM = "var(--flux-from, #1d6ffb)";
const FLUX_TO = "var(--flux-to, #74e1ff)";
const FLUX_MID = `color-mix(in oklab, ${FLUX_FROM}, ${FLUX_TO})`;
const DEFAULT_GRADIENT = `linear-gradient(90deg, ${FLUX_FROM} 0%, ${FLUX_MID} 35%, ${FLUX_TO} 55%, ${FLUX_MID} 78%, ${FLUX_FROM} 100%)`;
const BAR_SHADOW = `0 0 18px color-mix(in oklab, ${FLUX_FROM} 55%, transparent), 0 0 32px color-mix(in oklab, ${FLUX_TO} 40%, transparent), inset 0 1.5px 0 rgba(255, 255, 255, 0.5), inset 0 -2px 3px rgba(0, 40, 120, 0.35)`;
const SHEEN_GRADIENT = "linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.55) 50%, transparent 100%)";
const Z_TRANSITION: Transition = { duration: 0.9, ease: [0.22, 1, 0.36, 1] };
const LETTER_TRANSITION: Transition = { duration: 0.45, ease: [0.22, 1, 0.36, 1] };

// The original demo's phases
const DEMO_PHASES: ProgressiveFluxPhase[] = [
  { at: 0, label: "uploading" },
  { at: 40, label: "processing" },
  { at: 75, label: "finalizing" },
  { at: 100, label: "complete" },
];

function pickLabel(value: number, phases: ProgressiveFluxPhase[]) {
  let active = phases[0]?.label ?? "";
  for (const phase of phases) if (value >= phase.at) active = phase.label;
  return active;
}

function FluxLabel({ label, reduced }: { label: string; reduced: boolean }) {
  const base =
    "absolute inset-0 flex items-center justify-center text-center text-3xl font-semibold tracking-tight text-muted-foreground sm:text-4xl";
  if (reduced) {
    return (
      <div aria-hidden className={base}>
        {label}
      </div>
    );
  }
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={label}
        aria-hidden
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
        transition={Z_TRANSITION}
      >
        <span className="inline-flex">
          {label.split("").map((char, index) => (
            <motion.span
              key={`${label}-${index}`}
              className="inline-block"
              initial={{ opacity: 0, y: 12, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ ...LETTER_TRANSITION, delay: 0.18 + index * 0.035 }}
            >
              {char === " " ? " " : char}
            </motion.span>
          ))}
        </span>
      </motion.div>
    </AnimatePresence>
  );
}

function ProgressiveFluxLoader({ value }: { value: number }) {
  const reduced = !!useReducedMotion();
  const current = Math.min(100, Math.max(0, value));
  const label = pickLabel(current, DEMO_PHASES);
  const rounded = Math.round(current);
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-8">
      <div className="relative h-16 w-full select-none" style={reduced ? undefined : { perspective: "1000px" }}>
        <FluxLabel label={label} reduced={reduced} />
      </div>
      <div
        className="relative h-5 w-full overflow-hidden rounded-full bg-muted shadow-[inset_0_2px_3px_rgba(0,0,0,0.09),inset_0_-1px_2px_rgba(255,255,255,0.7)]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={rounded}
        aria-valuetext={`${rounded}% – ${label}`}
        aria-label="Loading"
      >
        <motion.div
          className="relative h-full rounded-full"
          style={{ background: DEFAULT_GRADIENT, boxShadow: BAR_SHADOW }}
          initial={false}
          animate={{ width: `${current}%` }}
          transition={reduced ? { duration: 0 } : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          {!reduced && (
            <motion.span
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-1/2 rounded-full"
              style={{ background: SHEEN_GRADIENT, mixBlendMode: "screen" }}
              animate={{ x: ["-110%", "210%"] }}
              transition={{ duration: 1.6, ease: "linear", repeat: Infinity }}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ── Drivers ─────────────────────────────────────────────────────────────────

type Speed = "fast" | "slow";
// Simulated confirm round trip
const SERVER_MS: Record<Speed, number> = { fast: 10, slow: 4000 };

/** The original demo's fake driver: +2% per tick (200ms in the demo; 40ms for "fast"). */
function useFakePercent(run: number, speed: Speed) {
  const [value, setValue] = React.useState(0);
  React.useEffect(() => {
    let current = 0;
    const timer = window.setInterval(
      () => {
        current = Math.min(100, current + 2);
        setValue(current);
        if (current >= 100) window.clearInterval(timer);
      },
      speed === "fast" ? 40 : 200
    );
    return () => {
      window.clearInterval(timer);
      setValue(0);
    };
  }, [run, speed]);
  return value;
}

/** Same hold rules as useCsvImport's confirming/done states. */
function useHeldSteps(run: number, speed: Speed) {
  const [step, setStep] = React.useState<0 | 1 | 2>(0);
  React.useEffect(() => {
    const timers: number[] = [];
    let responded = false;
    let stepOneAt = Infinity;
    const finish = () => setStep(2);
    timers.push(
      window.setTimeout(() => {
        setStep(1);
        stepOneAt = Date.now();
        timers.push(window.setTimeout(() => responded && finish(), STEP_HOLD_MS));
      }, STEP_HOLD_MS)
    );
    timers.push(
      window.setTimeout(() => {
        responded = true;
        if (Date.now() - stepOneAt >= STEP_HOLD_MS) finish();
      }, SERVER_MS[speed])
    );
    return () => {
      timers.forEach((t) => window.clearTimeout(t));
      setStep(0);
    };
  }, [run, speed]);
  return step;
}

function Panel({ title, children, onReplay, speed, onSpeed }: {
  title: string;
  children: React.ReactNode;
  onReplay: () => void;
  speed: Speed;
  onSpeed: (speed: Speed) => void;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        <div className="flex gap-2">
          {(["fast", "slow"] as const).map((s) => (
            <Button
              key={s}
              type="button"
              size="sm"
              variant={speed === s ? "default" : "outline"}
              aria-pressed={speed === s}
              onClick={() => onSpeed(s)}
            >
              {s === "fast" ? "Fast server" : "Slow server"}
            </Button>
          ))}
          <Button type="button" size="sm" variant="outline" onClick={onReplay}>
            Replay
          </Button>
        </div>
      </div>
      <div className="flex min-h-64 items-center justify-center">{children}</div>
    </section>
  );
}

function OriginalColumn() {
  const [run, setRun] = React.useState(0);
  const [speed, setSpeed] = React.useState<Speed>("fast");
  const value = useFakePercent(run, speed);
  return (
    <Panel
      title="21st.dev original (ported to motion/react)"
      onReplay={() => setRun((r) => r + 1)}
      speed={speed}
      onSpeed={setSpeed}
    >
      <ProgressiveFluxLoader value={value} />
    </Panel>
  );
}

function OursColumn() {
  const [run, setRun] = React.useState(0);
  const [speed, setSpeed] = React.useState<Speed>("fast");
  const step = useHeldSteps(run, speed);
  return (
    <Panel title="Automari" onReplay={() => setRun((r) => r + 1)} speed={speed} onSpeed={setSpeed}>
      <LazyMotion features={domAnimation} strict>
        <ImportProgress steps={["Uploading file", "Saving 297 trucks", "297 trucks added ✓"]} activeStep={step} />
      </LazyMotion>
    </Panel>
  );
}

export default function MotionCompareClient() {
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-8">
      <header>
        <h1 className="text-2xl font-medium tracking-[-0.025em] text-foreground">Import loader: original vs ours</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Temporary dev page for sign-off. Deleted before merge. Not available in production builds.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <OriginalColumn />
        <OursColumn />
      </div>
    </main>
  );
}

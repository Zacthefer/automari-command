"use client";

import { m, useReducedMotion } from "motion/react";

// Adapted from 21st.dev progressive-flux-loader. The original drove its label from a fake
// percentage; here each step is a real event (request sent, response received) and the
// caller holds each step on screen. No percentages are shown. Must render inside
// LazyMotion (import-sheet provides it), so only m.* is used.

const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as const;
const LETTER_STAGGER_S = 0.035;

export interface ImportProgressProps {
  steps: [string, string, string];
  activeStep: 0 | 1 | 2;
}

export function ImportProgress({ steps, activeStep }: ImportProgressProps) {
  const reduced = useReducedMotion();
  const label = steps[activeStep];

  return (
    <div className="brand-surface flex w-full flex-col items-center gap-8 rounded-2xl px-6 py-12 text-[var(--brand-navy-fg)]">
      <div
        className="flex h-10 w-full items-center justify-center text-center text-lg font-medium tracking-tight sm:text-xl"
        style={reduced ? undefined : { perspective: "600px" }}
      >
        {reduced ? (
          <span aria-hidden data-testid="progress-label">
            {label}
          </span>
        ) : (
          <span
            key={activeStep}
            aria-hidden
            data-testid="progress-label"
            className="inline-flex"
            style={{ transformStyle: "preserve-3d" }}
          >
            {Array.from(label).map((char, i) => (
              <m.span
                key={i}
                data-letter
                className="inline-block whitespace-pre"
                initial={{ opacity: 0, rotateX: -70, y: 12, z: -40, filter: "blur(6px)" }}
                animate={{ opacity: 1, rotateX: 0, y: 0, z: 0, filter: "blur(0px)" }}
                transition={{ duration: 0.45, ease: EASE_OUT_EXPO, delay: i * LETTER_STAGGER_S }}
              >
                {char}
              </m.span>
            ))}
          </span>
        )}
      </div>

      <div aria-hidden className="relative h-2 w-full max-w-md overflow-hidden rounded-full bg-white/10">
        <m.div
          className="absolute inset-0 overflow-hidden rounded-full bg-[var(--brand-cyan)] shadow-[0_0_16px_rgba(0,191,255,0.45)]"
          style={{ originX: 0 }}
          initial={reduced ? false : { scaleX: 0 }}
          animate={{ scaleX: (activeStep + 1) / 3 }}
          transition={reduced ? { duration: 0 } : { duration: 0.55, ease: EASE_OUT_EXPO }}
        >
          {!reduced && activeStep < 2 ? (
            <m.div
              data-testid="progress-sheen"
              className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/55 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: ["-100%", "200%"] }}
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

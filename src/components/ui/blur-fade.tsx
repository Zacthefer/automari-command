"use client";

import { Children, isValidElement, type ReactNode } from "react";
import { m, type Variants } from "motion/react";

// Ported from Magic UI's Blur Fade (21st.dev): a short fade-and-rise, delayed per item so a
// page's sections arrive one after another. Changes from the original: motion/react's `m`
// instead of framer-motion (AppShell provides LazyMotion), no blur (costly on large tables on
// every page change), no in-view trigger (pages animate on arrival, not on scroll), and it
// settles at y: 0 so content ends exactly where the layout puts it.

const STAGGER_SECONDS = 0.05;
const MAX_STAGGER_STEPS = 3;

interface BlurFadeProps {
  children: ReactNode;
  className?: string;
  duration?: number;
  delay?: number;
  yOffset?: number;
}

export function BlurFade({ children, className, duration = 0.4, delay = 0, yOffset = 12 }: BlurFadeProps) {
  const variants: Variants = {
    hidden: { y: yOffset, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };
  return (
    <m.div
      initial="hidden"
      animate="visible"
      variants={variants}
      transition={{ delay: 0.04 + delay, duration, ease: "easeOut" }}
      className={className}
    >
      {children}
    </m.div>
  );
}

/** Seconds before the section at `index` starts; later sections share the last step. */
export function staggerDelay(index: number) {
  return Math.min(index, MAX_STAGGER_STEPS) * STAGGER_SECONDS;
}

/** A page's top-level stack: each section fades up, one after another. */
export function BlurFadeStack({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      {Children.toArray(children).map((child, index) => (
        // A section that renders nothing must not leave an empty wrapper (and its gap) behind
        <BlurFade
          key={isValidElement(child) && child.key != null ? child.key : index}
          delay={staggerDelay(index)}
          className="empty:hidden"
        >
          {child}
        </BlurFade>
      ))}
    </div>
  );
}

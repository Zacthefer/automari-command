"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export interface MetricIconProps {
  size?: number;
  className?: string;
  /** Soft continuous presence — default on */
  ambient?: boolean;
}

const ease = [0.22, 1, 0.36, 1] as const;

const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (delay = 0) => ({
    pathLength: 1,
    opacity: 1,
    transition: { duration: 0.9, delay, ease },
  }),
};

const fade = {
  hidden: { opacity: 0 },
  visible: (delay = 0) => ({
    opacity: 1,
    transition: { duration: 0.7, delay, ease },
  }),
};

function Frame({
  size = 28,
  className,
  ambient = true,
  children,
}: MetricIconProps & { children: ReactNode }) {
  return (
    <motion.svg
      viewBox="0 0 40 40"
      fill="none"
      className={cn(className)}
      style={{ width: size, height: size }}
      initial="hidden"
      animate="visible"
      whileHover={{ opacity: 1 }}
    >
      <motion.g
        animate={
          ambient
            ? { opacity: [0.82, 1, 0.82] }
            : { opacity: 1 }
        }
        transition={
          ambient
            ? { duration: 10, repeat: Infinity, ease: "easeInOut" }
            : undefined
        }
      >
        {children}
      </motion.g>
    </motion.svg>
  );
}

/** Cost / mile — quiet arc + settled needle */
export function CostGaugeIcon(props: MetricIconProps) {
  return (
    <Frame {...props}>
      <motion.path
        d="M9 25.5a11 11 0 0 1 22 0"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        variants={draw}
        custom={0.05}
      />
      <motion.path
        d="M11.5 25.5a8.5 8.5 0 0 1 17 0"
        stroke="currentColor"
        strokeWidth={1.25}
        strokeLinecap="round"
        opacity={0.35}
        variants={draw}
        custom={0.15}
      />
      <motion.line
        x1="20"
        y1="25.5"
        x2="20"
        y2="15.2"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        variants={fade}
        custom={0.35}
        style={{ transformOrigin: "20px 25.5px", rotate: 28 }}
      />
      <motion.circle cx="20" cy="25.5" r="1.55" fill="currentColor" variants={fade} custom={0.4} />
    </Frame>
  );
}

/** Revenue — ascending polyline with restrained arrow */
export function RevenueTrendIcon(props: MetricIconProps) {
  return (
    <Frame {...props}>
      <motion.path
        d="M8 27.5 15.5 19.5 20.5 23 29.5 12.5"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={draw}
        custom={0.08}
      />
      <motion.path
        d="M24.5 12.5h5.5v5.5"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={draw}
        custom={0.35}
      />
    </Frame>
  );
}

/** Profit — thin ring + precise dollar glyph */
export function ProfitPulseIcon(props: MetricIconProps) {
  return (
    <Frame {...props}>
      <motion.circle
        cx="20"
        cy="20"
        r="11.5"
        stroke="currentColor"
        strokeWidth={1.5}
        variants={draw}
        custom={0.05}
      />
      <motion.path
        d="M20 12.8v14.4M16.6 15.6c.55-1.05 1.7-1.7 3.4-1.7 1.95 0 3.25.9 3.25 2.45 0 3.35-6.7 1.65-6.7 4.75 0 1.5 1.45 2.5 3.45 2.5 1.7 0 2.95-.7 3.55-1.85"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={draw}
        custom={0.28}
      />
    </Frame>
  );
}

/** Miles — topographic path with quiet nodes */
export function MilesRouteIcon(props: MetricIconProps) {
  return (
    <Frame {...props}>
      <motion.path
        d="M7.5 26.5h6.5l3-7 3.8 9 3-6.5H32"
        stroke="currentColor"
        strokeWidth={1.55}
        strokeLinecap="round"
        strokeLinejoin="round"
        variants={draw}
        custom={0.1}
      />
      <motion.circle cx="10" cy="12.5" r="1.6" fill="currentColor" variants={fade} custom={0.35} />
      <motion.circle cx="20" cy="11" r="1.6" fill="currentColor" variants={fade} custom={0.45} />
      <motion.circle cx="30" cy="13" r="1.6" fill="currentColor" variants={fade} custom={0.55} />
      <motion.path
        d="M11.5 12.8 18.5 11.3M21.5 11.3 28.5 12.8"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.4}
        variants={draw}
        custom={0.5}
      />
    </Frame>
  );
}

/** Trucks — precise silhouette, no bouncing */
export function TruckMotionIcon(props: MetricIconProps) {
  return (
    <Frame {...props}>
      <motion.path
        d="M6.5 15h13.5v9.5H6.5z"
        stroke="currentColor"
        strokeWidth={1.55}
        strokeLinejoin="round"
        variants={draw}
        custom={0.08}
      />
      <motion.path
        d="M20 18h6.2L30.5 22v2.5H20"
        stroke="currentColor"
        strokeWidth={1.55}
        strokeLinejoin="round"
        variants={draw}
        custom={0.22}
      />
      <motion.circle
        cx="12"
        cy="27"
        r="2.15"
        stroke="currentColor"
        strokeWidth={1.45}
        variants={fade}
        custom={0.4}
      />
      <motion.circle
        cx="25.5"
        cy="27"
        r="2.15"
        stroke="currentColor"
        strokeWidth={1.45}
        variants={fade}
        custom={0.48}
      />
    </Frame>
  );
}

/** Drivers — primary figure + quiet secondary */
export function DriversMotionIcon(props: MetricIconProps) {
  return (
    <Frame {...props}>
      <motion.circle
        cx="15.5"
        cy="13.5"
        r="3.6"
        stroke="currentColor"
        strokeWidth={1.55}
        variants={draw}
        custom={0.08}
      />
      <motion.path
        d="M8 28c.7-4.6 3.2-7 7.5-7s6.8 2.4 7.5 7"
        stroke="currentColor"
        strokeWidth={1.55}
        strokeLinecap="round"
        variants={draw}
        custom={0.22}
      />
      <motion.circle
        cx="26.5"
        cy="14.5"
        r="2.9"
        stroke="currentColor"
        strokeWidth={1.4}
        opacity={0.7}
        variants={draw}
        custom={0.35}
      />
      <motion.path
        d="M22 28c.35-3 1.85-4.6 4.4-4.6 1.9 0 3.35.95 4.1 2.7"
        stroke="currentColor"
        strokeWidth={1.4}
        strokeLinecap="round"
        opacity={0.7}
        variants={draw}
        custom={0.45}
      />
    </Frame>
  );
}

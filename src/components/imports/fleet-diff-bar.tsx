"use client";

import { m, useReducedMotion } from "motion/react";
import type { ImportCounts } from "@/types/imports";

// What the import will do to the fleet. The bar is decoration; the legend carries
// every count as text, so the bar is hidden from screen readers.

const SEGMENTS = [
  { key: "created", label: "Create", swatch: "bg-[var(--brand-cyan)]" },
  { key: "filled", label: "Fill", swatch: "bg-[var(--brand-cyan-soft)]" },
  { key: "unchanged", label: "Unchanged", swatch: "bg-muted-foreground/30" },
  { key: "skipped", label: "Skip", swatch: "bg-destructive/70" },
] as const;

const format = (n: number) => n.toLocaleString("en-US");

export function FleetDiffBar({ counts }: { counts: ImportCounts }) {
  const reduced = useReducedMotion();
  const shown = SEGMENTS.filter((segment) => counts[segment.key] > 0);

  return (
    <div className="space-y-3">
      <div aria-hidden className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-muted">
        {shown.map((segment, i) => {
          const width = `${(counts[segment.key] / counts.rows_total) * 100}%`;
          return reduced ? (
            <div key={segment.key} className={segment.swatch} style={{ width }} />
          ) : (
            <m.div
              key={segment.key}
              className={segment.swatch}
              style={{ width, originX: 0 }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.3, delay: i * 0.04, ease: "easeOut" }}
            />
          );
        })}
      </div>
      <ul className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
        {SEGMENTS.map((segment) => (
          <li key={segment.key} className="inline-flex items-center gap-1.5">
            <span aria-hidden className={`size-2.5 rounded-full ${segment.swatch}`} />
            <span>
              {segment.label} <span className="font-medium text-foreground tabular-nums">{format(counts[segment.key])}</span>
            </span>
          </li>
        ))}
        {counts.warnings > 0 ? (
          <li className="tabular-nums">
            {format(counts.warnings)} {counts.warnings === 1 ? "row" : "rows"} with warnings
          </li>
        ) : null}
      </ul>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState, type CSSProperties, type Ref, type RefObject } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { prefersReducedMotion, prefetchImportIo, type ImportState } from "@/components/imports/use-csv-import";

// Adapted from 21st.dev button-6 (hover roll) and save-with-progress (ring face). CSS only:
// this sits in the page bundle, so it imports nothing from motion. The ring is a timer,
// gated on the real response: it creeps to 95% while waiting and only the hook's
// "checked" state (a successful preview) can take it to 100%.

const RING_RADIUS = 8;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
const RING_FIRST_TARGET_MS = 1200;

function ProgressRing({ done }: { done: boolean }) {
  const [target, setTarget] = useState<90 | 95>(90);

  useEffect(() => {
    const timer = window.setTimeout(() => setTarget(95), RING_FIRST_TARGET_MS);
    return () => window.clearTimeout(timer);
  }, []);

  const progress = done ? 100 : target;
  const transition = done ? "300ms" : target === 90 ? "1.2s" : "20s";

  return (
    <svg data-progress={progress} viewBox="0 0 20 20" className="size-[18px]" aria-hidden>
      <circle cx="10" cy="10" r={RING_RADIUS} fill="none" strokeWidth="2" className="stroke-[var(--brand-cyan-dim)]" />
      {/* Mounts at 90% and transitions in from empty via @starting-style */}
      <circle
        cx="10"
        cy="10"
        r={RING_RADIUS}
        fill="none"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray={RING_LENGTH}
        transform="rotate(-90 10 10)"
        className="stroke-[var(--brand-cyan)] [stroke-dashoffset:var(--ring-offset)] starting:[stroke-dashoffset:var(--ring-length)]"
        style={
          {
            "--ring-length": RING_LENGTH,
            "--ring-offset": RING_LENGTH * (1 - progress / 100),
            transition: `stroke-dashoffset ${transition} ease-out`,
          } as CSSProperties
        }
      />
      {done ? (
        <path
          data-testid="ring-check"
          d="M6.5 10.5l2.3 2.3 4.7-5"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          className="stroke-[var(--brand-cyan)] animate-[import-check-draw_150ms_ease-out_300ms_both]"
        />
      ) : null}
    </svg>
  );
}

export interface UploadCsvButtonProps {
  state: ImportState;
  onPick: (file: File) => void;
  onRetry: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
  /** Lets the import flow return focus here when the panel closes. */
  triggerRef?: Ref<HTMLButtonElement>;
  className?: string;
}

export function UploadCsvButton({ state, onPick, onRetry, inputRef, triggerRef, className }: UploadCsvButtonProps) {
  const prefetched = useRef(false);
  const status = state.status;
  const checking = status === "reading" || status === "checking";
  const checked = status === "checked";
  const reduced = (checking || checked) && prefersReducedMotion();
  const checkingText = status === "checking" && state.still ? "Still checking…" : "Checking…";

  // Warm the parser and API chunks as soon as the carrier shows intent
  function prefetch() {
    if (prefetched.current) return;
    prefetched.current = true;
    prefetchImportIo();
  }

  return (
    <div className={cn("flex flex-col items-end gap-2 text-right", className)}>
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        data-state={status}
        aria-busy={checking || undefined}
        disabled={status !== "idle"}
        onClick={() => inputRef.current?.click()}
        onPointerEnter={prefetch}
        onFocus={prefetch}
        className="group relative overflow-hidden motion-safe:hover:text-[var(--primary-foreground)] motion-safe:focus-visible:text-[var(--primary-foreground)] motion-reduce:hover:bg-[var(--brand-cyan-dim)]"
      >
        {status === "idle" ? (
          <span
            aria-hidden
            className="absolute inset-0 origin-left scale-x-0 bg-[var(--brand-cyan)] transition-transform duration-250 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:hidden"
          />
        ) : null}
        {checking || checked ? (
          <span className="relative inline-flex items-center gap-2">
            {reduced ? (checked ? <Check className="size-4" aria-hidden /> : null) : <ProgressRing done={checked} />}
            {checked ? <span className="sr-only">Checked</span> : <span>{checkingText}</span>}
          </span>
        ) : (
          <span className="relative block h-5 overflow-hidden leading-5">
            <span className="block transition-transform duration-250 ease-out motion-safe:group-hover:-translate-y-full motion-safe:group-focus-visible:-translate-y-full">
              Upload CSV
            </span>
            <span
              aria-hidden="true"
              className="block transition-transform duration-250 ease-out motion-safe:group-hover:-translate-y-full motion-safe:group-focus-visible:-translate-y-full"
            >
              Choose a CSV file
            </span>
          </span>
        )}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        tabIndex={-1}
        aria-hidden
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Reset so picking the same file again still fires change
          event.target.value = "";
          if (file) onPick(file);
        }}
      />
      <span role="status" className="sr-only">
        {checking ? checkingText : ""}
      </span>
      {status === "idle" && state.error ? (
        <div role="alert" className="max-w-sm text-sm">
          <p className="font-medium text-destructive">{state.error.message}</p>
          {state.error.fixHint ? <p className="mt-0.5 text-muted-foreground">{state.error.fixHint}</p> : null}
          {state.retry ? (
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={onRetry}>
              Try again
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

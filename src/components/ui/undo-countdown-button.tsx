"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Adapted from a 21st.dev undo-countdown button. The original committed from an
// animation's onfinish and didn't wait for the action; here a plain timer is the
// source of truth, the action is awaited, and a pending action is never dropped.

type Phase = "idle" | "pending" | "committing" | "done";

const isBusy = (phase: Phase) => phase === "pending" || phase === "committing";

const BAR_COLOR = {
  default: "bg-black/10",
  outline: "bg-[var(--brand-cyan-dim)]",
  destructive: "bg-destructive/15",
} as const;

export interface UndoCountdownButtonProps {
  label: ReactNode;
  /** The real action. Runs after the undo window; awaited before showing done. */
  onCommit: () => unknown;
  /** Called if onCommit throws; the button returns to idle so the user can retry. */
  onError?: (error: unknown) => void;
  /** True while the action is counting down or running, so the page can lock controls that would unmount the button. */
  onBusyChange?: (busy: boolean) => void;
  /** Milliseconds the action can still be undone. */
  undoWindow?: number;
  undoLabel?: string;
  committingLabel?: string;
  doneLabel?: string;
  /** Milliseconds to show the done label before returning to idle. */
  resetAfter?: number;
  icon?: ReactNode;
  variant?: keyof typeof BAR_COLOR;
  size?: "default" | "sm" | "lg";
  disabled?: boolean;
  className?: string;
}

export function UndoCountdownButton({
  label,
  onCommit,
  onError,
  onBusyChange,
  undoWindow = 5000,
  undoLabel = "Undo",
  committingLabel = "Working…",
  doneLabel = "Done",
  resetAfter = 1800,
  icon,
  variant = "default",
  size = "default",
  disabled = false,
  className,
}: UndoCountdownButtonProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(undoWindow / 1000));

  // Refs let timers and the unmount cleanup see the latest values
  const phaseRef = useRef<Phase>("idle");
  const mountedRef = useRef(false);
  const onCommitRef = useRef(onCommit);
  const onErrorRef = useRef(onError);
  const onBusyChangeRef = useRef(onBusyChange);
  const commitTimer = useRef<number | undefined>(undefined);
  const tickTimer = useRef<number | undefined>(undefined);
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    onCommitRef.current = onCommit;
    onErrorRef.current = onError;
    onBusyChangeRef.current = onBusyChange;
  });

  const goTo = useCallback((next: Phase) => {
    const wasBusy = isBusy(phaseRef.current);
    phaseRef.current = next;
    setPhase(next);
    if (wasBusy !== isBusy(next)) onBusyChangeRef.current?.(isBusy(next));
  }, []);

  const clearTimers = useCallback(() => {
    window.clearTimeout(commitTimer.current);
    window.clearInterval(tickTimer.current);
    window.clearTimeout(resetTimer.current);
  }, []);

  const commit = useCallback(async () => {
    clearTimers();
    goTo("committing");
    try {
      await onCommitRef.current();
      if (!mountedRef.current) return;
      goTo("done");
      resetTimer.current = window.setTimeout(() => goTo("idle"), resetAfter);
    } catch (error) {
      if (mountedRef.current) goTo("idle");
      onErrorRef.current?.(error);
    }
  }, [clearTimers, goTo, resetAfter]);

  function start() {
    if (disabled || phaseRef.current !== "idle") return;
    goTo("pending");
    setSecondsLeft(Math.ceil(undoWindow / 1000));
    const startedAt = Date.now();
    tickTimer.current = window.setInterval(() => {
      setSecondsLeft(Math.max(0, Math.ceil((undoWindow - (Date.now() - startedAt)) / 1000)));
    }, 200);
    commitTimer.current = window.setTimeout(() => void commit(), undoWindow);
  }

  function undo() {
    if (phaseRef.current !== "pending") return;
    clearTimers();
    goTo("idle");
  }

  // Leaving the page mid-countdown commits, like Gmail's undo send:
  // the user asked for the action, so it must not be silently dropped.
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimers();
      if (isBusy(phaseRef.current)) onBusyChangeRef.current?.(false);
      if (phaseRef.current === "pending") {
        Promise.resolve()
          .then(() => onCommitRef.current())
          .catch((error) => onErrorRef.current?.(error));
      }
    };
  }, [clearTimers]);

  // Closing the tab can't run async work reliably, so ask the browser to confirm
  useEffect(() => {
    if (phase !== "pending") return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase]);

  const pending = phase === "pending";

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      data-state={phase}
      aria-live="polite"
      disabled={disabled || phase === "committing"}
      onClick={pending ? undo : start}
      onKeyDown={(event) => {
        if (event.key === "Escape" && pending) {
          event.preventDefault();
          undo();
        }
      }}
      className={cn("relative overflow-hidden", className)}
    >
      {pending ? (
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 origin-left animate-[undo-countdown_linear_forwards] motion-reduce:hidden",
            BAR_COLOR[variant]
          )}
          style={{ animationDuration: `${undoWindow}ms` }}
        />
      ) : null}
      <span className="relative inline-flex items-center gap-2">
        {pending ? (
          <>
            <RotateCcw className="size-4" aria-hidden />
            <span>
              {undoLabel}
              <span className="font-mono tabular-nums"> · {secondsLeft}s</span>
            </span>
          </>
        ) : phase === "committing" ? (
          <>
            <Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
            <span>{committingLabel}</span>
          </>
        ) : phase === "done" ? (
          <>
            <Check className="size-4" aria-hidden />
            <span>{doneLabel}</span>
          </>
        ) : (
          <>
            {icon}
            <span>{label}</span>
          </>
        )}
      </span>
    </Button>
  );
}

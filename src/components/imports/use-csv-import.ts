"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  confirmImport,
  GENERIC_TEXT,
  ImportApiError,
  previewImport,
  type HeldFile,
} from "@/lib/api-imports";
import type { ParsedCsv } from "@/lib/csv-read";
import {
  BUG_PATH_CODES,
  ENTITY_NOUN,
  REPREVIEW_CODES,
  type ImportEntity,
  type ImportResponse,
} from "@/types/imports";

// The import state machine. Lives in the page bundle (the button's ring runs before the
// lazy panel loads), so it must not import motion or papaparse; csv-read is loaded with
// import(). Parsed rows, bytes and the preview token live in React state only.

export const CHECKED_HOLD_MS = 450;
export const CHECKED_HOLD_REDUCED_MS = 150;
export const STILL_CHECKING_MS = 3000;
export const STEP_HOLD_MS = 700;
export const DONE_HOLD_MS = 1000;

export const NOTE_CHANGED = "Something changed. Here's the updated preview.";
export const NOTE_UNKNOWN = "We couldn't confirm the import finished. Here's the current preview of your file.";

export interface ShownError {
  message: string;
  fixHint: string | null;
}

type Loaded = { file: HeldFile; parsed: ParsedCsv };

export type ImportState =
  | { status: "idle"; error?: ShownError; retry?: Loaded }
  | { status: "reading"; fileName: string }
  | ({ status: "checking"; still: boolean } & Loaded)
  | ({ status: "checked"; preview: ImportResponse } & Loaded)
  | ({
      status: "reviewing";
      preview: ImportResponse;
      note: string | null;
      error: ShownError | null;
      discardPrompt: boolean;
    } & Loaded)
  | ({
      status: "confirming";
      preview: ImportResponse;
      shownStep: 0 | 1;
      stepShownAt: number;
      result?: ImportResponse;
    } & Loaded)
  | { status: "done"; importing: number; createdIds: string[]; created: number; filled: number }
  // file/parsed are missing while a re-picked file is still being read
  | { status: "rechecking"; reason: "changed" | "unknown" | "repick"; file?: HeldFile; parsed?: ParsedCsv }
  | { status: "panelError"; error: ShownError };

export type ImportStatus = ImportState["status"];

export type ImportAction =
  | { type: "PICK"; fileName: string }
  | { type: "REPICK" }
  | ({ type: "READ_OK" } & Loaded)
  | { type: "READ_FAIL"; error: ShownError }
  | { type: "STILL" }
  | { type: "PREVIEW_OK"; preview: ImportResponse }
  | { type: "PREVIEW_FAIL"; error: ShownError; retryable: boolean }
  | { type: "OPEN" }
  | { type: "RETRY" }
  | { type: "CLOSE_REQUEST" }
  | { type: "KEEP" }
  | { type: "DISCARD" }
  | { type: "CONFIRM"; now: number }
  | { type: "STEP"; now: number }
  | { type: "CONFIRM_OK"; result: ImportResponse; now: number }
  | { type: "CONFIRM_FAIL"; outcome: "changed" | "unknown" | "panel"; error?: ShownError }
  | { type: "FINISH" };

const PANEL_STATES: ImportStatus[] = ["reviewing", "confirming", "done", "rechecking", "panelError"];

export const isPanelOpen = (state: ImportState) => PANEL_STATES.includes(state.status);

/** Row numbers the confirm must skip: exactly the preview's skip_error rows, unique, ascending. */
export function buildSkipRows(preview: ImportResponse): number[] {
  const rows = new Set(preview.rows.filter((r) => r.action === "skip_error").map((r) => r.row));
  return [...rows].sort((a, b) => a - b);
}

/** N in "Import N": every row that isn't skipped. */
export const importableCount = (preview: ImportResponse) => preview.counts.rows_total - preview.counts.skipped;

export const nounFor = (entity: ImportEntity, n: number) => ENTITY_NOUN[entity][n === 1 ? 0 : 1];

export function importLabels(preview: ImportResponse, entity: ImportEntity) {
  const { rows_total, skipped } = preview.counts;
  const n = importableCount(preview);
  if (skipped === 0) return { primary: `Import ${n} ${nounFor(entity, n)}`, primaryDisabled: false, showSecondary: false };
  if (skipped < rows_total) return { primary: `Import ${n} · Skip ${skipped}`, primaryDisabled: false, showSecondary: true };
  return { primary: "Nothing to import, fix your file", primaryDisabled: true, showSecondary: true };
}

export function doneText(entity: ImportEntity, created: number, filled: number) {
  if (created > 0) {
    return `${created} ${nounFor(entity, created)} added${filled > 0 ? `, ${filled} updated` : ""} ✓`;
  }
  if (filled > 0) return `${filled} ${nounFor(entity, filled)} updated ✓`;
  return "Your fleet is already up to date ✓";
}

function toDone(state: Extract<ImportState, { status: "confirming" }>, result: ImportResponse): ImportState {
  return {
    status: "done",
    importing: importableCount(state.preview),
    createdIds: result.created_ids,
    created: result.counts.created,
    filled: result.counts.filled,
  };
}

/** Pure transitions. Returns the same state object for any event that doesn't apply. */
export function reducer(state: ImportState, action: ImportAction): ImportState {
  switch (action.type) {
    case "PICK":
      return state.status === "idle" ? { status: "reading", fileName: action.fileName } : state;
    case "REPICK":
      return state.status === "reviewing" || state.status === "panelError"
        ? { status: "rechecking", reason: "repick" }
        : state;
    case "READ_OK":
      if (state.status === "reading") return { status: "checking", still: false, file: action.file, parsed: action.parsed };
      if (state.status === "rechecking" && state.reason === "repick" && !state.file) {
        return { ...state, file: action.file, parsed: action.parsed };
      }
      return state;
    case "READ_FAIL":
      if (state.status === "reading") return { status: "idle", error: action.error };
      if (state.status === "rechecking" && state.reason === "repick" && !state.file) {
        return { status: "panelError", error: action.error };
      }
      return state;
    case "STILL":
      return state.status === "checking" && !state.still ? { ...state, still: true } : state;
    case "PREVIEW_OK":
      if (state.status === "checking") {
        return { status: "checked", file: state.file, parsed: state.parsed, preview: action.preview };
      }
      if (state.status === "rechecking" && state.file && state.parsed) {
        const note = state.reason === "changed" ? NOTE_CHANGED : state.reason === "unknown" ? NOTE_UNKNOWN : null;
        return {
          status: "reviewing",
          file: state.file,
          parsed: state.parsed,
          preview: action.preview,
          note,
          error: null,
          discardPrompt: false,
        };
      }
      return state;
    case "PREVIEW_FAIL":
      if (state.status === "checking") {
        return action.retryable
          ? { status: "idle", error: action.error, retry: { file: state.file, parsed: state.parsed } }
          : { status: "idle", error: action.error };
      }
      if (state.status === "rechecking") return { status: "panelError", error: action.error };
      return state;
    case "OPEN":
      return state.status === "checked"
        ? { ...state, status: "reviewing", note: null, error: null, discardPrompt: false }
        : state;
    case "RETRY":
      return state.status === "idle" && state.retry
        ? { status: "checking", still: false, file: state.retry.file, parsed: state.retry.parsed }
        : state;
    case "CLOSE_REQUEST":
      if (state.status === "reviewing") return state.discardPrompt ? state : { ...state, discardPrompt: true };
      if (state.status === "rechecking" || state.status === "panelError") return { status: "idle" };
      return state;
    case "KEEP":
      return state.status === "reviewing" && state.discardPrompt ? { ...state, discardPrompt: false } : state;
    case "DISCARD":
      return state.status === "reviewing" ? { status: "idle" } : state;
    case "CONFIRM":
      if (state.status !== "reviewing" || state.discardPrompt) return state;
      if (importLabels(state.preview, state.preview.entity).primaryDisabled) return state;
      return {
        status: "confirming",
        file: state.file,
        parsed: state.parsed,
        preview: state.preview,
        shownStep: 0,
        stepShownAt: action.now,
      };
    case "STEP":
      if (state.status !== "confirming") return state;
      if (state.shownStep === 0) return { ...state, shownStep: 1, stepShownAt: action.now };
      return state.result && action.now - state.stepShownAt >= STEP_HOLD_MS ? toDone(state, state.result) : state;
    case "CONFIRM_OK":
      if (state.status !== "confirming") return state;
      // "added" only shows after a 2xx, and only once "Saving" has had its full hold
      if (state.shownStep === 1 && action.now - state.stepShownAt >= STEP_HOLD_MS) return toDone(state, action.result);
      return { ...state, result: action.result };
    case "CONFIRM_FAIL":
      if (state.status !== "confirming") return state;
      if (action.outcome === "panel") {
        return {
          status: "reviewing",
          file: state.file,
          parsed: state.parsed,
          preview: state.preview,
          note: null,
          error: action.error ?? { message: GENERIC_TEXT.unknown, fixHint: null },
          discardPrompt: false,
        };
      }
      return { status: "rechecking", reason: action.outcome, file: state.file, parsed: state.parsed };
    case "FINISH":
      return state.status === "done" ? { status: "idle" } : state;
  }
}

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const shown = (error: ImportApiError): ShownError => ({ message: error.message, fixHint: error.fixHint });

const UNKNOWN_ERROR: ShownError = { message: GENERIC_TEXT.unknown, fixHint: null };
const BUG_ERROR: ShownError = { message: GENERIC_TEXT.bug, fixHint: GENERIC_TEXT.bugHint };

export function useCsvImport(
  entity: ImportEntity,
  { onImported }: { onImported?: (createdIds: string[]) => void } = {}
) {
  const [state, setState] = useState<ImportState>({ status: "idle" });
  // Events are applied to the ref first so two clicks in the same tick see the same truth
  const stateRef = useRef<ImportState>(state);
  const inputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(false);
  // Every request gets a sequence id; a response with an old id is dropped
  const seqRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const onImportedRef = useRef(onImported);

  useEffect(() => {
    onImportedRef.current = onImported;
  });

  const send = useCallback((action: ImportAction) => {
    const next = reducer(stateRef.current, action);
    if (next === stateRef.current) return false;
    stateRef.current = next;
    setState(next);
    return true;
  }, []);

  const cancelRequests = useCallback(() => {
    seqRef.current++;
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const runPreview = useCallback(
    async (file: HeldFile) => {
      const seq = ++seqRef.current;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const preview = await previewImport(entity, file, { signal: controller.signal });
        if (seq === seqRef.current) send({ type: "PREVIEW_OK", preview });
      } catch (error) {
        if (seq !== seqRef.current || !(error instanceof ImportApiError) || error.status === 401) return;
        send({ type: "PREVIEW_FAIL", error: shown(error), retryable: error.kind !== "http" });
      }
    },
    [entity, send]
  );

  const pick = useCallback(
    async (file: File) => {
      if (!send({ type: "PICK", fileName: file.name }) && !send({ type: "REPICK" })) return;
      abortRef.current?.abort();
      const seq = ++seqRef.current;
      let result: Awaited<ReturnType<typeof import("@/lib/csv-read").readCsv>>;
      let text: typeof import("@/lib/csv-read").PRECHECK_TEXT;
      try {
        const csv = await import("@/lib/csv-read");
        text = csv.PRECHECK_TEXT;
        result = await csv.readCsv(file);
      } catch {
        if (seq === seqRef.current) send({ type: "READ_FAIL", error: { message: GENERIC_TEXT.network, fixHint: null } });
        return;
      }
      if (seq !== seqRef.current) return;
      if (!result.ok) {
        send({ type: "READ_FAIL", error: text[result.code] });
        return;
      }
      if (send({ type: "READ_OK", file: result.held, parsed: result.parsed })) await runPreview(result.held);
    },
    [runPreview, send]
  );

  const retry = useCallback(() => {
    const current = stateRef.current;
    if (current.status !== "idle" || !current.retry) return;
    const { file } = current.retry;
    if (send({ type: "RETRY" })) void runPreview(file);
  }, [runPreview, send]);

  const confirm = useCallback(async () => {
    if (!send({ type: "CONFIRM", now: Date.now() })) return;
    const current = stateRef.current as Extract<ImportState, { status: "confirming" }>;
    const seq = ++seqRef.current;
    try {
      // No abort signal: leaving the page must not cut off a save that may already be committing
      const result = await confirmImport(entity, current.file, current.preview.preview_token, buildSkipRows(current.preview));
      if (seq === seqRef.current && mountedRef.current) send({ type: "CONFIRM_OK", result, now: Date.now() });
    } catch (error) {
      if (seq !== seqRef.current || !mountedRef.current) return;
      if (!(error instanceof ImportApiError)) {
        send({ type: "CONFIRM_FAIL", outcome: "panel", error: UNKNOWN_ERROR });
      } else if (error.status === 401) {
        return;
      } else if (error.kind !== "http") {
        // The save may or may not have gone through; a fresh preview shows which (Q8)
        if (send({ type: "CONFIRM_FAIL", outcome: "unknown" })) await runPreview(current.file);
      } else if (error.status === 409 && (REPREVIEW_CODES as readonly string[]).includes(error.code ?? "")) {
        if (send({ type: "CONFIRM_FAIL", outcome: "changed" })) await runPreview(current.file);
      } else if ((BUG_PATH_CODES as readonly string[]).includes(error.code ?? "")) {
        send({ type: "CONFIRM_FAIL", outcome: "panel", error: BUG_ERROR });
      } else {
        send({ type: "CONFIRM_FAIL", outcome: "panel", error: shown(error) });
      }
    }
  }, [entity, runPreview, send]);

  const closeRequest = useCallback(() => {
    const status = stateRef.current.status;
    if (send({ type: "CLOSE_REQUEST" }) && (status === "rechecking" || status === "panelError")) cancelRequests();
  }, [cancelRequests, send]);

  const keep = useCallback(() => void send({ type: "KEEP" }), [send]);

  const discard = useCallback(() => {
    if (send({ type: "DISCARD" })) cancelRequests();
  }, [cancelRequests, send]);

  const repick = useCallback(() => {
    const status = stateRef.current.status;
    if (status === "reviewing" || status === "panelError") inputRef.current?.click();
  }, []);

  // Timers keyed on the state they belong to; leaving the state clears them
  useEffect(() => {
    if (state.status === "checking" && !state.still) {
      const timer = window.setTimeout(() => send({ type: "STILL" }), STILL_CHECKING_MS);
      return () => window.clearTimeout(timer);
    }
    if (state.status === "checked") {
      const hold = prefersReducedMotion() ? CHECKED_HOLD_REDUCED_MS : CHECKED_HOLD_MS;
      const timer = window.setTimeout(() => send({ type: "OPEN" }), hold);
      return () => window.clearTimeout(timer);
    }
    if (state.status === "confirming") {
      // Step 1 waits for the response; CONFIRM_OK moves on if it arrives after the hold
      if (state.shownStep === 1 && !state.result) return;
      const wait = Math.max(0, state.stepShownAt + STEP_HOLD_MS - Date.now());
      const timer = window.setTimeout(() => send({ type: "STEP", now: Date.now() }), wait);
      return () => window.clearTimeout(timer);
    }
    if (state.status === "done") {
      const ids = state.createdIds;
      const timer = window.setTimeout(() => {
        if (send({ type: "FINISH" })) onImportedRef.current?.(ids);
      }, DONE_HOLD_MS);
      return () => window.clearTimeout(timer);
    }
  }, [state, send]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      // Aborts a preview in flight; a confirm in flight is left to finish and ignored
      cancelRequests();
    };
  }, [cancelRequests]);

  return {
    entity,
    state,
    inputRef,
    panelOpen: isPanelOpen(state),
    pick,
    retry,
    confirm,
    closeRequest,
    keep,
    discard,
    repick,
  };
}

export type CsvImport = ReturnType<typeof useCsvImport>;

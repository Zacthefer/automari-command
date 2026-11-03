import { vi } from "vitest";
import type { ImportCounts, ImportResponse, ImportRowResult } from "@/types/imports";

// Shared builders for the import tests. Values are fake (example.test, made-up units).

export function row(n: number, overrides: Partial<ImportRowResult> = {}): ImportRowResult {
  return {
    row: n,
    action: "create",
    record_id: null,
    matched_ids: [],
    filled_fields: [],
    error_codes: [],
    warning_codes: [],
    vin_dropped: false,
    ...overrides,
  };
}

export function makePreview(
  overrides: Partial<Omit<ImportResponse, "counts">> & { counts?: Partial<ImportCounts> } = {}
): ImportResponse {
  const rows = overrides.rows ?? [row(2), row(3)];
  const counts: ImportCounts = {
    rows_total: rows.length,
    created: rows.filter((r) => r.action === "create").length,
    filled: rows.filter((r) => r.action === "fill").length,
    unchanged: rows.filter((r) => r.action === "unchanged").length,
    skipped: rows.filter((r) => r.action === "skip_error").length,
    warnings: rows.filter((r) => r.warning_codes.length > 0).length,
    errors: rows.filter((r) => r.error_codes.length > 0).length,
    ...overrides.counts,
  };
  return {
    job_id: "job-1",
    entity: "trucks",
    dry_run: true,
    status: "previewed",
    preview_token: "token-1",
    ignored_columns: 0,
    header_map: { "0": "unit_number" },
    errors: [],
    warnings: [],
    created_ids: [],
    filled_ids: [],
    ...overrides,
    rows,
    counts,
  };
}

export function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export function problem(status: number, code: string) {
  return jsonResponse(status, { detail: { code, message: `${code} message`, fix_hint: `${code} hint` } });
}

/** A File whose arrayBuffer() resolves at once (jsdom's File has none). */
export function csvFile(content: string, name = "fleet.csv") {
  const bytes = new TextEncoder().encode(content);
  const file = new File([bytes], name, { type: "text/csv" });
  const arrayBuffer = vi.fn(async () => bytes.buffer.slice(0));
  Object.defineProperty(file, "arrayBuffer", { value: arrayBuffer });
  return Object.assign(file, { arrayBufferSpy: arrayBuffer });
}

/** A fetch that never settles until its signal aborts. */
export function hangingFetch() {
  return (_url: string, init: RequestInit) =>
    new Promise<Response>((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    });
}

// motion reads the media query once and then listens for changes, so every query object
// handed out is kept and updated when a test switches the preference
type FakeQuery = { matches: boolean; media: string; listeners: Set<() => void> };
const queries: FakeQuery[] = [];
let reduceMotion = false;

export function stubReducedMotion(reduce: boolean) {
  reduceMotion = reduce;
  for (const query of queries) {
    query.matches = reduce && query.media.includes("reduce");
    query.listeners.forEach((listener) => listener());
  }
  vi.stubGlobal("matchMedia", (media: string) => {
    const query: FakeQuery = { matches: reduceMotion && media.includes("reduce"), media, listeners: new Set() };
    queries.push(query);
    return Object.assign(query, {
      onchange: null,
      addEventListener: (_type: string, listener: () => void) => query.listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) => query.listeners.delete(listener),
      addListener: (listener: () => void) => query.listeners.add(listener),
      removeListener: (listener: () => void) => query.listeners.delete(listener),
      dispatchEvent: () => true,
    });
  });
}

// jsdom's Blob has no arrayBuffer(); FileReader works with real timers
export function readBlob(blob: Blob): Promise<number[]> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(Array.from(new Uint8Array(reader.result as ArrayBuffer)));
    reader.readAsArrayBuffer(blob);
  });
}

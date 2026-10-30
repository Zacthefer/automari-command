import { clearToken, getToken } from "@/lib/api";
import { GENERIC_TEXT, type ImportEntity, type ImportErrorDetail, type ImportResponse } from "@/types/imports";

// CSV import calls. Kept apart from api.ts because the import needs multipart bodies, a
// timeout, and the server's error `code`, which api.ts's ApiError drops.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const IMPORT_TIMEOUT_MS = 60_000;

/** The file exactly as picked: these bytes are sent on every preview and on the confirm. */
export interface HeldFile {
  name: string;
  bytes: ArrayBuffer;
}

export type ImportErrorKind = "http" | "network" | "timeout";

export class ImportApiError extends Error {
  kind: ImportErrorKind;
  /** HTTP status; null when no response arrived. */
  status: number | null;
  /** Server catalog code; null when the detail had no {code, message, fix_hint} shape. */
  code: string | null;
  fixHint: string | null;

  constructor(
    kind: ImportErrorKind,
    message: string,
    { status = null, code = null, fixHint = null }: { status?: number | null; code?: string | null; fixHint?: string | null } = {}
  ) {
    super(message);
    this.name = "ImportApiError";
    this.kind = kind;
    this.status = status;
    this.code = code;
    this.fixHint = fixHint;
  }
}

function isErrorDetail(detail: unknown): detail is ImportErrorDetail {
  if (!detail || typeof detail !== "object") return false;
  const d = detail as Record<string, unknown>;
  return typeof d.code === "string" && typeof d.message === "string" && typeof d.fix_hint === "string";
}

async function readError(response: Response): Promise<ImportApiError> {
  const raw = await response.text().catch(() => "");
  let detail: unknown;
  try {
    const parsed = JSON.parse(raw);
    detail = parsed?.detail ?? parsed?.error;
  } catch {
    // Not JSON (a proxy's HTML error page, say): never shown to the carrier
    detail = undefined;
  }
  const status = response.status;
  if (isErrorDetail(detail)) {
    return new ImportApiError("http", detail.message, { status, code: detail.code, fixHint: detail.fix_hint });
  }
  const message = typeof detail === "string" && detail.trim() ? detail.slice(0, 400) : GENERIC_TEXT.unknown;
  return new ImportApiError("http", message, { status });
}

async function postImport(
  entity: ImportEntity,
  held: HeldFile,
  fields: Record<string, string>,
  { signal }: { signal?: AbortSignal } = {}
): Promise<ImportResponse> {
  const form = new FormData();
  form.append("file", new Blob([held.bytes], { type: "text/csv" }), held.name);
  for (const [key, value] of Object.entries(fields)) form.append(key, value);

  // One controller for both the 60s timeout and the caller's abort (discard, unmount)
  const controller = new AbortController();
  let timedOut = false;
  const timer = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, IMPORT_TIMEOUT_MS);
  const followCaller = () => controller.abort();
  if (signal?.aborted) controller.abort();
  signal?.addEventListener("abort", followCaller);

  const token = getToken();
  const lost = () =>
    timedOut ? new ImportApiError("timeout", GENERIC_TEXT.timeout) : new ImportApiError("network", GENERIC_TEXT.network);
  try {
    let response: Response;
    try {
      // No Content-Type header: the browser sets the multipart boundary itself
      response = await fetch(`${API_BASE}/api/imports/${entity}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
        signal: controller.signal,
      });
    } catch {
      throw lost();
    }

    if (response.status === 401) {
      clearToken();
      window.location.href = "/login";
      throw new ImportApiError("http", "Unauthorized", { status: 401 });
    }
    if (!response.ok) throw await readError(response);
    try {
      return (await response.json()) as ImportResponse;
    } catch {
      // A 2xx whose body never fully arrived: the caller can't know the outcome
      throw lost();
    }
  } finally {
    window.clearTimeout(timer);
    signal?.removeEventListener("abort", followCaller);
  }
}

/** Read-only check of the file. Nothing is saved. */
export function previewImport(entity: ImportEntity, held: HeldFile, options?: { signal?: AbortSignal }) {
  return postImport(entity, held, { dry_run: "true" }, options);
}

/** Saves the previewed file. `skipRows` must be exactly the preview's skip_error rows. */
export function confirmImport(
  entity: ImportEntity,
  held: HeldFile,
  previewToken: string,
  skipRows: number[],
  options?: { signal?: AbortSignal }
) {
  const skip = [...new Set(skipRows)].sort((a, b) => a - b).join(",");
  return postImport(entity, held, { dry_run: "false", preview_token: previewToken, skip_rows: skip }, options);
}

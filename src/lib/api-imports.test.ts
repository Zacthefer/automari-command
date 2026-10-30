import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { classifyConfirmError, confirmImport, ImportApiError, previewImport, type HeldFile } from "./api-imports";

const held: HeldFile = { name: "Fleet List.csv", bytes: new TextEncoder().encode("Unit\n101\n").buffer };

const fetchMock = vi.fn();

function jsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

// jsdom's Blob has no arrayBuffer(); FileReader works
function readBlob(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
    reader.readAsArrayBuffer(blob);
  });
}

function sent(call = 0) {
  const [url, init] = fetchMock.mock.calls[call] as [string, RequestInit];
  return { url, init, form: init.body as FormData };
}

async function caught(promise: Promise<unknown>): Promise<ImportApiError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(ImportApiError);
    return error as ImportApiError;
  }
  throw new Error("expected a rejection");
}

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  localStorage.setItem("automari_token", "tok");
});
afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  localStorage.clear();
});

describe("previewImport / confirmImport requests", () => {
  it("sends the file with its name, dry_run=true and the Bearer header, and no Content-Type", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { preview_token: "p" }));
    await previewImport("trucks", held);
    const { url, init, form } = sent();
    expect(url).toMatch(/\/api\/imports\/trucks$/);
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({ Authorization: "Bearer tok" });
    expect(form.get("dry_run")).toBe("true");
    expect((form.get("file") as File).name).toBe("Fleet List.csv");
    expect(form.has("preview_token")).toBe(false);
  });

  it("confirm sends dry_run=false, the token, sorted unique skip_rows and the same bytes", async () => {
    fetchMock.mockImplementation(async () => jsonResponse(200, {}));
    await previewImport("drivers", held);
    await confirmImport("drivers", held, "tok-1", [203, 4, 17, 4]);
    const preview = sent(0).form;
    const { url, form } = sent(1);
    expect(url).toMatch(/\/api\/imports\/drivers$/);
    expect(form.get("dry_run")).toBe("false");
    expect(form.get("preview_token")).toBe("tok-1");
    expect(form.get("skip_rows")).toBe("4,17,203");
    const a = await readBlob(preview.get("file") as File);
    const b = await readBlob(form.get("file") as File);
    expect(Array.from(b)).toEqual(Array.from(a));
    expect(Array.from(a)).toEqual(Array.from(new Uint8Array(held.bytes)));
  });

  it("sends an empty skip_rows when nothing is skipped", async () => {
    fetchMock.mockImplementation(async () => jsonResponse(200, {}));
    await confirmImport("trucks", held, "t", []);
    expect(sent().form.get("skip_rows")).toBe("");
  });

  it("omits the Authorization header without a token", async () => {
    localStorage.clear();
    fetchMock.mockImplementation(async () => jsonResponse(200, {}));
    await previewImport("trucks", held);
    expect(sent().init.headers).toEqual({});
  });
});

describe("errors", () => {
  const detail = (code: string) => ({ detail: { code, message: `${code} message`, fix_hint: `${code} hint` } });

  it.each([
    [422, "MISSING_COLUMN"],
    [422, "TOO_MANY_COLUMNS"],
    [429, "RATE_LIMITED"],
    [409, "PREVIEW_STALE"],
    [409, "SKIP_ROWS_MISMATCH"],
    [409, "IMPORT_CONFLICT"],
    [500, "IMPORT_FAILED"],
  ])("keeps status %i and code %s with its message and fix_hint", async (status, code) => {
    fetchMock.mockResolvedValue(jsonResponse(status, detail(code)));
    const error = await caught(previewImport("trucks", held));
    expect(error).toMatchObject({ kind: "http", status, code, message: `${code} message`, fixHint: `${code} hint` });
  });

  it("reads a 403 string detail from the auth dependency without crashing", async () => {
    fetchMock.mockResolvedValue(jsonResponse(403, { detail: "Not enough permissions" }));
    const error = await caught(previewImport("trucks", held));
    expect(error).toMatchObject({ kind: "http", status: 403, code: null, message: "Not enough permissions", fixHint: null });
    expect(localStorage.getItem("automari_token")).toBe("tok");
  });

  it("uses a string detail cut to 400 characters, with no code", async () => {
    fetchMock.mockResolvedValue(jsonResponse(400, { detail: "x".repeat(500) }));
    const error = await caught(previewImport("trucks", held));
    expect(error).toMatchObject({ kind: "http", status: 400, code: null, fixHint: null });
    expect(error.message).toHaveLength(400);
  });

  it("uses the generic message for an array detail or a non-JSON body", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(422, { detail: [{ loc: ["body", "file"], msg: "Field required" }] }));
    const first = await caught(previewImport("trucks", held));
    expect(first).toMatchObject({ code: null, message: "Something went wrong. Try again." });
    fetchMock.mockResolvedValueOnce(new Response("<html>Bad gateway</html>", { status: 502 }));
    const second = await caught(previewImport("trucks", held));
    expect(second).toMatchObject({ status: 502, code: null, message: "Something went wrong. Try again." });
  });

  it("on 401 clears the token, goes to /login and throws", async () => {
    vi.stubGlobal("location", { href: "/cost-per-mile/trucks" });
    fetchMock.mockResolvedValue(jsonResponse(401, { detail: "Not authenticated" }));
    const error = await caught(previewImport("trucks", held));
    expect(error.status).toBe(401);
    expect(localStorage.getItem("automari_token")).toBeNull();
    expect(window.location.href).toBe("/login");
  });

  it("reports a fetch rejection as a network error", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const error = await caught(previewImport("trucks", held));
    expect(error).toMatchObject({ kind: "network", status: null, code: null });
  });

  it("aborts after 60s and reports a timeout", async () => {
    vi.useFakeTimers();
    let signal!: AbortSignal;
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          signal = init.signal!;
          signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        })
    );
    const pending = caught(previewImport("trucks", held));
    await vi.advanceTimersByTimeAsync(59_999);
    expect(signal.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(signal.aborted).toBe(true);
    expect(await pending).toMatchObject({ kind: "timeout" });
  });

  it("follows the caller's abort signal", async () => {
    let signal!: AbortSignal;
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          signal = init.signal!;
          signal.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
        })
    );
    const caller = new AbortController();
    const pending = caught(previewImport("trucks", held, { signal: caller.signal }));
    caller.abort();
    expect(signal.aborted).toBe(true);
    expect((await pending).kind).toBe("network");
  });
});

describe("classifyConfirmError", () => {
  const http = (status: number, code: string | null) =>
    new ImportApiError("http", "server text", { status, code, fixHint: code ? "server hint" : null });

  it.each([
    ["401", http(401, null), { outcome: "ignore" }],
    ["a network error", new ImportApiError("network", "x"), { outcome: "unknown" }],
    ["a timeout", new ImportApiError("timeout", "x"), { outcome: "unknown" }],
    ["an unshaped 502", http(502, null), { outcome: "unknown" }],
    ["409 PREVIEW_STALE", http(409, "PREVIEW_STALE"), { outcome: "changed" }],
    ["409 IMPORT_IN_PROGRESS", http(409, "IMPORT_IN_PROGRESS"), { outcome: "panel", error: { message: "server text", fixHint: "server hint" } }],
    ["422 INVALID_PREVIEW_TOKEN", http(422, "INVALID_PREVIEW_TOKEN"), { outcome: "bug" }],
    ["500 IMPORT_FAILED", http(500, "IMPORT_FAILED"), { outcome: "unknown" }],
    ["500 SERVER_ERROR", http(500, "SERVER_ERROR"), { outcome: "unknown" }],
    ["422 INVALID_REQUEST", http(422, "INVALID_REQUEST"), { outcome: "bug" }],
    ["429 RATE_LIMITED", http(429, "RATE_LIMITED"), { outcome: "panel", error: { message: "server text", fixHint: "server hint" } }],
    ["429 IMPORT_BUSY", http(429, "IMPORT_BUSY"), { outcome: "panel", error: { message: "server text", fixHint: "server hint" } }],
    ["403 with a string detail", new ImportApiError("http", "Not enough permissions", { status: 403 }), { outcome: "panel", error: { message: "Not enough permissions", fixHint: null } }],
    ["a non-API error", new TypeError("boom"), { outcome: "panel", error: { message: "Something went wrong. Try again.", fixHint: null } }],
  ])("%s", (_name, error, verdict) => {
    expect(classifyConfirmError(error)).toEqual(verdict);
  });
});

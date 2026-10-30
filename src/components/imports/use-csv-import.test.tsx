import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
// Loaded up front so the hook's import() calls resolve without real I/O under fake timers
import "@/lib/csv-read";
import "@/lib/api-imports";
import "./import-sheet";
import {
  buildSkipRows,
  reducer,
  NOTE_BUG,
  NOTE_CHANGED,
  NOTE_UNKNOWN,
  useCsvImport,
  type ImportState,
} from "./use-csv-import";
import { csvFile, hangingFetch, jsonResponse, makePreview, problem, readBlob, row } from "./test-fixtures";

const fetchMock = vi.fn();

function setup(onImported = vi.fn()) {
  const hook = renderHook(() => useCsvImport("trucks", { onImported }));
  return { ...hook, onImported, status: () => hook.result.current.state.status };
}

type Hook = ReturnType<typeof setup>;

const formOf = (call: number) => fetchMock.mock.calls[call][1].body as FormData;

async function toReviewing(hook: Hook, preview = makePreview({ rows: [row(2), row(3, { action: "skip_error", error_codes: ["X"] })] })) {
  fetchMock.mockResolvedValueOnce(jsonResponse(200, preview));
  await act(() => hook.result.current.pick(csvFile("Unit\n101\n\n")));
  expect(hook.status()).toBe("checked");
  await act(() => vi.advanceTimersByTimeAsync(450));
  expect(hook.status()).toBe("reviewing");
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("helpers", () => {
  it("buildSkipRows is exactly the skip_error rows, ignoring warning-only rows", () => {
    const preview = makePreview({
      rows: [
        row(2),
        row(3, { action: "skip_error", error_codes: ["A"] }),
        row(4, { warning_codes: ["VIN_CHECK_DIGIT"], vin_dropped: true }),
        row(7, { action: "skip_error", error_codes: ["B"], warning_codes: ["C"] }),
      ],
    });
    expect(buildSkipRows(preview)).toEqual([3, 7]);
  });

});

describe("reducer", () => {
  it("moves to done when the step timer fires a little early with a result in hand", () => {
    const preview = makePreview();
    const confirming: ImportState = {
      status: "confirming",
      file: { name: "f.csv", bytes: new ArrayBuffer(0) },
      parsed: { records: [], dataRowCount: 0, parseErrorCount: 0, encoding: "utf-8" },
      preview,
      shownStep: 1,
      stepShownAt: 1000,
      result: makePreview({ status: "committed", created_ids: ["a"] }),
    };
    expect(reducer(confirming, { type: "STEP", now: 1000 + 699 })).toMatchObject({ status: "done", createdIds: ["a"] });
  });
});

describe("useCsvImport", () => {
  it("never calls fetch when a pre-check fails", async () => {
    const hook = setup();
    await act(() => hook.result.current.pick(csvFile("Unit\n1\n", "fleet.xlsx")));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(hook.result.current.state).toMatchObject({
      status: "idle",
      error: { message: "This file isn't a CSV file." },
    });
  });

  it.each(["PREVIEW_STALE", "SKIP_ROWS_MISMATCH", "IMPORT_CONFLICT"])(
    "re-previews the same bytes after a 409 %s and confirms with the new token",
    async (code) => {
      const hook = setup();
      await toReviewing(hook);
      fetchMock.mockResolvedValueOnce(problem(409, code));
      fetchMock.mockResolvedValueOnce(jsonResponse(200, makePreview({ preview_token: "token-2" })));
      await act(() => hook.result.current.confirm());
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(formOf(2).get("dry_run")).toBe("true");
      expect(hook.result.current.state).toMatchObject({ status: "reviewing", note: NOTE_CHANGED, error: null });

      fetchMock.mockReturnValueOnce(new Promise(() => {}));
      await act(async () => void hook.result.current.confirm());
      expect(formOf(3).get("preview_token")).toBe("token-2");
      expect(formOf(3).get("skip_rows")).toBe("");

      vi.useRealTimers();
      const bytes = await Promise.all([0, 1, 2, 3].map((i) => readBlob(formOf(i).get("file") as File)));
      for (const b of bytes) expect(b).toEqual(bytes[0]);
    }
  );

  it.each(["PREVIEW_TOKEN_REQUIRED", "INVALID_SKIP_ROWS", "INVALID_PREVIEW_TOKEN", "INVALID_REQUEST"])(
    "re-previews after a bug-path 422 %s and says nothing was imported",
    async (code) => {
      const hook = setup();
      await toReviewing(hook);
      fetchMock.mockResolvedValueOnce(problem(422, code));
      fetchMock.mockResolvedValueOnce(jsonResponse(200, makePreview({ preview_token: "token-3" })));
      await act(() => hook.result.current.confirm());
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(formOf(2).get("dry_run")).toBe("true");
      expect(hook.result.current.state).toMatchObject({ status: "reviewing", note: NOTE_BUG, error: null });
      fetchMock.mockReturnValueOnce(new Promise(() => {}));
      await act(async () => void hook.result.current.confirm());
      expect(formOf(3).get("preview_token")).toBe("token-3");
    }
  );

  it("treats an unshaped 5xx on confirm as an unknown outcome and re-checks", async () => {
    const hook = setup();
    await toReviewing(hook);
    fetchMock.mockResolvedValueOnce(new Response("<html>Bad gateway</html>", { status: 502 }));
    fetchMock.mockReturnValueOnce(new Promise(() => {}));
    await act(async () => void hook.result.current.confirm());
    expect(hook.result.current.state).toMatchObject({ status: "rechecking", reason: "unknown" });
    expect(formOf(2).get("dry_run")).toBe("true");
  });

  it("re-checks after a confirm network error", async () => {
    const hook = setup();
    await toReviewing(hook);
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    fetchMock.mockResolvedValueOnce(jsonResponse(200, makePreview()));
    await act(() => hook.result.current.confirm());
    expect(hook.result.current.state).toMatchObject({ status: "reviewing", note: NOTE_UNKNOWN });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not re-preview after a 409 IMPORT_IN_PROGRESS and lets the carrier confirm again", async () => {
    const hook = setup();
    await toReviewing(hook);
    fetchMock.mockResolvedValueOnce(problem(409, "IMPORT_IN_PROGRESS"));
    await act(() => hook.result.current.confirm());
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(hook.result.current.state).toMatchObject({
      status: "reviewing",
      error: { message: "IMPORT_IN_PROGRESS message", fixHint: "IMPORT_IN_PROGRESS hint" },
    });
  });

  it("says the file couldn't be read when reading it fails, without calling fetch", async () => {
    const hook = setup();
    const file = csvFile("Unit\n1\n");
    file.arrayBufferSpy.mockRejectedValueOnce(new DOMException("gone", "NotReadableError"));
    await act(() => hook.result.current.pick(file));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(hook.result.current.state).toMatchObject({
      status: "idle",
      error: { message: "We couldn't read this file. Make sure it's saved and downloaded, then try again." },
    });
  });

  it("turns an unexpected preview failure into a retryable error instead of hanging", async () => {
    const hook = setup();
    // Not a Response at all: the API layer throws a plain TypeError
    fetchMock.mockResolvedValueOnce(undefined);
    await act(() => hook.result.current.pick(csvFile("Unit\n1\n")));
    expect(hook.result.current.state).toMatchObject({
      status: "idle",
      error: { message: "Something went wrong. Try again.", fixHint: null },
      retry: expect.anything(),
    });
  });

  it.each([
    ["500 IMPORT_FAILED", () => problem(500, "IMPORT_FAILED")],
    ["500 SERVER_ERROR", () => problem(500, "SERVER_ERROR")],
  ])("treats a shaped %s on confirm as an unknown outcome and re-checks", async (_name, response) => {
    const hook = setup();
    await toReviewing(hook);
    fetchMock.mockResolvedValueOnce(response());
    fetchMock.mockResolvedValueOnce(jsonResponse(200, makePreview()));
    await act(() => hook.result.current.confirm());
    expect(formOf(2).get("dry_run")).toBe("true");
    expect(hook.result.current.state).toMatchObject({ status: "reviewing", note: NOTE_UNKNOWN, error: null });
  });

  it.each(["RATE_LIMITED", "IMPORT_BUSY"])(
    "shows the server text for a 429 %s, does not retry, and allows another confirm",
    async (code) => {
      const hook = setup();
      await toReviewing(hook);
      fetchMock.mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: { code, message: `${code} message`, fix_hint: `${code} hint` } }), {
          status: 429,
          headers: { "Retry-After": "60" },
        })
      );
      await act(() => hook.result.current.confirm());
      await act(() => vi.advanceTimersByTimeAsync(120_000));
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(hook.result.current.state).toMatchObject({
        status: "reviewing",
        error: { message: `${code} message`, fixHint: `${code} hint` },
      });
      fetchMock.mockReturnValueOnce(new Promise(() => {}));
      await act(async () => void hook.result.current.confirm());
      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(hook.status()).toBe("confirming");
    }
  );

  it("never sends a preview while a confirm is in flight", async () => {
    const hook = setup();
    await toReviewing(hook);
    hook.result.current.inputRef.current = document.createElement("input");
    fetchMock.mockReturnValueOnce(new Promise(() => {}));
    await act(async () => void hook.result.current.confirm());
    await act(async () => {
      await hook.result.current.pick(csvFile("Unit\n9\n"));
      hook.result.current.repick();
      hook.result.current.retry();
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(hook.status()).toBe("confirming");
  });

  it("shows a 403 string detail on preview as a plain error", async () => {
    const hook = setup();
    fetchMock.mockResolvedValueOnce(jsonResponse(403, { detail: "Not enough permissions" }));
    await act(() => hook.result.current.pick(csvFile("Unit\n1\n")));
    expect(hook.result.current.state).toEqual({ status: "idle", error: { message: "Not enough permissions", fixHint: null } });
  });

  it("re-previews after a confirm timeout and says the outcome is unknown", async () => {
    const hook = setup();
    await toReviewing(hook);
    fetchMock.mockImplementationOnce(hangingFetch());
    let resolvePreview!: (r: Response) => void;
    fetchMock.mockReturnValueOnce(new Promise((r) => (resolvePreview = r)));
    await act(async () => void hook.result.current.confirm());
    await act(() => vi.advanceTimersByTimeAsync(60_000));
    expect(hook.result.current.state).toMatchObject({ status: "rechecking", reason: "unknown" });
    expect(formOf(2).get("dry_run")).toBe("true");
    await act(async () => resolvePreview(jsonResponse(200, makePreview())));
    expect(hook.result.current.state).toMatchObject({ status: "reviewing", note: NOTE_UNKNOWN });
  });

  it("holds each step 700ms and the done step 1000ms on a fast server", async () => {
    const hook = setup();
    await toReviewing(hook);
    const result = makePreview({ status: "committed", dry_run: false, created_ids: ["id-2"] });
    fetchMock.mockImplementationOnce(() => new Promise((r) => setTimeout(() => r(jsonResponse(200, result)), 10)));
    const step = () => (hook.result.current.state as Extract<ImportState, { status: "confirming" }>).shownStep;

    await act(async () => void hook.result.current.confirm());
    await act(() => vi.advanceTimersByTimeAsync(699));
    expect(hook.status()).toBe("confirming");
    expect(step()).toBe(0);
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(step()).toBe(1);
    await act(() => vi.advanceTimersByTimeAsync(699));
    expect(step()).toBe(1);
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(hook.result.current.state).toMatchObject({ status: "done", createdIds: ["id-2"], created: 2 });
    await act(() => vi.advanceTimersByTimeAsync(999));
    expect(hook.onImported).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(hook.onImported).toHaveBeenCalledWith(["id-2"]);
    expect(hook.status()).toBe("idle");
  });

  it("goes to done at 1400ms when the response lands mid-hold at 900ms", async () => {
    const hook = setup();
    await toReviewing(hook);
    const result = makePreview({ status: "committed", dry_run: false });
    fetchMock.mockImplementationOnce(() => new Promise((r) => setTimeout(() => r(jsonResponse(200, result)), 900)));
    await act(async () => void hook.result.current.confirm());
    await act(() => vi.advanceTimersByTimeAsync(700));
    await act(() => vi.advanceTimersByTimeAsync(200));
    expect(hook.result.current.state).toMatchObject({ status: "confirming", shownStep: 1, result: expect.anything() });
    await act(() => vi.advanceTimersByTimeAsync(499));
    expect(hook.status()).toBe("confirming");
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(hook.status()).toBe("done");
  });

  it("ignores a confirm that finishes after unmount: no onImported, no state change", async () => {
    const hook = setup();
    await toReviewing(hook);
    let resolve!: (r: Response) => void;
    fetchMock.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    await act(async () => void hook.result.current.confirm());
    const before = hook.result.current.state;
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    hook.unmount();
    // The confirm was not aborted: leaving the page must not cut off a save
    expect((fetchMock.mock.calls[1][1].signal as AbortSignal | undefined)?.aborted ?? false).toBe(false);
    await act(async () => resolve(jsonResponse(200, makePreview({ status: "committed", created_ids: ["x"] }))));
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(hook.onImported).not.toHaveBeenCalled();
    expect(hook.result.current.state).toBe(before);
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("never shows done before the confirm response arrives", async () => {
    const hook = setup();
    await toReviewing(hook);
    let resolve!: (r: Response) => void;
    fetchMock.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    await act(async () => void hook.result.current.confirm());
    await act(() => vi.advanceTimersByTimeAsync(30_000));
    expect(hook.result.current.state).toMatchObject({ status: "confirming", shownStep: 1 });
    await act(async () => resolve(jsonResponse(200, makePreview({ status: "committed" }))));
    expect(hook.status()).toBe("done");
  });

  it("sends one request for a double confirm", async () => {
    const hook = setup();
    await toReviewing(hook);
    fetchMock.mockReturnValue(new Promise(() => {}));
    await act(async () => {
      void hook.result.current.confirm();
      void hook.result.current.confirm();
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("ignores a preview response that arrives after the panel was closed", async () => {
    const hook = setup();
    await toReviewing(hook);
    const input = document.createElement("input");
    hook.result.current.inputRef.current = input;
    let resolve!: (r: Response) => void;
    fetchMock.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    await act(async () => void hook.result.current.pick(csvFile("Unit\n202\n")));
    expect(hook.result.current.state).toMatchObject({ status: "rechecking", reason: "repick" });
    act(() => hook.result.current.closeRequest());
    expect(hook.status()).toBe("idle");
    await act(async () => resolve(jsonResponse(200, makePreview())));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(hook.result.current.state).toEqual({ status: "idle" });
  });

  it("asks before discarding and drops everything on discard", async () => {
    const hook = setup();
    await toReviewing(hook);
    act(() => hook.result.current.closeRequest());
    expect(hook.result.current.state).toMatchObject({ status: "reviewing", discardPrompt: true });
    act(() => hook.result.current.keep());
    expect(hook.result.current.state).toMatchObject({ status: "reviewing", discardPrompt: false });
    act(() => hook.result.current.closeRequest());
    act(() => hook.result.current.discard());
    expect(hook.result.current.state).toEqual({ status: "idle" });
  });

  it("aborts the preview when unmounted while checking", async () => {
    const hook = setup();
    fetchMock.mockImplementationOnce(hangingFetch());
    await act(async () => void hook.result.current.pick(csvFile("Unit\n1\n")));
    expect(hook.status()).toBe("checking");
    const signal = fetchMock.mock.calls[0][1].signal as AbortSignal;
    hook.unmount();
    expect(signal.aborted).toBe(true);
  });

  it("keeps the bytes for a retry after a network error", async () => {
    const hook = setup();
    const file = csvFile("Unit\n1\n");
    fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
    await act(() => hook.result.current.pick(file));
    expect(hook.result.current.state).toMatchObject({
      status: "idle",
      error: { message: "We couldn't reach Automari. Check your connection and try again." },
    });
    fetchMock.mockResolvedValueOnce(jsonResponse(200, makePreview()));
    await act(async () => hook.result.current.retry());
    expect(hook.status()).toBe("checked");
    expect(file.arrayBufferSpy).toHaveBeenCalledTimes(1);
  });
});

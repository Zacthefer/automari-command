import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MotionGlobalConfig } from "motion/react";
import { useState } from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import "@/lib/csv-read";
import "@/lib/api-imports";
import { parseCsv } from "@/lib/csv-read";
import ImportSheet from "./import-sheet";
import { UploadCsvButton } from "./upload-csv-button";
import { useCsvImport, type CsvImport, type ImportState } from "./use-csv-import";
import { csvFile, jsonResponse, makePreview, row, stubReducedMotion } from "./test-fixtures";
import type { ImportResponse } from "@/types/imports";

const fetchMock = vi.fn();

const parsed = { ...parseCsv("Unit\n101\n102\n"), encoding: "utf-8" as const };
const held = { name: "fleet.csv", bytes: new ArrayBuffer(0) };

function reviewing(preview: ImportResponse, extra: Partial<Extract<ImportState, { status: "reviewing" }>> = {}): ImportState {
  return { status: "reviewing", file: held, parsed, preview, note: null, error: null, discardPrompt: false, ...extra };
}

function fakeImporter(state: ImportState): CsvImport {
  return {
    entity: "trucks",
    state,
    inputRef: { current: null },
    triggerRef: vi.fn(),
    panelOpen: true,
    pick: vi.fn(),
    retry: vi.fn(),
    confirm: vi.fn(),
    closeRequest: vi.fn(),
    keep: vi.fn(),
    discard: vi.fn(),
    repick: vi.fn(),
    panelLoadFailed: vi.fn(),
  };
}

// Real hook + sheet, the way the pages wire them
function Flow() {
  const importer = useCsvImport("trucks");
  return (
    <>
      <UploadCsvButton
        state={importer.state}
        onPick={(file) => void importer.pick(file)}
        onRetry={importer.retry}
        inputRef={importer.inputRef}
        triggerRef={importer.triggerRef}
      />
      {importer.panelOpen ? <ImportSheet importer={importer} /> : null}
      <output data-testid="status">{importer.state.status}</output>
    </>
  );
}

// Like the pages: the button sits in an empty-state invite, then moves to the header once
// the reload after an import finds rows
function MovingFlow() {
  const [hasRows, setHasRows] = useState(false);
  const importer = useCsvImport("trucks", {
    onImported: () => Promise.resolve().then(() => setHasRows(true)),
  });
  const button = (
    <UploadCsvButton
      state={importer.state}
      onPick={(file) => void importer.pick(file)}
      onRetry={importer.retry}
      inputRef={importer.inputRef}
      triggerRef={importer.triggerRef}
    />
  );
  return (
    <>
      <header data-testid="header">{hasRows ? button : null}</header>
      <section data-testid="invite">{hasRows ? null : button}</section>
      {importer.panelOpen ? <ImportSheet importer={importer} /> : null}
    </>
  );
}

const status = () => screen.getByTestId("status").textContent;
const closeButton = () => screen.queryByRole("button", { name: "Close" });

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", fetchMock);
  stubReducedMotion(false);
});
afterEach(() => {
  cleanup();
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("ImportSheet closing", () => {
  it("asks before discarding on Escape and on the X, never with window.confirm", async () => {
    const confirmSpy = vi.spyOn(window, "confirm");
    fetchMock.mockResolvedValueOnce(jsonResponse(200, makePreview({ rows: [row(2), row(3)] })));
    const { container } = render(<Flow />);
    await act(async () => {
      fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [csvFile("Unit\n101\n102\n")] } });
    });
    await act(() => vi.advanceTimersByTimeAsync(450));
    expect(status()).toBe("reviewing");

    await act(async () => fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" }));
    expect(screen.getByText("Discard this import? Nothing has been imported yet.")).toBeTruthy();
    expect(document.activeElement?.textContent).toBe("Keep reviewing");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Keep reviewing" })));
    expect(screen.queryByText(/Discard this import\?/)).toBeNull();

    await act(async () => fireEvent.click(closeButton()!));
    expect(screen.getByText(/Discard this import\?/)).toBeTruthy();
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Discard" })));
    expect(status()).toBe("idle");
    expect(confirmSpy).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Upload CSV" }));
  });

  it("ignores Escape while confirming and hides the X", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, makePreview({ rows: [row(2), row(3)] })));
    fetchMock.mockReturnValueOnce(new Promise(() => {}));
    const { container } = render(<Flow />);
    await act(async () => {
      fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [csvFile("Unit\n101\n102\n")] } });
    });
    await act(() => vi.advanceTimersByTimeAsync(450));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Import 2 trucks" })));
    expect(status()).toBe("confirming");
    expect(closeButton()).toBeNull();
    await act(async () => fireEvent.keyDown(document.activeElement ?? document.body, { key: "Escape" }));
    expect(status()).toBe("confirming");
    expect(screen.queryByText(/Discard this import\?/)).toBeNull();
  });
});

describe("ImportSheet review", () => {
  it("shows the diff legend and the warnings count", () => {
    const preview = makePreview({
      counts: { rows_total: 300, created: 297, filled: 0, unchanged: 0, skipped: 3, warnings: 12, errors: 3 },
    });
    render(<ImportSheet importer={fakeImporter(reviewing(preview))} />);
    const legend = Array.from(document.querySelectorAll("li")).map((li) => li.textContent);
    expect(legend).toEqual(expect.arrayContaining(["Create 297", "Fill 0", "Unchanged 0", "Skip 3", "12 rows with warnings"]));
    expect(screen.getByRole("button", { name: "Import 297 · Skip 3" })).toBeTruthy();
  });

  it("names and describes the dialog", () => {
    render(<ImportSheet importer={fakeImporter(reviewing(makePreview()))} />);
    const dialog = screen.getByRole("dialog", { name: "Import trucks" });
    const describedBy = dialog.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy!)?.textContent).toBe(
      "Check what will change. Nothing is saved until you import."
    );
  });

  it("renders server problem groups, errors first, including unknown codes", () => {
    const g = (code: string, severity: "error" | "warning", rows: number[]) => ({
      code,
      severity,
      column: null,
      message: `${code}: message`,
      fix_hint: `${code}: hint`,
      rows,
    });
    const preview = makePreview({
      errors: [g("FOO_BAR", "error", [3])],
      warnings: [g("VIN_CHECK_DIGIT", "warning", [2])],
      ignored_columns: 2,
    });
    render(<ImportSheet importer={fakeImporter(reviewing(preview))} />);
    const text = document.body.textContent!;
    expect(text.indexOf("FOO_BAR: message")).toBeLessThan(text.indexOf("VIN_CHECK_DIGIT: message"));
    expect(text).toContain("FOO_BAR: hint");
    expect(text).toContain("2 columns ignored");
  });

  it("re-upload button calls repick, and all-skipped disables Import", () => {
    const preview = makePreview({ rows: [row(2, { action: "skip_error", error_codes: ["X"] })] });
    const importer = fakeImporter(reviewing(preview));
    render(<ImportSheet importer={importer} />);
    const primary = screen.getByRole("button", { name: "Nothing to import, fix your file" });
    expect(primary.hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Fix my file and re-upload" }));
    expect(importer.repick).toHaveBeenCalledTimes(1);
  });

  it("shows panel errors with the server text and offers another file", () => {
    const importer = fakeImporter({ status: "panelError", error: { message: "Required column missing: Unit number.", fixHint: "Add it." } });
    render(<ImportSheet importer={importer} />);
    expect(screen.getByRole("alert").textContent).toContain("Required column missing: Unit number.");
    fireEvent.click(screen.getByRole("button", { name: "Choose another file" }));
    expect(importer.repick).toHaveBeenCalled();
  });
});

describe("focus after an import", () => {
  it("follows the Upload button from the invite to the header after the reload", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, makePreview({ rows: [row(2), row(3)] })));
    fetchMock.mockResolvedValueOnce(jsonResponse(200, makePreview({ status: "committed", created_ids: ["a", "b"] })));
    const { container } = render(<MovingFlow />);
    await act(async () => {
      fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [csvFile("Unit\n101\n102\n")] } });
    });
    await act(() => vi.advanceTimersByTimeAsync(450));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Import 2 trucks" })));
    await act(() => vi.advanceTimersByTimeAsync(700));
    await act(() => vi.advanceTimersByTimeAsync(700));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    await act(() => vi.advanceTimersByTimeAsync(0));
    const headerButton = screen.getByTestId("header").querySelector("button");
    expect(headerButton).toBeTruthy();
    expect(document.activeElement).toBe(headerButton);
  });
});

describe("full flow privacy", () => {
  it("never writes to storage and never logs a cell value", async () => {
    const SENTINEL = "SENTINEL-CELL-7731";
    const setLocal = vi.spyOn(Storage.prototype, "setItem");
    const consoleSpies = (["log", "info", "warn", "error", "debug"] as const).map((k) =>
      vi.spyOn(console, k).mockImplementation(() => {})
    );
    const preview = makePreview({ header_map: { "0": "unit_number", "1": "notes" }, rows: [row(2), row(3)] });
    const committed = makePreview({ ...preview, status: "committed", dry_run: false, created_ids: ["a", "b"] });
    fetchMock.mockResolvedValueOnce(jsonResponse(200, preview));
    fetchMock.mockResolvedValueOnce(jsonResponse(200, committed));

    const { container } = render(<Flow />);
    await act(async () => {
      fireEvent.change(container.querySelector('input[type="file"]')!, {
        target: { files: [csvFile(`Unit,Notes\n101,${SENTINEL}\n102,x\n`)] },
      });
    });
    await act(() => vi.advanceTimersByTimeAsync(450));
    expect(document.body.textContent).toContain(SENTINEL);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Import 2 trucks" })));
    // Two steps of 700ms; each step's timer is set by an effect after the previous one fires
    await act(() => vi.advanceTimersByTimeAsync(700));
    expect(document.body.textContent).toContain("Saving 2 trucks");
    await act(() => vi.advanceTimersByTimeAsync(700));
    expect(document.body.textContent).toContain("2 trucks added ✓");
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(status()).toBe("idle");
    expect(document.body.textContent).not.toContain(SENTINEL);
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Upload CSV" }));

    expect(setLocal).not.toHaveBeenCalled();
    for (const spy of consoleSpies) {
      for (const call of spy.mock.calls) expect(JSON.stringify(call.map(String))).not.toContain(SENTINEL);
    }
  });
});

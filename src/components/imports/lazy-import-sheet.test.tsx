import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CsvImport } from "./use-csv-import";

// A panel chunk that fails to load, as on a dropped connection
vi.mock("@/components/imports/import-sheet", () => {
  throw new Error("Failed to load chunk");
});

const { LazyImportSheet } = await import("./lazy-import-sheet");
const { reducer } = await import("./use-csv-import");
const { makePreview } = await import("./test-fixtures");

afterEach(cleanup);

describe("LazyImportSheet", () => {
  it("reports a failed panel load instead of throwing to the error boundary", async () => {
    const panelLoadFailed = vi.fn();
    const importer = { panelLoadFailed } as unknown as CsvImport;
    const { container } = render(<LazyImportSheet importer={importer} />);
    await act(async () => {});
    expect(panelLoadFailed).toHaveBeenCalledTimes(1);
    expect(container.innerHTML).toBe("");
  });

  it("returns the flow to idle with the connection message", () => {
    const state = reducer(
      {
        status: "reviewing",
        file: { name: "f.csv", bytes: new ArrayBuffer(0) },
        parsed: { records: [], dataRowCount: 0, parseErrorCount: 0, encoding: "utf-8" },
        preview: makePreview(),
        note: null,
        error: null,
        discardPrompt: false,
      },
      { type: "PANEL_LOAD_FAIL" }
    );
    expect(state).toEqual({
      status: "idle",
      error: { message: "We couldn't reach Automari. Check your connection and try again.", fixHint: null },
    });
  });
});

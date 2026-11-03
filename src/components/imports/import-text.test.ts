import { describe, expect, it } from "vitest";
import { doneText, importLabels } from "./import-text";
import { makePreview } from "./test-fixtures";

describe("import-text", () => {
  it("importLabels covers no skips, some skips, all skipped, singular and drivers", () => {
    const counts = (rows_total: number, skipped: number) => makePreview({ counts: { rows_total, skipped } });
    expect(importLabels(counts(300, 0), "trucks")).toEqual({ primary: "Import 300 trucks", primaryDisabled: false, showSecondary: false });
    expect(importLabels(counts(300, 3), "trucks")).toEqual({ primary: "Import 297 · Skip 3", primaryDisabled: false, showSecondary: true });
    expect(importLabels(counts(3, 3), "trucks")).toEqual({ primary: "Nothing to import, fix your file", primaryDisabled: true, showSecondary: true });
    expect(importLabels(counts(1, 0), "trucks").primary).toBe("Import 1 truck");
    expect(importLabels(counts(2, 0), "drivers").primary).toBe("Import 2 drivers");
  });

  it("doneText follows the confirm counts", () => {
    expect(doneText("trucks", 297, 0)).toBe("297 trucks added ✓");
    expect(doneText("trucks", 297, 3)).toBe("297 trucks added, 3 updated ✓");
    expect(doneText("drivers", 1, 0)).toBe("1 driver added ✓");
    expect(doneText("trucks", 0, 0)).toBe("Your fleet is already up to date ✓");
  });
});

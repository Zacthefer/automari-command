import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { parseCsv, type ParsedCsv } from "@/lib/csv-read";
import { alignRows, HIDDEN_VALUES_TEXT, PreviewTable } from "./preview-table";
import { makePreview, row } from "./test-fixtures";
import type { ImportResponse } from "@/types/imports";

const parse = (text: string): ParsedCsv => ({ ...parseCsv(text), encoding: "utf-8" });

const headerMap = { "0": "unit_number", "1": "vin", "2": null };

afterEach(cleanup);

function cellsOf(container: HTMLElement, rowNumber: number) {
  const tr = container.querySelector(`tr[data-row="${rowNumber}"]`)!;
  return Array.from(tr.querySelectorAll("td")).map((td) => td.textContent);
}

describe("alignRows / values", () => {
  it("matches values by row number when the server skips a blank row", () => {
    const parsed = parse("Unit,VIN,Color\n101,AAA,red\n\n 103 ,CCC,blue\n");
    const preview = makePreview({ header_map: headerMap, rows: [row(2), row(4)] });
    const { container } = render(<PreviewTable parsed={parsed} preview={preview} />);
    expect(cellsOf(container, 4)).toEqual(["4", "Create", "103", "CCC"]);
    expect(cellsOf(container, 2)).toEqual(["2", "Create", "101", "AAA"]);
    expect(screen.queryByText(HIDDEN_VALUES_TEXT)).toBeNull();
  });

  const good = () => parse("Unit,VIN,Color\n101,AAA,red\n\n103,CCC,blue\n");
  const goodPreview = (over: Partial<ImportResponse> = {}) =>
    makePreview({ header_map: headerMap, rows: [row(2), row(4)], ...over });

  it.each<[string, () => [ParsedCsv, ImportResponse]]>([
    ["a server row with no browser record", () => [good(), goodPreview({ rows: [row(2), row(4), row(9)] })]],
    ["a blank browser record at a server row", () => [good(), goodPreview({ rows: [row(2), row(3)] })]],
    ["a header length different from header_map", () => [parse("Unit,VIN\n101,AAA\n\n103,CCC\n"), goodPreview()]],
    ["header_map keys that aren't 0…k-1", () => [good(), goodPreview({ header_map: { "0": "unit_number", "1": "vin", "3": null } })]],
    ["a different count of non-blank rows", () => [parse("Unit,VIN,Color\n101,AAA,red\n102,BBB,x\n103,CCC,blue\n"), goodPreview()]],
    ["parse errors", () => [{ ...good(), parseErrorCount: 1 }, goodPreview()]],
  ])("hides every value for %s", (_name, build) => {
    const [parsed, preview] = build();
    expect(alignRows(parsed, preview).ok).toBe(false);
    const { container } = render(<PreviewTable parsed={parsed} preview={preview} />);
    expect(screen.getByText(HIDDEN_VALUES_TEXT)).toBeTruthy();
    expect(container.textContent).not.toContain("AAA");
    expect(container.textContent).not.toContain("101");
    expect(container.querySelectorAll("th")).toHaveLength(2);
  });
});

describe("PreviewTable layout", () => {
  // 4,850 rows parsed and 250 rendered: slow under a loaded parallel run, hence the longer timeout
  it("pins the first 100 of 150 problem rows and pages the other 4,700 at 100 a time", () => {
    const lines = ["Unit"];
    const rows = [];
    for (let n = 2; n <= 4851; n++) {
      lines.push(String(n));
      // Every 32nd row has a problem until there are 150 of them
      const problem = n % 32 === 0 && n <= 32 * 150;
      rows.push(problem ? row(n, { action: "skip_error", error_codes: ["X"] }) : row(n));
    }
    expect(rows.filter((r) => r.error_codes.length)).toHaveLength(150);
    const parsed = parse(lines.join("\n"));
    const preview = makePreview({ header_map: { "0": "unit_number" }, rows });
    const { container } = render(<PreviewTable parsed={parsed} preview={preview} />);
    expect(container.querySelectorAll('[data-section="pinned"] tr[data-row]')).toHaveLength(100);
    expect(container.textContent).toContain("Rows with problems (150)");
    expect(container.textContent).toContain("50 more rows with problems.");
    expect(container.querySelectorAll('[data-section="others"] tr[data-row]')).toHaveLength(100);
    expect(container.textContent).toContain("Rows 1–100 of 4,700");
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(container.textContent).toContain("Rows 101–200 of 4,700");
    expect(container.querySelectorAll('[data-section="pinned"] tr[data-row]')).toHaveLength(100);
    const firstOnPage = container.querySelector('[data-section="others"] tr[data-row]')!.getAttribute("data-row");
    expect(Number(firstOnPage)).toBeGreaterThan(100);
  }, 20_000);

  it("marks filled cells and says so to screen readers", () => {
    const parsed = parse("Unit,VIN,Color\n101,AAA,red\n");
    const preview = makePreview({ header_map: headerMap, rows: [row(2, { action: "fill", filled_fields: ["vin"] })] });
    const { container } = render(<PreviewTable parsed={parsed} preview={preview} />);
    const filled = container.querySelector("td[data-filled]")!;
    expect(filled.className).toContain("bg-[var(--brand-cyan-dim)]");
    expect(filled.textContent).toBe("AAA (will be filled in)");
    expect(filled.querySelector(".sr-only")).toBeTruthy();
  });

  it("shows 'Saved, no VIN' for a dropped VIN", () => {
    const parsed = parse("Unit,VIN,Color\n101,BADVIN,red\n");
    const preview = makePreview({
      header_map: headerMap,
      rows: [row(2, { warning_codes: ["VIN_CHECK_DIGIT"], vin_dropped: true })],
    });
    render(<PreviewTable parsed={parsed} preview={preview} />);
    expect(screen.getByText("Saved, no VIN")).toBeTruthy();
  });

  it("renders hostile cells as plain text", () => {
    const parsed = parse('Unit,VIN,Color\n"<img src=x onerror=""window.__x=1"">",https://evil.example,red\n');
    const preview = makePreview({ header_map: headerMap, rows: [row(2)] });
    const { container } = render(<PreviewTable parsed={parsed} preview={preview} />);
    expect(container.textContent).toContain('<img src=x onerror="window.__x=1">');
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("a")).toBeNull();
    expect((window as unknown as { __x?: number }).__x).toBeUndefined();
  });

  it("labels a column named __proto__ with its raw name", () => {
    const parsed = parse("A,B\n1,2\n");
    const preview = makePreview({ header_map: { "0": "__proto__", "1": "unit_number" }, rows: [row(2)] });
    const { container } = render(<PreviewTable parsed={parsed} preview={preview} />);
    const headers = Array.from(container.querySelectorAll("th")).map((th) => th.textContent);
    expect(headers).toEqual(["Row", "Action", "__proto__", "Unit number"]);
  });

  it("never shows ignored columns' values", () => {
    const parsed = parse("Unit,VIN,Secret\n101,AAA,SENTINEL-IGNORED\n");
    const preview = makePreview({ header_map: headerMap, rows: [row(2)], ignored_columns: 1 });
    const { container } = render(<PreviewTable parsed={parsed} preview={preview} />);
    expect(container.innerHTML).not.toContain("SENTINEL-IGNORED");
  });
});

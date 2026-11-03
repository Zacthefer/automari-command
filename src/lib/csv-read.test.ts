import { describe, expect, it, vi } from "vitest";
import { readCsv, type ReadCsvResult } from "./csv-read";

function csvFile(content: string | Uint8Array<ArrayBuffer>, name = "fleet.csv") {
  return new File([content], name, { type: "text/csv" });
}

function ok(result: ReadCsvResult) {
  if (!result.ok) throw new Error(`expected ok, got ${result.code}`);
  return result;
}

describe("readCsv decoding", () => {
  it("drops a UTF-8 BOM from the first header cell", async () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, ...new TextEncoder().encode("unit_number,vin\n101,X\n")]);
    const { parsed, held } = ok(await readCsv(csvFile(bytes)));
    expect(parsed.records[0][0]).toBe("unit_number");
    expect(parsed.encoding).toBe("utf-8");
    // The held bytes are the original bytes, BOM included
    expect(Array.from(new Uint8Array(held.bytes)).slice(0, 3)).toEqual([0xef, 0xbb, 0xbf]);
  });

  it("drops exactly one BOM, like the server", async () => {
    const bom = [0xef, 0xbb, 0xbf];
    const bytes = new Uint8Array([...bom, ...bom, ...new TextEncoder().encode("unit_number\n101\n")]);
    const { parsed } = ok(await readCsv(csvFile(bytes)));
    expect(parsed.records[0][0]).toBe("\uFEFFunit_number");
  });

  it("falls back to Windows-1252 for invalid UTF-8", async () => {
    const bytes = new Uint8Array([...new TextEncoder().encode("name\n"), 0x45, 0xe9, 0x0a]);
    const { parsed } = ok(await readCsv(csvFile(bytes)));
    expect(parsed.records[1][0]).toBe("Eé");
    expect(parsed.encoding).toBe("windows-1252");
  });
});

describe("readCsv numbering", () => {
  it("counts a quoted cell with a line break as one record", async () => {
    const { parsed } = ok(await readCsv(csvFile('unit,notes\r\n1,"line one\r\nline two"\r\n2,x\r\n')));
    expect(parsed.records[1]).toEqual(["1", "line one\r\nline two"]);
    // Row 3 in the spreadsheet is still unit 2
    expect(parsed.records[2]).toEqual(["2", "x"]);
    expect(parsed.dataRowCount).toBe(2);
  });

  it("keeps the numbers of blank and whitespace-only lines", async () => {
    const { parsed } = ok(await readCsv(csvFile("unit\na\n\n  \nb\n")));
    expect(parsed.records[4]).toEqual(["b"]);
    expect(parsed.dataRowCount).toBe(2);
    expect(parsed.parseErrorCount).toBe(0);
  });

  it("does not detect other delimiters", async () => {
    const { parsed } = ok(await readCsv(csvFile("unit;vin\n1;X\n")));
    expect(parsed.records[0]).toEqual(["unit;vin"]);
    expect(parsed.records[1]).toEqual(["1;X"]);
  });

  it("counts parse errors without keeping their messages", async () => {
    const { parsed } = ok(await readCsv(csvFile('unit\n"never closed\n')));
    expect(parsed.parseErrorCount).toBeGreaterThan(0);
  });
});

describe("readCsv pre-checks", () => {
  it("rejects a file over 2 MB from its size, without reading it", async () => {
    const file = csvFile(new Uint8Array(2 * 1024 * 1024 + 1));
    const arrayBuffer = vi.fn();
    Object.defineProperty(file, "arrayBuffer", { value: arrayBuffer });
    expect(await readCsv(file)).toEqual({ ok: false, code: "FILE_TOO_LARGE" });
    expect(arrayBuffer).not.toHaveBeenCalled();
  });

  it("reads the file once with arrayBuffer when the browser has it", async () => {
    const file = csvFile("unit\n1\n");
    const bytes = new TextEncoder().encode("unit\n1\n").buffer;
    const arrayBuffer = vi.fn().mockResolvedValue(bytes);
    Object.defineProperty(file, "arrayBuffer", { value: arrayBuffer });
    const { held } = ok(await readCsv(file));
    expect(arrayBuffer).toHaveBeenCalledTimes(1);
    expect(held.bytes).toBe(bytes);
  });

  it("rejects more than 5,000 non-blank data rows", async () => {
    const rows = Array.from({ length: 5001 }, (_, i) => String(i)).join("\n");
    expect(await readCsv(csvFile(`unit\n${rows}\n`))).toEqual({ ok: false, code: "TOO_MANY_ROWS" });
  });

  it("allows 5,000 data rows plus blank lines", async () => {
    const rows = Array.from({ length: 5000 }, (_, i) => String(i)).join("\n");
    const { parsed } = ok(await readCsv(csvFile(`unit\n${rows}\n${"\n".repeat(10)}`)));
    expect(parsed.dataRowCount).toBe(5000);
  });

  it.each(["fleet.xlsx", "fleet.txt", "fleet.csv.txt"])("rejects %s as not CSV", async (name) => {
    expect(await readCsv(csvFile("unit\n1\n", name))).toEqual({ ok: false, code: "NOT_CSV" });
  });

  it("accepts an upper-case .CSV extension and keeps the original name", async () => {
    const { held } = ok(await readCsv(csvFile("unit\n1\n", "FLEET.CSV")));
    expect(held.name).toBe("FLEET.CSV");
  });

  it("rejects an empty file", async () => {
    expect(await readCsv(csvFile(""))).toEqual({ ok: false, code: "EMPTY_FILE" });
  });
});

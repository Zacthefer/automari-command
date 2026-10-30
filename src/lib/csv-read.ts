import Papa from "papaparse";
import type { HeldFile } from "@/lib/api-imports";
import { IMPORT_MAX_BYTES, IMPORT_MAX_ROWS } from "@/types/imports";

// Reads a picked CSV once and parses it for display. Only ever loaded with import(),
// so papaparse stays out of the page bundle. The decoded text is for showing values;
// the original bytes are what gets uploaded.

export type PrecheckCode = "NOT_CSV" | "FILE_TOO_LARGE" | "EMPTY_FILE" | "TOO_MANY_ROWS";

// Word for word from automari-freight imports/constants.py PROBLEMS; update both together
export const PRECHECK_TEXT: Record<PrecheckCode, { message: string; fixHint: string }> = {
  NOT_CSV: {
    message: "This file isn't a CSV file.",
    fixHint: 'In Excel or Google Sheets choose Save As / Download → "CSV UTF-8", then upload that file.',
  },
  FILE_TOO_LARGE: {
    message: "This file is larger than 2 MB.",
    fixHint: "Split it into smaller files or delete columns you don't need.",
  },
  EMPTY_FILE: {
    message: "This file is empty.",
    fixHint: "Make sure the first row has column headings and the rows below have your data.",
  },
  TOO_MANY_ROWS: {
    message: "This file has more than 5,000 rows.",
    fixHint: "Split it into files of 5,000 rows or fewer.",
  },
};

export interface ParsedCsv {
  /** One entry per CSV record; records[i] is spreadsheet row i + 1 (header = row 1). */
  records: string[][];
  /** Non-blank records after the header. */
  dataRowCount: number;
  parseErrorCount: number;
  encoding: "utf-8" | "windows-1252";
}

export type ReadCsvResult = { ok: true; held: HeldFile; parsed: ParsedCsv } | { ok: false; code: PrecheckCode };

export const isBlankRecord = (record: string[] | undefined) => !record || record.every((cell) => !cell.trim());

function readBytes(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === "function") return file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/** Strict UTF-8 first (BOM dropped), then Windows-1252, the same order as the server. */
export function decode(bytes: ArrayBuffer): { text: string; encoding: ParsedCsv["encoding"] } {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return { text: text.startsWith("﻿") ? text.slice(1) : text, encoding: "utf-8" };
  } catch {
    return { text: new TextDecoder("windows-1252").decode(bytes), encoding: "windows-1252" };
  }
}

export function parseCsv(text: string): Omit<ParsedCsv, "encoding"> {
  // No delimiter sniffing and no type coercion: the server reads plain comma CSV as strings
  const result = Papa.parse<string[]>(text, {
    delimiter: ",",
    quoteChar: '"',
    escapeChar: '"',
    header: false,
    dynamicTyping: false,
    skipEmptyLines: false,
  });
  const records = result.data;
  let dataRowCount = 0;
  for (let i = 1; i < records.length; i++) if (!isBlankRecord(records[i])) dataRowCount++;
  return { records, dataRowCount, parseErrorCount: result.errors.length };
}

export async function readCsv(file: File): Promise<ReadCsvResult> {
  if (!file.name.toLowerCase().endsWith(".csv")) return { ok: false, code: "NOT_CSV" };
  // Size is checked before reading so an oversized file is never loaded into memory
  if (file.size > IMPORT_MAX_BYTES) return { ok: false, code: "FILE_TOO_LARGE" };
  if (file.size === 0) return { ok: false, code: "EMPTY_FILE" };

  const bytes = await readBytes(file);
  const { text, encoding } = decode(bytes);
  const parsed = { ...parseCsv(text), encoding };
  if (parsed.dataRowCount > IMPORT_MAX_ROWS) return { ok: false, code: "TOO_MANY_ROWS" };
  return { ok: true, held: { name: file.name, bytes }, parsed };
}

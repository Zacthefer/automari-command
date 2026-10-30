"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { ParsedCsv } from "@/lib/csv-read";
import { FIELD_LABELS, type ImportResponse, type ImportRowAction, type ImportRowResult } from "@/types/imports";

// The server returns row numbers, never cell values. Values shown here come from the
// browser's own parse, matched by spreadsheet row number. If the two parses can't be
// shown to line up, every value is hidden rather than risk one next to the wrong row.

export const PAGE_SIZE = 100;

export const HIDDEN_VALUES_TEXT =
  "We can't line up the cells in this file with our check, so values are hidden. Row numbers and problems below are exact.";

const ACTION_LABEL: Record<ImportRowAction, string> = {
  create: "Create",
  fill: "Fill",
  unchanged: "Unchanged",
  skip_error: "Skip",
};

const ACTION_STYLE: Record<ImportRowAction, string> = {
  create: "bg-[var(--brand-cyan-dim)] text-[var(--brand-link)]",
  fill: "bg-[var(--brand-cyan-dim)] text-[var(--brand-link)]",
  unchanged: "bg-muted text-muted-foreground",
  skip_error: "bg-destructive/10 text-destructive",
};

// Same rule as the server's blank-row check (any cell with non-whitespace)
const isBlank = (record: string[] | undefined) => !record || record.every((cell) => !cell.trim());

export type Alignment = { ok: true; valueAt: (row: number, position: number) => string } | { ok: false };

/** Proves the browser parse numbers rows the way the server did; otherwise values stay hidden. */
export function alignRows(parsed: ParsedCsv, preview: ImportResponse): Alignment {
  if (parsed.parseErrorCount !== 0) return { ok: false };

  const keys = Object.keys(preview.header_map);
  const k = keys.length;
  const expected = new Set(Array.from({ length: k }, (_, i) => String(i)));
  if (!keys.every((key) => expected.has(key))) return { ok: false };
  if (parsed.records[0]?.length !== k) return { ok: false };

  for (const { row } of preview.rows) {
    if (row < 2 || isBlank(parsed.records[row - 1])) return { ok: false };
  }
  if (parsed.dataRowCount !== preview.rows.length) return { ok: false };

  return { ok: true, valueAt: (row, position) => parsed.records[row - 1]?.[position]?.trim() ?? "" };
}

const hasProblem = (r: ImportRowResult) => r.error_codes.length > 0 || r.warning_codes.length > 0;
const format = (n: number) => n.toLocaleString("en-US");

export function PreviewTable({ parsed, preview }: { parsed: ParsedCsv; preview: ImportResponse }) {
  const alignment = useMemo(() => alignRows(parsed, preview), [parsed, preview]);

  // Mapped columns in file order; ignored columns are never rendered
  const columns = useMemo(
    () =>
      Object.entries(preview.header_map)
        .filter((entry): entry is [string, string] => entry[1] !== null)
        .map(([position, field]) => ({ position: Number(position), field }))
        .sort((a, b) => a.position - b.position),
    [preview]
  );

  const { pinned, others } = useMemo(() => {
    const byRow = new Map<number, ImportRowResult>(preview.rows.map((r) => [r.row, r]));
    const sorted = [...byRow.values()].sort((a, b) => a.row - b.row);
    return { pinned: sorted.filter(hasProblem), others: sorted.filter((r) => !hasProblem(r)) };
  }, [preview]);

  // Paging resets whenever a new preview arrives
  const [paging, setPaging] = useState({ preview, page: 0 });
  const page = paging.preview === preview ? paging.page : 0;
  const pageCount = Math.max(1, Math.ceil(others.length / PAGE_SIZE));
  const start = page * PAGE_SIZE;
  const visible = others.slice(start, start + PAGE_SIZE);
  const goTo = (next: number) => setPaging({ preview, page: next });

  const shownColumns = alignment.ok ? columns : [];
  const colSpan = 2 + shownColumns.length;
  const head = "text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground";

  function renderRow(r: ImportRowResult) {
    return (
      <TableRow key={r.row} data-row={r.row} className="h-10 border-slate-100">
        <TableCell className="font-mono text-[13px] text-muted-foreground tabular-nums">{r.row}</TableCell>
        <TableCell>
          <span className="inline-flex flex-wrap gap-1">
            <Badge variant="secondary" className={ACTION_STYLE[r.action]}>
              {ACTION_LABEL[r.action]}
            </Badge>
            {r.vin_dropped ? (
              <Badge variant="secondary" className="bg-amber-50 text-amber-700">
                Saved, no VIN
              </Badge>
            ) : null}
          </span>
        </TableCell>
        {alignment.ok
          ? shownColumns.map(({ position, field }) => {
              const filled = r.filled_fields.includes(field);
              return (
                <TableCell
                  key={field}
                  data-filled={filled || undefined}
                  className={cn("max-w-[16rem] truncate text-sm text-foreground", filled && "bg-[var(--brand-cyan-dim)]")}
                >
                  {alignment.valueAt(r.row, position)}
                  {filled ? <span className="sr-only"> (will be filled in)</span> : null}
                </TableCell>
              );
            })
          : null}
      </TableRow>
    );
  }

  return (
    <div className="space-y-3">
      {!alignment.ok ? (
        <p role="note" className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {HIDDEN_VALUES_TEXT}
        </p>
      ) : null}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className={head}>Row</TableHead>
              <TableHead className={head}>Action</TableHead>
              {shownColumns.map(({ field }) => (
                <TableHead key={field} className={head}>
                  {FIELD_LABELS[field] ?? field}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          {pinned.length > 0 ? (
            <TableBody data-section="pinned">
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={colSpan} className="bg-muted/50 text-xs font-medium text-muted-foreground">
                  Rows with problems ({format(pinned.length)})
                </TableCell>
              </TableRow>
              {pinned.map(renderRow)}
            </TableBody>
          ) : null}
          {others.length > 0 ? (
            <TableBody data-section="others">
              {pinned.length > 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={colSpan} className="bg-muted/50 text-xs font-medium text-muted-foreground">
                    Other rows
                  </TableCell>
                </TableRow>
              ) : null}
              {visible.map(renderRow)}
            </TableBody>
          ) : null}
        </Table>
      </div>
      {others.length > PAGE_SIZE ? (
        <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
          <span className="tabular-nums">
            Rows {format(start + 1)}–{format(start + visible.length)} of {format(others.length)}
          </span>
          <span className="flex gap-2">
            <Button type="button" variant="outline" size="sm" disabled={page === 0} onClick={() => goTo(page - 1)}>
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= pageCount - 1}
              onClick={() => goTo(page + 1)}
            >
              Next
            </Button>
          </span>
        </div>
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BolStatusChip } from "./bol-status-chip";
import type { BOL } from "@/types";

interface BolTableProps {
  bols: BOL[];
}

export function BolTable({ bols }: BolTableProps) {
  if (bols.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 shadow-[var(--shadow-elevated-1)]">
        <p className="text-sm text-subtle-foreground">No BOLs found</p>
        <p className="mt-1 text-xs text-subtle-foreground">
          BOLs will appear here once drivers submit them via text.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated-1)]">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
              PRO #
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
              BOL #
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
              Shipper
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
              Consignee
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
              Status
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
              Date
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bols.map((bol) => (
            <TableRow key={bol.id} className="group h-11 border-slate-100">
              <TableCell>
                <Link
                  href={`/bols/${bol.id}`}
                  className="font-mono text-[13px] font-medium text-foreground transition-colors group-hover:text-[var(--brand-link)]"
                >
                  {bol.pro_number || "—"}
                </Link>
              </TableCell>
              <TableCell className="font-mono text-[13px] text-foreground">
                {bol.bol_number || "—"}
              </TableCell>
              <TableCell className="text-sm text-foreground">
                {bol.shipper_name || "—"}
              </TableCell>
              <TableCell className="text-sm text-foreground">
                {bol.consignee_name || "—"}
              </TableCell>
              <TableCell>
                <BolStatusChip status={bol.status} />
              </TableCell>
              <TableCell className="text-[13px] text-foreground tabular-nums">
                {format(new Date(bol.created_at), "MMM d, yyyy")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

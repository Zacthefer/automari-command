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
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-16">
        <p className="text-sm text-slate-500">No BOLs found</p>
        <p className="mt-1 text-xs text-slate-400">
          BOLs will appear here once drivers submit them via text.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              PRO #
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              BOL #
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Shipper
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Consignee
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Status
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
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
                  className="font-mono text-[13px] font-medium text-slate-900 transition-colors group-hover:text-blue-600"
                >
                  {bol.pro_number || "—"}
                </Link>
              </TableCell>
              <TableCell className="font-mono text-[13px] text-slate-600">
                {bol.bol_number || "—"}
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {bol.shipper_name || "—"}
              </TableCell>
              <TableCell className="text-sm text-slate-600">
                {bol.consignee_name || "—"}
              </TableCell>
              <TableCell>
                <BolStatusChip status={bol.status} />
              </TableCell>
              <TableCell className="text-[13px] text-slate-500 tabular-nums">
                {format(new Date(bol.created_at), "MMM d, yyyy")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

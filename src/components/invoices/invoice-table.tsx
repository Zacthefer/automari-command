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
import { InvoiceStatusChip } from "./invoice-status-chip";
import type { Invoice } from "@/types";

interface InvoiceTableProps {
  invoices: Invoice[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function InvoiceTable({ invoices }: InvoiceTableProps) {
  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border-0 bg-white py-16 shadow-[var(--shadow-elevated-1)]">
        <p className="text-sm text-slate-500">No invoices found</p>
        <p className="mt-1 text-xs text-slate-400">
          Invoices are auto-generated from processed BOLs.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border-0 bg-white shadow-[var(--shadow-elevated-1)]">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs font-medium text-slate-500">
              Invoice #
            </TableHead>
            <TableHead className="text-xs font-medium text-slate-500">
              Bill To
            </TableHead>
            <TableHead className="text-xs font-medium text-slate-500">
              PRO #
            </TableHead>
            <TableHead className="text-xs font-medium text-slate-500">
              Amount
            </TableHead>
            <TableHead className="text-xs font-medium text-slate-500">
              Status
            </TableHead>
            <TableHead className="text-xs font-medium text-slate-500">
              Due Date
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((inv) => (
            <TableRow key={inv.id} className="group">
              <TableCell>
                <Link
                  href={`/invoices/${inv.id}`}
                  className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors"
                >
                  {inv.invoice_number}
                </Link>
              </TableCell>
              <TableCell className="text-slate-600">
                {inv.bill_to_name}
              </TableCell>
              <TableCell className="text-slate-600">
                {inv.pro_number || "—"}
              </TableCell>
              <TableCell className="font-medium text-slate-900">
                {formatCurrency(inv.total_amount)}
              </TableCell>
              <TableCell>
                <InvoiceStatusChip status={inv.status} />
              </TableCell>
              <TableCell className="text-slate-500 text-sm">
                {inv.due_date
                  ? format(new Date(inv.due_date), "MMM d, yyyy")
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

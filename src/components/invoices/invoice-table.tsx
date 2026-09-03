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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-card py-16 shadow-[var(--shadow-elevated-1)]">
        <p className="text-sm text-[#d5e6f6]">No invoices found</p>
        <p className="mt-1 text-xs text-[#b7cce0]">
          Invoices are auto-generated from processed BOLs.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-card shadow-[var(--shadow-elevated-1)]">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c5d8eb]">
              Invoice #
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c5d8eb]">
              Bill To
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c5d8eb]">
              PRO #
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c5d8eb]">
              Amount
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c5d8eb]">
              Status
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c5d8eb]">
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
                  className="font-medium text-foreground group-hover:text-[var(--brand-cyan)] transition-colors"
                >
                  {inv.invoice_number}
                </Link>
              </TableCell>
              <TableCell className="text-[#d7e8f8]">
                {inv.bill_to_name}
              </TableCell>
              <TableCell className="text-[#d7e8f8]">
                {inv.pro_number || "—"}
              </TableCell>
              <TableCell className="font-medium text-foreground">
                {formatCurrency(inv.total_amount)}
              </TableCell>
              <TableCell>
                <InvoiceStatusChip status={inv.status} />
              </TableCell>
              <TableCell className="text-sm text-[#d7e8f8]">
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

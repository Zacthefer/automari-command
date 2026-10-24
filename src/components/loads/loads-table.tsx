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
import { LoadStatusChip } from "./load-status-chip";
import { PaymentStatusChip } from "./payment-status-chip";
import type { LoadSummary } from "@/types";

interface LoadsTableProps {
  loads: LoadSummary[];
}

function formatCurrency(cents: number | null): string {
  if (cents == null) return "—";
  return `$${cents.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatRoute(origin: string | null, destination: string | null): string {
  if (origin && destination) return `${origin} → ${destination}`;
  return origin || destination || "—";
}

export function LoadsTable({ loads }: LoadsTableProps) {
  if (loads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 shadow-[var(--shadow-elevated-1)]">
        <p className="text-sm text-subtle-foreground">No loads found</p>
        <p className="mt-1 text-xs text-subtle-foreground">
          Upload a rate confirmation to create your first load.
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
              Load #
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
              Broker
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
              Route
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
              Rate
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
              Status
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
              Payment
            </TableHead>
            <TableHead className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
              Date
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loads.map((load) => (
            <TableRow key={load.id} className="group h-11 border-slate-100">
              <TableCell>
                <Link
                  href={`/loads/${load.id}`}
                  className="font-mono text-[13px] font-medium text-foreground transition-colors group-hover:text-[var(--brand-link)]"
                >
                  {load.load_number || load.id.slice(0, 8)}
                </Link>
              </TableCell>
              <TableCell className="text-sm text-foreground">
                {load.broker_name || "—"}
              </TableCell>
              <TableCell className="text-sm text-foreground">
                {formatRoute(load.origin, load.destination)}
              </TableCell>
              <TableCell className="font-mono text-[13px] text-foreground tabular-nums">
                {formatCurrency(load.current_total)}
              </TableCell>
              <TableCell>
                <LoadStatusChip status={load.status} />
              </TableCell>
              <TableCell>
                <PaymentStatusChip status={load.payment_status} />
              </TableCell>
              <TableCell className="text-[13px] text-foreground tabular-nums">
                {format(new Date(load.created_at), "MMM d, yyyy")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

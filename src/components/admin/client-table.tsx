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
import { Badge } from "@/components/ui/badge";
import type { Tenant } from "@/types";

interface ClientTableProps {
  clients: Tenant[];
}

export function ClientTable({ clients }: ClientTableProps) {
  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-card py-16 shadow-[var(--shadow-elevated-1)]">
        <p className="text-sm text-[#d5e6f6]">No clients yet</p>
        <p className="mt-1 text-xs text-[#b7cce0]">
          Add your first client to get started.
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
              Company
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c5d8eb]">
              Contact
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c5d8eb]">
              Email
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c5d8eb]">
              Status
            </TableHead>
            <TableHead className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c5d8eb]">
              Created
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id} className="group">
              <TableCell>
                <Link
                  href={`/admin/clients/${client.id}`}
                  className="font-medium text-foreground group-hover:text-[var(--brand-cyan)] transition-colors"
                >
                  {client.company_name}
                </Link>
              </TableCell>
              <TableCell className="text-[#d7e8f8]">
                {client.contact_name}
              </TableCell>
              <TableCell className="text-[#d7e8f8]">
                {client.contact_email}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={
                    client.is_active
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-100"
                  }
                >
                  {client.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-[#d7e8f8]">
                {format(new Date(client.created_at), "MMM d, yyyy")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

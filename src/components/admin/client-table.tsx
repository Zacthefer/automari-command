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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 shadow-[var(--shadow-elevated-1)]">
        <p className="text-sm text-subtle-foreground">No clients yet</p>
        <p className="mt-1 text-xs text-subtle-foreground">
          Add your first client to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated-1)]">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs font-medium uppercase tracking-[0.12em] text-subtle-foreground">
              Company
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-[0.12em] text-subtle-foreground">
              Contact
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-[0.12em] text-subtle-foreground">
              Email
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-[0.12em] text-subtle-foreground">
              Status
            </TableHead>
            <TableHead className="text-xs font-medium uppercase tracking-[0.12em] text-subtle-foreground">
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
                  className="font-medium text-foreground group-hover:text-[var(--brand-link)] transition-colors"
                >
                  {client.company_name}
                </Link>
              </TableCell>
              <TableCell className="text-foreground">
                {client.contact_name}
              </TableCell>
              <TableCell className="text-foreground">
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
              <TableCell className="text-sm text-foreground">
                {format(new Date(client.created_at), "MMM d, yyyy")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

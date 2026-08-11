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
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-16">
        <p className="text-sm text-slate-500">No clients yet</p>
        <p className="mt-1 text-xs text-slate-400">
          Add your first client to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs font-medium text-slate-500">
              Company
            </TableHead>
            <TableHead className="text-xs font-medium text-slate-500">
              Contact
            </TableHead>
            <TableHead className="text-xs font-medium text-slate-500">
              Email
            </TableHead>
            <TableHead className="text-xs font-medium text-slate-500">
              Status
            </TableHead>
            <TableHead className="text-xs font-medium text-slate-500">
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
                  className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors"
                >
                  {client.company_name}
                </Link>
              </TableCell>
              <TableCell className="text-slate-600">
                {client.contact_name}
              </TableCell>
              <TableCell className="text-slate-600">
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
              <TableCell className="text-slate-500 text-sm">
                {format(new Date(client.created_at), "MMM d, yyyy")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

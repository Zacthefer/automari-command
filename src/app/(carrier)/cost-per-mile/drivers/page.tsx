"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { getDrivers } from "@/lib/api-cpm";
import type { Driver } from "@/types/cost-per-mile";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  inactive: "bg-slate-100 text-slate-500 hover:bg-slate-100",
  on_leave: "bg-amber-50 text-amber-700 hover:bg-amber-50",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  on_leave: "On Leave",
};

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDrivers()
      .then(setDrivers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/cost-per-mile"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <PageHeader title="Drivers" description="Drivers tracked for cost per mile." />
      </div>

      {drivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-card py-16 shadow-[var(--shadow-elevated-1)]">
          <p className="text-sm text-slate-500">No drivers found</p>
          <p className="mt-1 text-xs text-slate-400">
            Add drivers to track per-driver cost per mile.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-card shadow-[var(--shadow-elevated-1)]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Name
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Phone
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  CDL
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id} className="group h-11 border-slate-100">
                  <TableCell className="text-sm font-medium text-foreground">
                    {driver.first_name} {driver.last_name}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {driver.phone || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-[13px] text-slate-500">
                    {driver.cdl_number
                      ? `${driver.cdl_number} (${driver.cdl_state || "—"})`
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={statusStyles[driver.status] || ""}
                    >
                      {statusLabels[driver.status] || driver.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

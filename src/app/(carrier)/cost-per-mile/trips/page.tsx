"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
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
import { getTrips } from "@/lib/api-cpm";
import type { Trip } from "@/types/cost-per-mile";

const statusStyles: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  in_transit: "bg-blue-50 text-blue-700 hover:bg-blue-50",
  planned: "bg-slate-100 text-slate-500 hover:bg-slate-100",
};

const statusLabels: Record<string, string> = {
  completed: "Completed",
  in_transit: "In Transit",
  planned: "Planned",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrips({ limit: 100 })
      .then(setTrips)
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
        <PageHeader
          title="Trips"
          description="All logged trips across the fleet."
        />
      </div>

      {trips.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-0 bg-white py-16 shadow-[var(--shadow-elevated-1)]">
          <p className="text-sm text-slate-500">No trips found</p>
          <p className="mt-1 text-xs text-slate-400">
            Log trips to start tracking cost per mile.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border-0 bg-white shadow-[var(--shadow-elevated-1)]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Lane
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Miles
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Revenue
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  $/Mile
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Date
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((trip) => (
                <TableRow
                  key={trip.id}
                  className="group h-11 border-slate-100"
                >
                  <TableCell className="text-sm text-slate-900">
                    {trip.origin_city}, {trip.origin_state} →{" "}
                    {trip.destination_city}, {trip.destination_state}
                  </TableCell>
                  <TableCell className="font-mono text-[13px] text-slate-600 tabular-nums">
                    {formatNumber(trip.miles)}
                  </TableCell>
                  <TableCell className="font-mono text-[13px] font-medium text-slate-900 tabular-nums">
                    {formatCurrency(trip.revenue)}
                  </TableCell>
                  <TableCell className="font-mono text-[13px] text-slate-600 tabular-nums">
                    ${(trip.revenue / trip.miles).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-[13px] text-slate-500 tabular-nums">
                    {format(new Date(trip.start_date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={statusStyles[trip.status] || ""}
                    >
                      {statusLabels[trip.status] || trip.status}
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

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
import { getTrucks } from "@/lib/api-cpm";
import type { Truck } from "@/types/cost-per-mile";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  inactive: "bg-slate-100 text-slate-500 hover:bg-slate-100",
  maintenance: "bg-amber-50 text-amber-700 hover:bg-amber-50",
};

export default function TrucksPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrucks()
      .then(setTrucks)
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
        <PageHeader title="Trucks" description="Fleet vehicles tracked for cost per mile." />
      </div>

      {trucks.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-card py-16 shadow-[var(--shadow-elevated-1)]">
          <p className="text-sm text-[#d5e6f6]">No trucks found</p>
          <p className="mt-1 text-xs text-[#b7cce0]">
            Add trucks to start tracking cost per mile.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-card shadow-[var(--shadow-elevated-1)]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c5d8eb]">
                  Unit #
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c5d8eb]">
                  Vehicle
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c5d8eb]">
                  VIN
                </TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c5d8eb]">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trucks.map((truck) => (
                <TableRow key={truck.id} className="group h-11 border-slate-100">
                  <TableCell className="font-mono text-[13px] font-medium text-foreground">
                    {truck.unit_number}
                  </TableCell>
                  <TableCell className="text-sm text-[#d7e8f8]">
                    {[truck.year, truck.make, truck.model]
                      .filter(Boolean)
                      .join(" ") || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-[13px] text-[#d7e8f8]">
                    {truck.vin || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={statusStyles[truck.status] || ""}
                    >
                      {truck.status}
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

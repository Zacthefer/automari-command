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
import { getExpenses } from "@/lib/api-cpm";
import type { Expense } from "@/types/cost-per-mile";

const categoryLabels: Record<string, string> = {
  fuel: "Fuel",
  maintenance: "Maintenance",
  insurance: "Insurance",
  truck_payment: "Truck Payment",
  tolls: "Tolls",
  tires: "Tires",
  permits: "Permits",
  driver_pay: "Driver Pay",
  other: "Other",
};

const categoryStyles: Record<string, string> = {
  fuel: "bg-blue-50 text-blue-700 hover:bg-blue-50",
  maintenance: "bg-amber-50 text-amber-700 hover:bg-amber-50",
  insurance: "bg-violet-50 text-violet-700 hover:bg-violet-50",
  truck_payment: "bg-slate-100 text-slate-600 hover:bg-slate-100",
  tolls: "bg-cyan-50 text-cyan-700 hover:bg-cyan-50",
  tires: "bg-orange-50 text-orange-700 hover:bg-orange-50",
  permits: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  driver_pay: "bg-indigo-50 text-indigo-700 hover:bg-indigo-50",
  other: "bg-slate-100 text-slate-500 hover:bg-slate-100",
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExpenses({ limit: 100 })
      .then(setExpenses)
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
          title="Expenses"
          description="All logged expenses across the fleet."
        />
      </div>

      {expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-0 bg-white py-16 shadow-[var(--shadow-elevated-1)]">
          <p className="text-sm text-slate-500">No expenses found</p>
          <p className="mt-1 text-xs text-slate-400">
            Log expenses to start tracking cost per mile.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border-0 bg-white shadow-[var(--shadow-elevated-1)]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Date
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Category
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Amount
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Vendor
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Description
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                  Source
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow
                  key={expense.id}
                  className="group h-11 border-slate-100"
                >
                  <TableCell className="text-[13px] text-slate-600 tabular-nums">
                    {format(new Date(expense.expense_date), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={categoryStyles[expense.category] || ""}
                    >
                      {categoryLabels[expense.category] || expense.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-[13px] font-medium text-slate-900 tabular-nums">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {expense.vendor || "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-slate-500">
                    {expense.description || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-slate-400">
                    {expense.source === "manual"
                      ? "Manual"
                      : expense.source === "fuel_card_import"
                        ? "Fuel Card"
                        : "ELD"}
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

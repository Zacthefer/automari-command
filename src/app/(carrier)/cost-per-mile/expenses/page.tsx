"use client";

import { useCallback, useEffect, useState } from "react";
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
import { ErrorBanner } from "@/components/layout/error-banner";
import { LazyImportSheet } from "@/components/imports/lazy-import-sheet";
import { UploadCsvButton } from "@/components/imports/upload-csv-button";
import { useCsvImport } from "@/components/imports/use-csv-import";
import { useImportHighlight } from "@/components/imports/use-import-highlight";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { getExpenses } from "@/lib/api-cpm";
import type { Expense } from "@/types/cost-per-mile";
import { BlurFadeStack } from "@/components/ui/blur-fade";

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
  fuel: "bg-[var(--brand-cyan-dim)] text-[var(--brand-link)] hover:bg-[var(--brand-cyan-dim)]",
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
  const [loadFailed, setLoadFailed] = useState(false);

  const load = useCallback(
    () =>
      getExpenses({ limit: 100 })
        .then((list) => {
          setExpenses(list);
          setLoadFailed(false);
        })
        .catch(() => setLoadFailed(true))
        .finally(() => setLoading(false)),
    []
  );

  const { highlight, onImported } = useImportHighlight(load);
  const importer = useCsvImport("fuel", { onImported });

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <PageSkeleton />;

  const uploadButton = (className?: string) => (
    <UploadCsvButton
      state={importer.state}
      onPick={(file) => void importer.pick(file)}
      onRetry={importer.retry}
      inputRef={importer.inputRef}
      triggerRef={importer.triggerRef}
      className={className}
    />
  );

  return (
    <BlurFadeStack className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/cost-per-mile"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <PageHeader
            title="Expenses"
            description="All logged expenses across the fleet. Upload a fuel card export to add fuel purchases."
            action={!loadFailed && expenses.length > 0 ? uploadButton() : undefined}
          />
        </div>
      </div>

      {loadFailed ? (
        <ErrorBanner
          message="Couldn't load your expenses. Check your connection and try again."
          onRetry={() => {
            setLoading(true);
            void load();
          }}
        />
      ) : expenses.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 shadow-[var(--shadow-elevated-1)]">
          <p className="text-sm text-subtle-foreground">No expenses found</p>
          <p className="mt-1 max-w-md text-center text-xs text-subtle-foreground">
            Upload a fuel card export (Motive, EFS or your own spreadsheet). We&apos;ll show you every
            purchase and which truck it belongs to before anything is saved.
          </p>
          <div className="mt-5">{uploadButton("items-center text-center")}</div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated-1)]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
                  Date
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
                  Category
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
                  Amount
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
                  Vendor
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
                  Description
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
                  Source
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow
                  key={expense.id}
                  className={cn("group h-11 border-slate-100", highlight.has(expense.id) && "import-row-glow")}
                >
                  <TableCell className="text-[13px] text-foreground tabular-nums">
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
                  <TableCell className="font-mono text-[13px] font-medium text-foreground tabular-nums">
                    {formatCurrency(expense.amount)}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {expense.vendor || "—"}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-subtle-foreground">
                    {expense.description || "—"}
                  </TableCell>
                  <TableCell className="text-xs text-subtle-foreground">
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
      {importer.panelOpen ? <LazyImportSheet importer={importer} /> : null}
    </BlurFadeStack>
  );
}

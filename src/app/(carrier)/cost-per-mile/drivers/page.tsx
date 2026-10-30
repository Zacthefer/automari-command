"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { LazyImportSheet } from "@/components/imports/lazy-import-sheet";
import { UploadCsvButton } from "@/components/imports/upload-csv-button";
import { useCsvImport } from "@/components/imports/use-csv-import";
import { getDrivers } from "@/lib/api-cpm";
import { cn } from "@/lib/utils";
import type { Driver } from "@/types/cost-per-mile";

const HIGHLIGHT_MS = 1600;

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
  const [loadFailed, setLoadFailed] = useState(false);
  const [highlight, setHighlight] = useState<Set<string>>(() => new Set());
  const highlightTimer = useRef<number | undefined>(undefined);

  // Only the first load (and a retry) shows the skeleton; a reload after an import doesn't
  const load = useCallback(
    () =>
      getDrivers()
        .then((list) => {
          setDrivers(list);
          setLoadFailed(false);
        })
        .catch(() => setLoadFailed(true))
        .finally(() => setLoading(false)),
    []
  );

  const importer = useCsvImport("drivers", {
    onImported: async (createdIds) => {
      await load();
      setHighlight(new Set(createdIds));
      window.clearTimeout(highlightTimer.current);
      highlightTimer.current = window.setTimeout(() => setHighlight(new Set()), HIGHLIGHT_MS);
    },
  });

  useEffect(() => {
    void load();
    return () => window.clearTimeout(highlightTimer.current);
  }, [load]);

  if (loading) return <PageSkeleton />;

  const uploadButton = (
    <UploadCsvButton
      state={importer.state}
      onPick={(file) => void importer.pick(file)}
      onRetry={importer.retry}
      inputRef={importer.inputRef}
      triggerRef={importer.triggerRef}
    />
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/cost-per-mile"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <PageHeader
            title="Drivers"
            description="Drivers tracked for cost per mile."
            action={!loadFailed && drivers.length > 0 ? uploadButton : undefined}
          />
        </div>
      </div>

      {loadFailed ? (
        <div
          role="alert"
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card py-16 shadow-[var(--shadow-elevated-1)]"
        >
          <p className="text-sm text-foreground">Couldn&apos;t load your drivers. Try again.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              void load();
            }}
          >
            Try again
          </Button>
        </div>
      ) : drivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-16 text-center shadow-[var(--shadow-elevated-1)]">
          <p className="text-sm font-medium text-foreground">Bring your fleet in from a spreadsheet</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Upload a CSV and we&apos;ll show you exactly what will change before anything is saved.
          </p>
          <div className="mt-5">
            <UploadCsvButton
              state={importer.state}
              onPick={(file) => void importer.pick(file)}
              onRetry={importer.retry}
              inputRef={importer.inputRef}
              triggerRef={importer.triggerRef}
              className="items-center text-center"
            />
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated-1)]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
                  Name
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
                  Phone
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
                  CDL
                </TableHead>
                <TableHead className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow
                  key={driver.id}
                  className={cn("group h-11 border-slate-100", highlight.has(driver.id) && "import-row-glow")}
                >
                  <TableCell className="text-sm font-medium text-foreground">
                    {driver.first_name} {driver.last_name}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {driver.phone || "—"}
                  </TableCell>
                  <TableCell className="font-mono text-[13px] text-foreground">
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

      {/* The review panel (motion, table) loads only when an import starts */}
      {importer.panelOpen ? <LazyImportSheet importer={importer} /> : null}
    </div>
  );
}

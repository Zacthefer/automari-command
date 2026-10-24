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
import { ComplianceStatusChip } from "./compliance-status-chip";
import { HolderTypeChip } from "./holder-type-chip";
import type { ComplianceDocument } from "@/types";

interface ComplianceTableProps {
  documents: ComplianceDocument[];
}

const documentTypeLabels: Record<ComplianceDocument["document_type"], string> = {
  cdl: "CDL",
  medical_card: "Medical Card",
  insurance_liability: "Liability Insurance",
  insurance_cargo: "Cargo Insurance",
  vehicle_registration: "Vehicle Registration",
  ifta_permit: "IFTA Permit",
  drug_test: "Drug Test",
  mvr_report: "MVR Report",
  other: "Other",
};

export function ComplianceTable({ documents }: ComplianceTableProps) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-16 shadow-[var(--shadow-elevated-1)]">
        <p className="text-sm text-subtle-foreground">No compliance documents found</p>
        <p className="mt-1 text-xs text-subtle-foreground">
          Add documents to track expiration dates and stay compliant.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated-1)]">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="px-4 text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
              Document
            </TableHead>
            <TableHead className="px-4 text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
              Holder
            </TableHead>
            <TableHead className="px-4 text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
              Type
            </TableHead>
            <TableHead className="px-4 text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
              Doc #
            </TableHead>
            <TableHead className="px-4 text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
              Status
            </TableHead>
            <TableHead className="px-4 text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
              Expires
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id} className="group border-border">
              <TableCell className="px-4 py-3.5">
                <Link
                  href={`/compliance/${doc.id}`}
                  className="font-medium text-foreground transition-colors group-hover:text-[var(--brand-link)]"
                >
                  {documentTypeLabels[doc.document_type] || doc.document_type}
                </Link>
              </TableCell>
              <TableCell className="px-4 py-3.5 text-[14px] font-medium text-foreground">
                {doc.holder_name}
              </TableCell>
              <TableCell className="px-4 py-3.5">
                <HolderTypeChip type={doc.holder_type} />
              </TableCell>
              <TableCell className="px-4 py-3.5 font-mono text-[13px] tracking-wide text-foreground">
                {doc.document_number || "—"}
              </TableCell>
              <TableCell className="px-4 py-3.5">
                <ComplianceStatusChip status={doc.status} />
              </TableCell>
              <TableCell className="px-4 py-3.5 text-[13px] text-foreground">
                {doc.expiration_date
                  ? format(new Date(doc.expiration_date), "MMM d, yyyy")
                  : "No expiration"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

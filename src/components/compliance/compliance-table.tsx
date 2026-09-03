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
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-card py-16 shadow-[var(--shadow-elevated-1)]">
        <p className="text-sm text-[#d5e6f6]">No compliance documents found</p>
        <p className="mt-1 text-xs text-[#b7cce0]">
          Add documents to track expiration dates and stay compliant.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-card shadow-[var(--shadow-elevated-1)]">
      <Table>
        <TableHeader>
          <TableRow className="border-white/8 hover:bg-transparent">
            <TableHead className="px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c5d8eb]">
              Document
            </TableHead>
            <TableHead className="px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c5d8eb]">
              Holder
            </TableHead>
            <TableHead className="px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c5d8eb]">
              Type
            </TableHead>
            <TableHead className="px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c5d8eb]">
              Doc #
            </TableHead>
            <TableHead className="px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c5d8eb]">
              Status
            </TableHead>
            <TableHead className="px-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c5d8eb]">
              Expires
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id} className="group border-white/8">
              <TableCell className="px-4 py-3.5">
                <Link
                  href={`/compliance/${doc.id}`}
                  className="font-medium text-[#f3f8ff] transition-colors group-hover:text-[var(--brand-cyan)]"
                >
                  {documentTypeLabels[doc.document_type] || doc.document_type}
                </Link>
              </TableCell>
              <TableCell className="px-4 py-3.5 text-[14px] font-medium text-[#e8f2fc]">
                {doc.holder_name}
              </TableCell>
              <TableCell className="px-4 py-3.5">
                <HolderTypeChip type={doc.holder_type} />
              </TableCell>
              <TableCell className="px-4 py-3.5 font-mono text-[13px] tracking-wide text-[#d7e8f8]">
                {doc.document_number || "—"}
              </TableCell>
              <TableCell className="px-4 py-3.5">
                <ComplianceStatusChip status={doc.status} />
              </TableCell>
              <TableCell className="px-4 py-3.5 text-[13px] text-[#d7e8f8]">
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

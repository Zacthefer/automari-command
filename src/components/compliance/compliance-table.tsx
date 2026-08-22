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

const holderTypeLabels: Record<ComplianceDocument["holder_type"], string> = {
  driver: "Driver",
  vehicle: "Vehicle",
  company: "Company",
};

export function ComplianceTable({ documents }: ComplianceTableProps) {
  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 py-16">
        <p className="text-sm text-slate-500">No compliance documents found</p>
        <p className="mt-1 text-xs text-slate-400">
          Add documents to track expiration dates and stay compliant.
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
              Document
            </TableHead>
            <TableHead className="text-xs font-medium text-slate-500">
              Holder
            </TableHead>
            <TableHead className="text-xs font-medium text-slate-500">
              Type
            </TableHead>
            <TableHead className="text-xs font-medium text-slate-500">
              Doc #
            </TableHead>
            <TableHead className="text-xs font-medium text-slate-500">
              Status
            </TableHead>
            <TableHead className="text-xs font-medium text-slate-500">
              Expires
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id} className="group">
              <TableCell>
                <Link
                  href={`/compliance/${doc.id}`}
                  className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors"
                >
                  {documentTypeLabels[doc.document_type] || doc.document_type}
                </Link>
              </TableCell>
              <TableCell className="text-slate-600">
                {doc.holder_name}
              </TableCell>
              <TableCell className="text-slate-500 text-sm">
                {holderTypeLabels[doc.holder_type] || doc.holder_type}
              </TableCell>
              <TableCell className="text-slate-600">
                {doc.document_number || "—"}
              </TableCell>
              <TableCell>
                <ComplianceStatusChip status={doc.status} />
              </TableCell>
              <TableCell className="text-slate-500 text-sm">
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

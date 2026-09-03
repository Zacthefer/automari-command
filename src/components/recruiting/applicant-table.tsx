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
import { ApplicantStatusChip } from "./applicant-status-chip";
import type { Applicant } from "@/types";

interface ApplicantTableProps {
  applicants: Applicant[];
}

export function ApplicantTable({ applicants }: ApplicantTableProps) {
  if (applicants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-card py-16 shadow-[var(--shadow-elevated-1)]">
        <p className="text-sm text-slate-500">No applicants found</p>
        <p className="mt-1 text-xs text-slate-400">
          Add driver applicants to start building your recruiting pipeline.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-card shadow-[var(--shadow-elevated-1)]">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="text-xs font-medium text-slate-500">
              Name
            </TableHead>
            <TableHead className="text-xs font-medium text-slate-500">
              Contact
            </TableHead>
            <TableHead className="text-xs font-medium text-slate-500">
              CDL
            </TableHead>
            <TableHead className="text-xs font-medium text-slate-500">
              Experience
            </TableHead>
            <TableHead className="text-xs font-medium text-slate-500">
              Status
            </TableHead>
            <TableHead className="text-xs font-medium text-slate-500">
              Applied
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applicants.map((applicant) => (
            <TableRow key={applicant.id} className="group">
              <TableCell>
                <Link
                  href={`/recruiting/${applicant.id}`}
                  className="font-medium text-foreground group-hover:text-[var(--brand-cyan)] transition-colors"
                >
                  {applicant.name}
                </Link>
              </TableCell>
              <TableCell className="text-slate-600 text-sm">
                {applicant.phone || applicant.email || "—"}
              </TableCell>
              <TableCell className="text-slate-500 text-sm">
                {applicant.cdl_class ? `Class ${applicant.cdl_class}` : "—"}
              </TableCell>
              <TableCell className="text-slate-500 text-sm">
                {applicant.years_experience != null
                  ? `${applicant.years_experience} yrs`
                  : "—"}
              </TableCell>
              <TableCell>
                <ApplicantStatusChip status={applicant.status} />
              </TableCell>
              <TableCell className="text-slate-500 text-sm">
                {format(new Date(applicant.created_at), "MMM d, yyyy")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { ApplicantTable } from "@/components/recruiting/applicant-table";
import { Button } from "@/components/ui/button";
import { getApplicants } from "@/lib/api";
import type { Applicant, ApplicantStatus } from "@/types";
import { cn } from "@/lib/utils";

const statusFilters: { value: ApplicantStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "screening", label: "Screening" },
  { value: "qualified", label: "Qualified" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
];

export default function RecruitingPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ApplicantStatus | "all">(
    "all"
  );

  useEffect(() => {
    setLoading(true);
    getApplicants({
      limit: 50,
      status: statusFilter === "all" ? undefined : statusFilter,
    })
      .then(setApplicants)
      .finally(() => setLoading(false));
  }, [statusFilter]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Driver Recruiting"
        description="Track inbound driver applicants and move them through your hiring pipeline."
        action={
          <Link href="/recruiting/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Applicant
            </Button>
          </Link>
        }
      />

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => setStatusFilter(filter.value)}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium transition-colors",
              statusFilter === filter.value
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 shadow-[var(--shadow-elevated-1)] hover:text-slate-900"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <ApplicantTable applicants={applicants} />
    </div>
  );
}

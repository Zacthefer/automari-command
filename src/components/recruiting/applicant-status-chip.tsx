import { Badge } from "@/components/ui/badge";
import type { ApplicantStatus } from "@/types";

const statusConfig: Record<
  ApplicantStatus,
  { label: string; className: string }
> = {
  new: {
    label: "New",
    className: "bg-[var(--brand-cyan-dim)] text-[var(--brand-cyan)] hover:bg-[var(--brand-cyan-dim)]",
  },
  screening: {
    label: "Screening",
    className: "bg-amber-50 text-amber-700 hover:bg-amber-50",
  },
  qualified: {
    label: "Qualified",
    className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-50 text-red-700 hover:bg-red-50",
  },
  hired: {
    label: "Hired",
    className: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  },
};

export function ApplicantStatusChip({ status }: { status: ApplicantStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}

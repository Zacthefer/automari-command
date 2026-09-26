import { Badge } from "@/components/ui/badge";
import type { LoadStatus } from "@/types";

const statusConfig: Record<LoadStatus, { label: string; className: string }> = {
  needs_review: {
    label: "Needs Review",
    className: "bg-amber-50 text-amber-700 hover:bg-amber-50",
  },
  booked: {
    label: "Booked",
    className: "bg-[var(--brand-cyan-dim)] text-[var(--brand-cyan)] hover:bg-[var(--brand-cyan-dim)]",
  },
  delivered: {
    label: "Delivered",
    className: "bg-violet-50 text-violet-700 hover:bg-violet-50",
  },
  invoiced: {
    label: "Invoiced",
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  },
  paid: {
    label: "Paid",
    className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  },
};

export function LoadStatusChip({ status }: { status: LoadStatus }) {
  const config = statusConfig[status] ?? {
    label: status,
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  };
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}

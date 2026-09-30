import { Badge } from "@/components/ui/badge";
import type { PaymentStatus } from "@/types";

const statusConfig: Record<PaymentStatus, { label: string; className: string }> = {
  not_ready: {
    label: "Not Ready",
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  },
  ready_to_submit: {
    label: "Ready",
    className: "bg-[var(--brand-cyan-dim)] text-[var(--brand-cyan)] hover:bg-[var(--brand-cyan-dim)]",
  },
  submitted: {
    label: "Submitted",
    className: "bg-violet-50 text-violet-700 hover:bg-violet-50",
  },
  processing: {
    label: "Processing",
    className: "bg-amber-50 text-amber-700 hover:bg-amber-50",
  },
  paid: {
    label: "Paid",
    className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  },
  action_required: {
    label: "Action Required",
    className: "bg-red-50 text-red-700 hover:bg-red-50",
  },
};

export function PaymentStatusChip({ status }: { status: PaymentStatus }) {
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

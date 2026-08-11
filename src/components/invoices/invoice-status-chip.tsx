import { Badge } from "@/components/ui/badge";
import type { Invoice } from "@/types";

const statusConfig: Record<
  Invoice["status"],
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  },
  sent: {
    label: "Sent",
    className: "bg-blue-50 text-blue-700 hover:bg-blue-50",
  },
  viewed: {
    label: "Viewed",
    className: "bg-violet-50 text-violet-700 hover:bg-violet-50",
  },
  paid: {
    label: "Paid",
    className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  },
  overdue: {
    label: "Overdue",
    className: "bg-amber-50 text-amber-700 hover:bg-amber-50",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-red-50 text-red-700 hover:bg-red-50",
  },
};

export function InvoiceStatusChip({
  status,
}: {
  status: Invoice["status"];
}) {
  const config = statusConfig[status];
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}

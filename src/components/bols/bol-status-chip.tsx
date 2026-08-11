import { Badge } from "@/components/ui/badge";
import type { BOL } from "@/types";

const statusConfig: Record<
  BOL["status"],
  { label: string; className: string }
> = {
  received: {
    label: "Received",
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  },
  processing: {
    label: "Processing",
    className: "bg-blue-50 text-blue-700 hover:bg-blue-50",
  },
  extracted: {
    label: "Extracted",
    className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  },
  review: {
    label: "Needs Review",
    className: "bg-amber-50 text-amber-700 hover:bg-amber-50",
  },
  failed: {
    label: "Failed",
    className: "bg-red-50 text-red-700 hover:bg-red-50",
  },
  invoiced: {
    label: "Invoiced",
    className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  },
};

export function BolStatusChip({ status }: { status: BOL["status"] }) {
  const config = statusConfig[status];
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}

import { Badge } from "@/components/ui/badge";
import type { BOL } from "@/types";

const statusConfig: Record<
  BOL["status"],
  { label: string; className: string }
> = {
  received: {
    label: "received",
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  },
  processing: {
    label: "processing",
    className: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  },
  extracted: {
    label: "extracted",
    className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  },
  review: {
    label: "needs review",
    className: "bg-amber-50 text-amber-700 hover:bg-amber-50",
  },
  failed: {
    label: "failed",
    className: "bg-red-50 text-red-700 hover:bg-red-50",
  },
  invoiced: {
    label: "invoiced",
    className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  },
};

export function BolStatusChip({ status }: { status: BOL["status"] }) {
  const config = statusConfig[status];
  return (
    <Badge
      variant="secondary"
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium tracking-[0.01em] ${config.className}`}
    >
      {config.label}
    </Badge>
  );
}

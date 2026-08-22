import { Badge } from "@/components/ui/badge";
import type { ComplianceDocument } from "@/types";

const statusConfig: Record<
  ComplianceDocument["status"],
  { label: string; className: string }
> = {
  valid: {
    label: "Valid",
    className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  },
  expiring_soon: {
    label: "Expiring Soon",
    className: "bg-amber-50 text-amber-700 hover:bg-amber-50",
  },
  expired: {
    label: "Expired",
    className: "bg-red-50 text-red-700 hover:bg-red-50",
  },
};

export function ComplianceStatusChip({
  status,
}: {
  status: ComplianceDocument["status"];
}) {
  const config = statusConfig[status];
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}

import type { ComplianceDocument } from "@/types";
import { cn } from "@/lib/utils";
import {
  HolderCompanyMark,
  HolderDriverMark,
  HolderVehicleMark,
} from "@/components/icons/brand-marks";

const holderMeta = {
  driver: {
    label: "Driver",
    icon: HolderDriverMark,
    className: "text-sky-800 bg-sky-50 ring-sky-200",
  },
  vehicle: {
    label: "Vehicle",
    icon: HolderVehicleMark,
    className: "text-emerald-800 bg-emerald-50 ring-emerald-200",
  },
  company: {
    label: "Company",
    icon: HolderCompanyMark,
    className: "text-amber-800 bg-amber-50 ring-amber-200",
  },
} as const;

export function HolderTypeChip({
  type,
}: {
  type: ComplianceDocument["holder_type"];
}) {
  const meta = holderMeta[type] ?? holderMeta.company;
  const Icon = meta.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium tracking-wide ring-1",
        meta.className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

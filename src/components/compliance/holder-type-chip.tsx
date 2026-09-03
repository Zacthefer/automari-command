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
    className: "text-[#7ed6ff] bg-[#12324a] ring-[#2a5d7a]",
  },
  vehicle: {
    label: "Vehicle",
    icon: HolderVehicleMark,
    className: "text-[#9ae6b4] bg-[#143528] ring-[#2d6a48]",
  },
  company: {
    label: "Company",
    icon: HolderCompanyMark,
    className: "text-[#f3d48a] bg-[#3a2d12] ring-[#7a6126]",
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold tracking-wide ring-1",
        meta.className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

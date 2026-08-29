import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface FleetStatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  detail?: string;
  accent?: "blue" | "green" | "amber" | "red";
  href?: string;
}

const accentStyles = {
  blue: { bg: "bg-blue-50", text: "text-blue-600" },
  green: { bg: "bg-emerald-50", text: "text-emerald-600" },
  amber: { bg: "bg-amber-50", text: "text-amber-600" },
  red: { bg: "bg-red-50", text: "text-red-600" },
};

export function FleetStatCard({
  label,
  value,
  icon: Icon,
  detail,
  accent = "blue",
  href,
}: FleetStatCardProps) {
  const colors = accentStyles[accent];

  const card = (
    <Card className="cursor-pointer rounded-3xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,#FFFFFF_8%)] shadow-[var(--shadow-elevated-1)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated-3)]">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.02em] text-slate-900 tabular-nums">
              {value}
            </p>
            {detail && (
              <p className="mt-1.5 text-xs text-slate-400 tabular-nums">
                {detail}
              </p>
            )}
          </div>
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${colors.bg}`}
          >
            <Icon className={`h-5 w-5 ${colors.text}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block no-underline">
        {card}
      </Link>
    );
  }

  return card;
}

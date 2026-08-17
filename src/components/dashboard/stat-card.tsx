import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  detail?: string;
}

export function StatCard({ label, value, icon: Icon, detail }: StatCardProps) {
  return (
    <Card className="cursor-pointer rounded-[20px] border border-slate-200 bg-white shadow-none ring-0 transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] active:translate-y-0 active:scale-[0.99] active:shadow-[0_3px_10px_rgba(15,23,42,0.06)]">
      <CardContent className="p-7">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[13px] font-medium text-slate-500">{label}</p>
            <p className="mt-3 text-[36px] font-semibold leading-none tracking-[-0.02em] text-slate-900 tabular-nums">
              {value}
            </p>
            {detail && (
              <p className="mt-2 text-xs text-slate-400 tabular-nums">{detail}</p>
            )}
          </div>
          <div className="text-slate-400">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

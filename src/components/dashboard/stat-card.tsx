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
    <Card className="border-slate-200 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
              {value}
            </p>
            {detail && (
              <p className="mt-1 text-xs text-slate-400">{detail}</p>
            )}
          </div>
          <div className="rounded-lg bg-slate-100 p-2.5">
            <Icon className="h-5 w-5 text-slate-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

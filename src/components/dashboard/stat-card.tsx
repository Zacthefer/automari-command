import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  detail?: string;
  href?: string;
}

export function StatCard({ label, value, icon: Icon, detail, href }: StatCardProps) {
  const card = (
    <Card className="cursor-pointer rounded-3xl border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,#FFFFFF_8%)] shadow-[var(--shadow-elevated-1)] ring-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated-3)] active:translate-y-0 active:shadow-[var(--shadow-elevated-1)]">
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
            <Icon className="h-5 w-5 text-blue-600" />
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

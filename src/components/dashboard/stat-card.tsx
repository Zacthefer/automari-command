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
    <Card className="h-full rounded-2xl border border-white/10 bg-[#0b182b] shadow-[var(--shadow-elevated-1)] ring-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-cyan)]/25 hover:shadow-[var(--shadow-elevated-2)]">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c5d8eb]">
            {label}
          </p>
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(0,191,255,0.10)] text-[var(--brand-cyan)] ring-1 ring-[rgba(0,191,255,0.22)]">
            <Icon className="h-[18px] w-[18px]" />
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-[28px] font-semibold leading-none tracking-[-0.03em] text-[#f3f8ff] tabular-nums">
            {value}
          </p>
          {detail ? (
            <p className="mt-2 text-[12px] font-medium text-[#b7cce0] tabular-nums">{detail}</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full no-underline">
        {card}
      </Link>
    );
  }

  return card;
}

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
    <Card className="h-full rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated-1)] ring-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-cyan)]/25 hover:shadow-[var(--shadow-elevated-2)]">
      <CardContent className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-cyan-dim)] text-[var(--brand-link)]">
            <Icon className="size-[18px]" />
          </span>
          <p className="truncate text-[28px] font-medium leading-none tracking-[-0.03em] text-foreground tabular-nums">
            {value}
          </p>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {detail ? (
            <p className="mt-1 text-[12px] font-medium text-subtle-foreground tabular-nums">{detail}</p>
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

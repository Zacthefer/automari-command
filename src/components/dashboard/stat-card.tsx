"use client";

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
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(0,191,255,0.10)] text-[var(--brand-cyan)] ring-1 ring-[rgba(0,191,255,0.22)]">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 space-y-2">
          <p className="text-[11px] font-semibold uppercase leading-snug tracking-[0.08em] text-[#d7e8f8]">
            {label}
          </p>
          <p className="text-[28px] font-semibold leading-none tracking-[-0.03em] text-[#f7fbff] tabular-nums">
            {value}
          </p>
          {detail ? (
            <p className="text-[12px] font-medium text-[#b7cce0] tabular-nums">{detail}</p>
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

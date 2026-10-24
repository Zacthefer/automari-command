import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ComponentType, SVGProps } from "react";

interface FleetStatCardProps {
  label: string;
  value: string | number;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  detail?: string;
  accent?: "blue" | "green" | "amber" | "red";
  href?: string;
}

const accentStyles = {
  blue: {
    ink: "text-[var(--brand-link)]",
    wash: "bg-[rgba(0,191,255,0.10)]",
    ring: "ring-[rgba(0,191,255,0.22)]",
  },
  green: {
    ink: "text-emerald-300",
    wash: "bg-emerald-400/10",
    ring: "ring-emerald-300/25",
  },
  amber: {
    ink: "text-amber-200",
    wash: "bg-amber-400/10",
    ring: "ring-amber-300/25",
  },
  red: {
    ink: "text-rose-300",
    wash: "bg-rose-400/10",
    ring: "ring-rose-300/25",
  },
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
    <Card className="h-full rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated-1)] transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[var(--shadow-elevated-2)]">
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground">
            {label}
          </p>
          <span
            className={cn(
              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1",
              colors.wash,
              colors.ring,
              colors.ink
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-[26px] font-medium leading-none tracking-[-0.03em] text-foreground tabular-nums">
            {value}
          </p>
          {detail ? (
            <p className="mt-2 text-[12px] font-medium text-subtle-foreground tabular-nums">
              {detail}
            </p>
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

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import type { ComponentType } from "react";
import type { MetricIconProps } from "@/components/icons/metric-state-icons";

interface FleetStatCardProps {
  label: string;
  value: string | number;
  icon: ComponentType<MetricIconProps>;
  detail?: string;
  accent?: "blue" | "green" | "amber" | "red";
  href?: string;
  index?: number;
}

const accentStyles = {
  blue: {
    ink: "text-[var(--brand-cyan)]",
    wash: "bg-[rgba(0,191,255,0.07)]",
    ring: "ring-[rgba(0,191,255,0.18)]",
  },
  green: {
    ink: "text-emerald-300/90",
    wash: "bg-emerald-400/[0.07]",
    ring: "ring-emerald-300/20",
  },
  amber: {
    ink: "text-amber-200/90",
    wash: "bg-amber-400/[0.07]",
    ring: "ring-amber-300/20",
  },
  red: {
    ink: "text-rose-300/90",
    wash: "bg-rose-400/[0.07]",
    ring: "ring-rose-300/20",
  },
};

export function FleetStatCard({
  label,
  value,
  icon: Icon,
  detail,
  accent = "blue",
  href,
  index = 0,
}: FleetStatCardProps) {
  const colors = accentStyles[accent];

  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <Card className="group h-full rounded-[18px] border border-white/[0.08] bg-[#091525]/90 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_12px_32px_rgba(0,0,0,0.28)] transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-px hover:border-white/[0.14] hover:shadow-[0_1px_0_rgba(255,255,255,0.05)_inset,0_18px_40px_rgba(0,0,0,0.34)]">
        <CardContent className="flex h-full flex-col gap-5 p-5">
          <div
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-[12px] ring-1 transition-colors duration-300",
              colors.wash,
              colors.ring,
              colors.ink,
              "group-hover:brightness-110"
            )}
          >
            <Icon size={22} />
          </div>

          <div className="mt-auto min-w-0 space-y-2.5">
            <p className="text-[10px] font-medium uppercase leading-snug tracking-[0.16em] text-[#9eb6ce]">
              {label}
            </p>
            <p className="text-[27px] font-semibold leading-none tracking-[-0.04em] text-[#f5f9ff] tabular-nums">
              {value}
            </p>
            {detail ? (
              <p className="text-[11px] font-medium tracking-wide text-[#8aa3bd] tabular-nums">
                {detail}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block h-full no-underline">
        {inner}
      </Link>
    );
  }

  return inner;
}

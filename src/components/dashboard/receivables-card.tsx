"use client";

import Link from "next/link";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { AlertTriangle, CheckCircle2, ChevronRight, Send, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReceivablesCardProps {
  outstanding: number;
  collected: number;
  invoicesSent: number;
  invoicesPaid: number;
  invoicesOverdue: number;
  awaitingAmount: number;
  awaitingCount: number;
  actionRequired: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const SEGMENTS = [
  { key: "collected", name: "Collected", color: "#00bfff" },
  { key: "outstanding", name: "Outstanding", color: "rgba(0, 191, 255, 0.28)" },
] as const;

export function ReceivablesCard({
  outstanding,
  collected,
  invoicesSent,
  invoicesPaid,
  invoicesOverdue,
  awaitingAmount,
  awaitingCount,
  actionRequired,
}: ReceivablesCardProps) {
  const total = outstanding + collected;
  const collectedPct = total > 0 ? Math.round((collected / total) * 100) : 0;
  const data = SEGMENTS.map((s) => ({
    name: s.name,
    value: s.key === "collected" ? collected : outstanding,
    color: s.color,
  }));

  const tiles = [
    { label: "Invoices sent", value: invoicesSent, icon: Send },
    { label: "Paid", value: invoicesPaid, icon: CheckCircle2 },
    { label: "Overdue", value: invoicesOverdue, icon: AlertTriangle },
  ];

  return (
    <Card className="h-full rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated-1)] ring-0">
      <CardHeader className="flex flex-row items-center justify-between px-5 pt-1">
        <CardTitle className="text-base font-medium text-foreground">Receivables</CardTitle>
        <Link href="/invoices" className="text-xs font-medium text-[var(--brand-link)] hover:underline">
          View invoices
        </Link>
      </CardHeader>
      <CardContent className="grid gap-6 px-5 sm:grid-cols-[180px_1fr] sm:items-center">
        {total === 0 ? (
          <div className="flex h-[180px] items-center justify-center rounded-xl border border-dashed border-border">
            <p className="px-4 text-center text-sm text-subtle-foreground">No invoices yet</p>
          </div>
        ) : (
          <div className="relative h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "none",
                    borderRadius: 12,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                    fontSize: 13,
                  }}
                  formatter={(value, name) => [formatCurrency(Number(value)), name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-medium text-foreground tabular-nums">{collectedPct}%</p>
                <p className="text-[11px] text-subtle-foreground">collected</p>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-subtle-foreground">Outstanding</p>
              <p className="text-xl font-medium text-foreground tabular-nums">{formatCurrency(outstanding)}</p>
            </div>
            <div>
              <p className="text-xs text-subtle-foreground">Collected</p>
              <p className="text-xl font-medium text-foreground tabular-nums">{formatCurrency(collected)}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {tiles.map((tile) => (
              <div key={tile.label} className="rounded-xl border border-border bg-[var(--muted)]/50 px-3 py-2.5">
                <tile.icon className="mb-1.5 size-4 text-[var(--brand-link)]" />
                <p className="text-lg font-medium leading-none text-foreground tabular-nums">{tile.value}</p>
                <p className="mt-1 text-[11px] text-subtle-foreground">{tile.label}</p>
              </div>
            ))}
          </div>
          <Link
            href="/payments"
            className="group flex items-center gap-3 rounded-xl border border-border bg-[var(--brand-cyan-dim)] px-3 py-2.5 transition-colors hover:border-[var(--brand-cyan)]/40"
          >
            <Wallet className="size-4 shrink-0 text-[var(--brand-link)]" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-subtle-foreground">Awaiting payment</p>
              <p className="text-sm font-medium text-foreground tabular-nums">
                {formatCurrency(awaitingAmount)}
                <span className="ml-1 text-xs font-normal text-subtle-foreground">
                  · {awaitingCount} {awaitingCount === 1 ? "load" : "loads"}
                </span>
                {actionRequired > 0 ? (
                  <span className="ml-2 text-xs font-medium text-amber-700">{actionRequired} need action</span>
                ) : null}
              </p>
            </div>
            <ChevronRight className="size-4 shrink-0 text-subtle-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

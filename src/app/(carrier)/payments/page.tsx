"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DollarSign,
  AlertTriangle,
  Clock,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { getPaymentSummary, getLoads } from "@/lib/api";
import type {
  PaymentSummaryResponse,
  LoadSummary,
} from "@/types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

const AGING_COLORS: Record<string, string> = {
  "0-30": "bg-emerald-500",
  "31-60": "bg-amber-400",
  "61-90": "bg-orange-500",
  "90+": "bg-red-500",
};

const STATUS_CHIPS: Record<string, { label: string; className: string }> = {
  submitted: {
    label: "Submitted",
    className: "bg-blue-50 text-blue-700 ring-blue-600/10",
  },
  processing: {
    label: "Processing",
    className: "bg-purple-50 text-purple-700 ring-purple-600/10",
  },
  action_required: {
    label: "Action Required",
    className: "bg-amber-50 text-amber-700 ring-amber-600/10",
  },
};

type FilterTab = "all" | "submitted" | "processing" | "action_required";

export default function PaymentsPage() {
  const [summary, setSummary] = useState<PaymentSummaryResponse | null>(null);
  const [loads, setLoads] = useState<LoadSummary[]>([]);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getPaymentSummary(),
      getLoads({ limit: 200 }),
    ])
      .then(([s, l]) => {
        setSummary(s);
        // Only show loads that have been submitted for payment
        setLoads(
          l.filter((load) =>
            ["submitted", "processing", "action_required"].includes(
              load.payment_status
            )
          )
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;
  if (!summary) return null;

  const filteredLoads =
    filter === "all"
      ? loads
      : loads.filter((l) => l.payment_status === filter);

  const agingTotal = summary.aging_buckets.reduce(
    (sum, b) => sum + b.total_amount,
    0
  );

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "submitted", label: "Submitted" },
    { key: "processing", label: "Processing" },
    { key: "action_required", label: "Action Required" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Payments"
        description="Track submitted loads and outstanding receivables."
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Outstanding"
          value={formatCurrency(summary.total_outstanding)}
          icon={DollarSign}
        />
        <StatCard
          label="Action Required"
          value={summary.action_required_count}
          icon={AlertTriangle}
        />
        <StatCard
          label="Avg Days to Pay"
          value={
            summary.avg_days_to_payment !== null
              ? `${summary.avg_days_to_payment}d`
              : "—"
          }
          icon={Clock}
        />
        <StatCard
          label="Paid Last 30d"
          value={formatCurrency(summary.total_paid_30d)}
          icon={TrendingUp}
        />
      </div>

      {/* Aging bar */}
      {agingTotal > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Aging Breakdown
          </h3>
          <div className="flex h-6 w-full overflow-hidden rounded-full bg-muted">
            {summary.aging_buckets.map((bucket) => {
              const pct =
                agingTotal > 0
                  ? (bucket.total_amount / agingTotal) * 100
                  : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={bucket.label}
                  className={`${AGING_COLORS[bucket.label] || "bg-gray-400"} relative`}
                  style={{ width: `${pct}%` }}
                  title={`${bucket.label} days: ${formatCurrency(bucket.total_amount)} (${bucket.count} loads)`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {summary.aging_buckets.map((bucket) => (
              <div key={bucket.label} className="flex items-center gap-1.5">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${AGING_COLORS[bucket.label] || "bg-gray-400"}`}
                />
                <span>
                  {bucket.label}d: {formatCurrency(bucket.total_amount)} (
                  {bucket.count})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter tabs + table */}
      <div className="space-y-4">
        <div className="flex gap-1 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                filter === tab.key
                  ? "border-[var(--brand-cyan)] text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filteredLoads.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
            <DollarSign className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              No loads match this filter
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Load #
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">
                    Broker
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden sm:table-cell">
                    Days
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredLoads.map((load) => {
                  const chip =
                    STATUS_CHIPS[load.payment_status] || STATUS_CHIPS.submitted;
                  const days = load.submitted_at
                    ? Math.floor(
                        (Date.now() -
                          new Date(load.submitted_at).getTime()) /
                          86400000
                      )
                    : null;
                  return (
                    <tr
                      key={load.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/loads/${load.id}`}
                          className="font-medium text-foreground hover:text-[var(--brand-cyan)] transition-colors"
                        >
                          {load.load_number || load.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                        {load.broker_name || "—"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {load.current_total !== null
                          ? formatCurrency(load.current_total)
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                        {days !== null ? `${days}d` : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${chip.className}`}
                        >
                          {chip.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Broker breakdown */}
      {summary.by_broker.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-foreground">
            By Broker
          </h3>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Broker
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Loads
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground hidden sm:table-cell">
                    Oldest
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.by_broker.map((broker) => (
                  <tr
                    key={broker.broker_name}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">
                      {broker.broker_name}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                      {broker.count}
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {formatCurrency(broker.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground hidden sm:table-cell">
                      {broker.oldest_days}d
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

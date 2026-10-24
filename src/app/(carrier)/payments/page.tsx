"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, DollarSign, TrendingUp, Wallet } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { ErrorBanner } from "@/components/layout/error-banner";
import { EmptyState } from "@/components/layout/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { PaymentStatusChip } from "@/components/loads/payment-status-chip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getLoads, getPaymentSummary } from "@/lib/api";
import type { LoadSummary, PaymentSummaryResponse } from "@/types";

// The backend caps one page of loads at 200
const LOAD_LIMIT = 200;
const DAY_MS = 86_400_000;

const AGING_COLORS: Record<string, string> = {
  "0-30": "#10b981",
  "31-60": "#f59e0b",
  "61-90": "#f97316",
  "90+": "#ef4444",
};

type FilterTab = "all" | "submitted" | "processing" | "action_required";

const TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "submitted", label: "Submitted" },
  { value: "processing", label: "Processing" },
  { value: "action_required", label: "Action Required" },
];

const HEAD_CLASS = "text-[11px] font-medium uppercase tracking-[0.14em] text-subtle-foreground";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function PaymentsPage() {
  const [summary, setSummary] = useState<PaymentSummaryResponse | null>(null);
  const [loads, setLoads] = useState<LoadSummary[]>([]);
  const [fetchedAt, setFetchedAt] = useState(0);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback((signal?: AbortSignal) => {
    Promise.all([
      getPaymentSummary(),
      getLoads({ payment_status: "submitted,processing,action_required", limit: LOAD_LIMIT }),
    ])
      .then(([s, l]) => {
        if (signal?.aborted) return;
        setSummary(s);
        setLoads(l);
        setFetchedAt(Date.now());
        setError(null);
      })
      .catch(() => {
        if (!signal?.aborted) setError("Couldn't load payment data. Check your connection and try again.");
      })
      .finally(() => {
        if (!signal?.aborted) setLoading(false);
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  function retry() {
    setLoading(true);
    fetchData();
  }

  if (loading) return <PageSkeleton />;

  const header = (
    <PageHeader title="Payments" description="Track submitted loads and what you're still owed." />
  );

  if (!summary) {
    return (
      <div className="space-y-6">
        {header}
        <ErrorBanner message={error ?? "Couldn't load payment data."} onRetry={retry} />
      </div>
    );
  }

  const filteredLoads = filter === "all" ? loads : loads.filter((l) => l.payment_status === filter);
  const agingTotal = summary.aging_buckets.reduce((sum, b) => sum + b.total_amount, 0);
  const avgDays = summary.avg_days_to_payment;

  return (
    <div className="space-y-6">
      {header}

      {error ? <ErrorBanner message={error} onRetry={retry} /> : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Outstanding" value={formatCurrency(summary.total_outstanding)} icon={DollarSign} />
        <StatCard
          label="Action Required"
          value={summary.action_required_count}
          icon={AlertTriangle}
          detail="Loads a broker flagged"
        />
        <StatCard
          label="Avg Days to Pay"
          value={avgDays !== null ? `${Math.round(avgDays)}d` : "—"}
          icon={Clock}
          detail="From submission to paid"
        />
        <StatCard label="Paid Last 30 Days" value={formatCurrency(summary.total_paid_30d)} icon={TrendingUp} />
      </div>

      {agingTotal > 0 ? (
        <Card className="rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated-1)] ring-0">
          <CardHeader className="px-5 pt-1">
            <CardTitle className="text-base font-medium text-foreground">Aging</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-5">
            <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
              {summary.aging_buckets.map((bucket) =>
                bucket.total_amount > 0 ? (
                  <div
                    key={bucket.label}
                    style={{
                      width: `${(bucket.total_amount / agingTotal) * 100}%`,
                      backgroundColor: AGING_COLORS[bucket.label] ?? "#94a3b8",
                    }}
                  />
                ) : null
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              {summary.aging_buckets.map((bucket) => (
                <div key={bucket.label} className="flex items-start gap-2">
                  <span
                    className="mt-1.5 size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: AGING_COLORS[bucket.label] ?? "#94a3b8" }}
                  />
                  <div>
                    <p className="text-xs text-subtle-foreground">{bucket.label} days</p>
                    <p className="text-sm font-medium text-foreground tabular-nums">
                      {formatCurrency(bucket.total_amount)}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        · {bucket.count} {bucket.count === 1 ? "load" : "loads"}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === tab.value
                ? "bg-[var(--brand-cyan-dim)] text-[var(--brand-link)]"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loads.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Nothing awaiting payment"
          description="When you submit a load's billing packet, it shows up here until the broker pays."
          actionLabel="Go to loads"
          actionHref="/loads"
        />
      ) : filteredLoads.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No loads in this status"
          description="Try another filter, or choose All to see every load awaiting payment."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-elevated-1)]">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={HEAD_CLASS}>Load #</TableHead>
                <TableHead className={`${HEAD_CLASS} hidden md:table-cell`}>Broker</TableHead>
                <TableHead className={`${HEAD_CLASS} text-right`}>Amount</TableHead>
                <TableHead className={`${HEAD_CLASS} hidden text-right sm:table-cell`}>Days out</TableHead>
                <TableHead className={HEAD_CLASS}>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLoads.map((load) => {
                const days = load.submitted_at
                  ? Math.max(0, Math.floor((fetchedAt - new Date(load.submitted_at).getTime()) / DAY_MS))
                  : null;
                return (
                  <TableRow key={load.id} className="group h-11">
                    <TableCell>
                      <Link
                        href={`/loads/${load.id}`}
                        className="font-mono text-[13px] font-medium text-foreground transition-colors group-hover:text-[var(--brand-link)]"
                      >
                        {load.load_number || load.id.slice(0, 8)}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-[13px] text-foreground md:table-cell">
                      {load.broker_name || "—"}
                    </TableCell>
                    <TableCell className="text-right text-[13px] font-medium text-foreground tabular-nums">
                      {load.current_total !== null ? formatCurrency(load.current_total) : "—"}
                    </TableCell>
                    <TableCell className="hidden text-right text-[13px] text-subtle-foreground tabular-nums sm:table-cell">
                      {days !== null ? `${days}d` : "—"}
                    </TableCell>
                    <TableCell>
                      <PaymentStatusChip status={load.payment_status} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {loads.length === LOAD_LIMIT ? (
        <p className="text-xs text-subtle-foreground">
          Showing the {LOAD_LIMIT} most recent loads awaiting payment. Totals above include every load.
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Gauge,
  DollarSign,
  Truck,
  Users,
  Route,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { FleetStatCard } from "@/components/cost-per-mile/fleet-stat-card";
import { CpmBarChart } from "@/components/cost-per-mile/cpm-bar-chart";
import { ExpenseDonutChart } from "@/components/cost-per-mile/expense-donut-chart";
import { getFleetOverview, getCpmSummary } from "@/lib/api-cpm";
import type { FleetOverview, CpmSummaryResponse } from "@/types/cost-per-mile";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

export default function CostPerMilePage() {
  const [overview, setOverview] = useState<FleetOverview | null>(null);
  const [truckSummary, setTruckSummary] =
    useState<CpmSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ov, ts] = await Promise.all([
          getFleetOverview(),
          getCpmSummary({ group_by: "truck" }),
        ]);
        setOverview(ov);
        setTruckSummary(ts);
      } catch {
        // handled by api client
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Cost Per Mile"
        description="Fleet-wide cost analytics and expense tracking."
      />

      {overview && (
        <>
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <FleetStatCard
              label="Avg Cost/Mile"
              value={`$${overview.avg_cost_per_mile.toFixed(2)}`}
              icon={Gauge}
              accent="blue"
            />
            <FleetStatCard
              label="Revenue/Mile"
              value={`$${overview.avg_revenue_per_mile.toFixed(2)}`}
              icon={TrendingUp}
              accent="green"
            />
            <FleetStatCard
              label="Profit/Mile"
              value={`$${overview.avg_profit_per_mile.toFixed(2)}`}
              icon={DollarSign}
              accent={overview.avg_profit_per_mile > 0 ? "green" : "red"}
            />
            <FleetStatCard
              label="Total Miles"
              value={formatNumber(overview.total_miles)}
              icon={Route}
              detail={`${formatNumber(overview.total_empty_miles)} empty`}
              accent="blue"
            />
            <FleetStatCard
              label="Trucks"
              value={overview.truck_count}
              icon={Truck}
              accent="blue"
              href="/cost-per-mile/trucks"
            />
            <FleetStatCard
              label="Drivers"
              value={overview.driver_count}
              icon={Users}
              accent="blue"
              href="/cost-per-mile/drivers"
            />
          </div>

          {/* Charts row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {truckSummary && (
              <CpmBarChart
                rows={truckSummary.rows}
                fleetAvgCpm={truckSummary.fleet_avg_cpm}
                title="Cost Per Mile by Truck"
              />
            )}
            <ExpenseDonutChart
              breakdown={overview.expense_breakdown}
              totalExpenses={overview.total_expenses}
            />
          </div>

          {/* Summary numbers */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/8 bg-[linear-gradient(180deg,rgba(0,191,255,0.06)_0%,rgba(12,26,46,0.95)_28%)] p-6 shadow-[var(--shadow-elevated-1)]">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Total Revenue
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground tabular-nums">
                {formatCurrency(overview.total_revenue)}
              </p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-[linear-gradient(180deg,rgba(0,191,255,0.06)_0%,rgba(12,26,46,0.95)_28%)] p-6 shadow-[var(--shadow-elevated-1)]">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Total Expenses
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground tabular-nums">
                {formatCurrency(overview.total_expenses)}
              </p>
            </div>
            <div className="rounded-3xl border border-white/8 bg-[linear-gradient(180deg,rgba(0,191,255,0.06)_0%,rgba(12,26,46,0.95)_28%)] p-6 shadow-[var(--shadow-elevated-1)]">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Completed Trips
              </p>
              <p className="mt-2 text-2xl font-semibold text-foreground tabular-nums">
                {overview.trip_count}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  DollarSign,
  AlertTriangle,
  Gauge,
  Route,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
import { ReceivablesCard } from "@/components/dashboard/receivables-card";
import { ComplianceCard } from "@/components/dashboard/compliance-card";
import { BolTable } from "@/components/bols/bol-table";
import { useAuth } from "@/lib/auth";
import {
  getDashboardStats,
  getAdminStats,
  getBols,
} from "@/lib/api";
import type { DashboardStats, AdminStats, BOL } from "@/types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [carrierStats, setCarrierStats] = useState<DashboardStats | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [recentBols, setRecentBols] = useState<BOL[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    async function load() {
      try {
        const [bols] = await Promise.all([
          getBols({ limit: 5 }),
          isAdmin
            ? getAdminStats().then(setAdminStats)
            : getDashboardStats().then(setCarrierStats),
        ]);
        setRecentBols(bols);
      } catch {
        // errors handled by api client
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAdmin]);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-8">
      <PageHeader
        title={isAdmin ? "Admin Overview" : "Dashboard"}
        description={
          isAdmin
            ? "System-wide metrics across all tenants."
            : `Welcome back, ${user?.name?.split(" ")[0]}.`
        }
      />

      {/* Stats grid */}
      {isAdmin && adminStats ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Active Clients"
            value={adminStats.active_tenants}
            icon={FileText}
            detail={`${adminStats.total_tenants} total`}
          />
          <StatCard
            label="Total BOLs"
            value={adminStats.total_bols}
            icon={FileText}
            detail={`${adminStats.bols_this_week} this week`}
          />
          <StatCard
            label="Outstanding"
            value={formatCurrency(adminStats.total_revenue_outstanding)}
            icon={DollarSign}
          />
          <StatCard
            label="Collected"
            value={formatCurrency(adminStats.total_revenue_collected)}
            icon={DollarSign}
          />
        </div>
      ) : carrierStats ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total BOLs"
              value={carrierStats.bols_total}
              icon={FileText}
              detail={`${carrierStats.bols_this_week} this week`}
              href="/bols"
            />
            <StatCard
              label="Pending Review"
              value={carrierStats.bols_pending_review}
              icon={AlertTriangle}
              detail="BOLs waiting on you"
              href="/bols"
            />
            <StatCard
              label="Fleet CPM"
              value={`$${carrierStats.fleet_avg_cpm.toFixed(2)}`}
              icon={Gauge}
              detail={`${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(carrierStats.fleet_total_miles)} miles`}
              href="/cost-per-mile"
            />
            <StatCard
              label="Fleet Expenses"
              value={formatCurrency(carrierStats.fleet_total_expenses)}
              icon={Route}
              href="/cost-per-mile/expenses"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <ReceivablesCard
                outstanding={carrierStats.total_outstanding}
                collected={carrierStats.total_collected}
                invoicesSent={carrierStats.invoices_sent}
                invoicesPaid={carrierStats.invoices_paid}
                invoicesOverdue={carrierStats.invoices_overdue}
              />
            </div>
            <div className="lg:col-span-2">
              <ComplianceCard
                total={carrierStats.compliance_total}
                expiringSoon={carrierStats.compliance_expiring_soon}
                expired={carrierStats.compliance_expired}
              />
            </div>
          </div>
        </>
      ) : null}

      {/* Recent BOLs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-medium tracking-[-0.01em] text-foreground">Recent BOLs</h2>
          <Link href="/bols" className="text-xs font-medium text-[var(--brand-link)] hover:underline">
            View all
          </Link>
        </div>
        <BolTable bols={recentBols} />
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Receipt,
  DollarSign,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { StatCard } from "@/components/dashboard/stat-card";
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
    <div className="space-y-10">
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total BOLs"
            value={carrierStats.bols_total}
            icon={FileText}
            detail={`${carrierStats.bols_this_week} this week`}
          />
          <StatCard
            label="Pending Review"
            value={carrierStats.bols_pending_review}
            icon={AlertTriangle}
          />
          <StatCard
            label="Invoices Sent"
            value={carrierStats.invoices_sent}
            icon={Receipt}
            detail={`${carrierStats.invoices_overdue} overdue`}
          />
          <StatCard
            label="Outstanding"
            value={formatCurrency(carrierStats.total_outstanding)}
            icon={DollarSign}
            detail={`${formatCurrency(carrierStats.total_collected)} collected`}
          />
          <StatCard
            label="Compliance"
            value={carrierStats.compliance_total}
            icon={ShieldCheck}
            detail={
              carrierStats.compliance_expired > 0
                ? `${carrierStats.compliance_expired} expired, ${carrierStats.compliance_expiring_soon} expiring`
                : carrierStats.compliance_expiring_soon > 0
                  ? `${carrierStats.compliance_expiring_soon} expiring soon`
                  : "All current"
            }
          />
        </div>
      ) : null}

      {/* Recent BOLs */}
      <div className="space-y-4">
        <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-slate-900">Recent BOLs</h2>
        <BolTable bols={recentBols} />
      </div>
    </div>
  );
}

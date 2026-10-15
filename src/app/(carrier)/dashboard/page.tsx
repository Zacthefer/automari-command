"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Receipt,
  DollarSign,
  AlertTriangle,
  ShieldCheck,
  Gauge,
  Route,
  Truck,
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
  getTenant,
  createMyPortalSession,
} from "@/lib/api";
import type { DashboardStats, AdminStats, BOL, Tenant } from "@/types";

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
  const [tenant, setTenant] = useState<Tenant | null>(null);
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
        // Load tenant for billing banner (carrier only)
        if (!isAdmin && user?.tenant_id) {
          getTenant(user.tenant_id).then(setTenant).catch(() => {});
        }
      } catch {
        // errors handled by api client
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAdmin, user?.tenant_id]);

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

      {/* Billing banner for past_due */}
      {!isAdmin && tenant?.subscription_status === "past_due" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>
              Your payment didn&apos;t go through. Update your payment method to
              avoid interruption.
            </span>
          </div>
          <button
            onClick={async () => {
              try {
                const result = await createMyPortalSession();
                window.open(result.portal_url, "_blank");
              } catch {
                // silently fail
              }
            }}
            className="flex-shrink-0 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-700 transition-colors"
          >
            Update Payment
          </button>
        </div>
      )}

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
            href="/bols"
          />
          <StatCard
            label="Pending Review"
            value={carrierStats.bols_pending_review}
            icon={AlertTriangle}
            href="/bols"
          />
          <StatCard
            label="Invoices Sent"
            value={carrierStats.invoices_sent}
            icon={Receipt}
            detail={`${carrierStats.invoices_overdue} overdue`}
            href="/invoices"
          />
          <StatCard
            label="Outstanding"
            value={formatCurrency(carrierStats.total_outstanding)}
            icon={DollarSign}
            detail={`${formatCurrency(carrierStats.total_collected)} collected`}
            href="/invoices"
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
            href="/compliance"
          />
          <StatCard
            label="Fleet CPM"
            value={`$${carrierStats.fleet_avg_cpm.toFixed(2)}`}
            icon={Gauge}
            detail={`${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(carrierStats.fleet_total_miles)} miles`}
            href="/cost-per-mile"
          />
          <StatCard
            label="Loads Submitted"
            value={carrierStats.loads_submitted}
            icon={Truck}
            detail={
              carrierStats.loads_action_required > 0
                ? `${carrierStats.loads_action_required} action required`
                : undefined
            }
            href="/payments"
          />
          <StatCard
            label="Fleet Expenses"
            value={formatCurrency(carrierStats.fleet_total_expenses)}
            icon={Route}
            href="/cost-per-mile/expenses"
          />
        </div>
      ) : null}

      {/* Day 1 getting started */}
      {!isAdmin &&
        carrierStats &&
        carrierStats.bols_total === 0 &&
        carrierStats.invoices_total === 0 && (
          <div className="rounded-lg border border-[var(--brand-cyan)]/20 bg-[var(--brand-cyan-dim)] p-6">
            <h3 className="text-sm font-semibold text-foreground">
              Get started in 3 steps
            </h3>
            <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand-cyan)]/20 text-xs font-bold text-[var(--brand-cyan)]">
                  1
                </span>
                <span>
                  <strong className="text-foreground">Upload a rate confirmation</strong>{" "}
                  — we extract broker, amounts, and load details automatically.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand-cyan)]/20 text-xs font-bold text-[var(--brand-cyan)]">
                  2
                </span>
                <span>
                  <strong className="text-foreground">Attach your BOL / POD</strong>{" "}
                  — upload or have your driver text a photo. The invoice generates automatically.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand-cyan)]/20 text-xs font-bold text-[var(--brand-cyan)]">
                  3
                </span>
                <span>
                  <strong className="text-foreground">Submit billing packet</strong>{" "}
                  — send the full packet to your broker and track payment status.
                </span>
              </li>
            </ol>
          </div>
        )}

      {/* Recent BOLs */}
      <div className="space-y-4">
        <h2 className="text-[17px] font-semibold tracking-[-0.01em] text-foreground">Recent BOLs</h2>
        {recentBols.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
            No BOLs yet. Upload a rate confirmation to get started.
          </div>
        ) : (
          <BolTable bols={recentBols} />
        )}
      </div>
    </div>
  );
}

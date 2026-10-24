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
import { openCarrierBillingPortal } from "@/lib/billing";
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
  getMyBillingStatus,
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
  const [pastDue, setPastDue] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);

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
        if (!isAdmin) {
          // Optional banner: billing may not be configured yet, so failures are ignored
          getMyBillingStatus()
            .then((b) => setPastDue(b.subscription_status === "past_due"))
            .catch(() => {});
        }
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

      {!isAdmin && pastDue ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <span>
              Your last payment didn&apos;t go through. Update your payment method to keep Automari running.
              {billingError ? <span className="mt-1 block text-xs text-amber-800">{billingError}</span> : null}
            </span>
          </div>
          <button
            onClick={async () => setBillingError(await openCarrierBillingPortal())}
            className="shrink-0 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-800"
          >
            Update payment
          </button>
        </div>
      ) : null}

      {!isAdmin && carrierStats && carrierStats.bols_total === 0 && carrierStats.invoices_total === 0 ? (
        <div className="rounded-2xl border border-[var(--brand-cyan)]/25 bg-[var(--brand-cyan-dim)] p-6">
          <h2 className="text-base font-medium text-foreground">Get started in 3 steps</h2>
          <ol className="mt-4 space-y-3 text-sm text-subtle-foreground">
            {[
              ["Upload a rate confirmation", "we pull the broker, amounts, and load details for you."],
              ["Upload a photo of the BOL", "once it's attached, the invoice is created automatically."],
              ["Submit the billing packet", "send it to your broker and track payment on the Payments page."],
            ].map(([title, body], i) => (
              <li key={title} className="flex items-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-medium text-[var(--brand-link)] ring-1 ring-[var(--brand-cyan)]/30">
                  {i + 1}
                </span>
                <span>
                  <span className="font-medium text-foreground">{title}</span> — {body}
                </span>
              </li>
            ))}
          </ol>
          <Link
            href="/loads"
            className="mt-5 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Upload a rate confirmation
          </Link>
        </div>
      ) : null}

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
                awaitingAmount={
                  carrierStats.aging_0_30 +
                  carrierStats.aging_31_60 +
                  carrierStats.aging_61_90 +
                  carrierStats.aging_90_plus
                }
                awaitingCount={carrierStats.loads_submitted + carrierStats.loads_action_required}
                actionRequired={carrierStats.loads_action_required}
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

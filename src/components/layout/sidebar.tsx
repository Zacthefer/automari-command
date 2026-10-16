"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Receipt,
  ShieldCheck,
  Building2,
  LogOut,
  TrendingUp,
  UserPlus,
  FlaskConical,
  Truck,
  CreditCard,
  DollarSign,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { createMyPortalSession } from "@/lib/api";
import { isTestSectionEnabled } from "@/lib/test-section";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/layout/brand-mark";

const carrierNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Loads", href: "/loads", icon: Truck },
  { label: "BOLs", href: "/bols", icon: FileText },
  { label: "Invoices", href: "/invoices", icon: Receipt },
  { label: "Payments", href: "/payments", icon: DollarSign },
  { label: "Compliance", href: "/compliance", icon: ShieldCheck },
  { label: "Recruiting", href: "/recruiting", icon: UserPlus },
  { label: "Cost Per Mile", href: "/cost-per-mile", icon: TrendingUp },
];

const testNav = isTestSectionEnabled()
  ? [{ label: "Test Section", href: "/admin/test", icon: FlaskConical }]
  : [];

const adminNav = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/admin/clients", icon: Building2 },
  ...testNav,
  { label: "Loads", href: "/loads", icon: Truck },
  { label: "BOLs", href: "/bols", icon: FileText },
  { label: "Invoices", href: "/invoices", icon: Receipt },
  { label: "Compliance", href: "/compliance", icon: ShieldCheck },
  { label: "Recruiting", href: "/recruiting", icon: UserPlus },
  { label: "Cost Per Mile", href: "/cost-per-mile", icon: TrendingUp },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems =
    user?.role === "admin" ? adminNav : [...carrierNav, ...testNav];

  async function openBillingPortal() {
    const tab = window.open("", "_blank");
    try {
      const result = await createMyPortalSession();
      if (tab) tab.location.href = result.portal_url;
    } catch {
      if (tab) tab.close();
    }
  }

  return (
    <>
      <div className="flex h-[4.25rem] items-center px-5 border-b border-[var(--sidebar-border)]">
        <BrandMark size="sm" textClassName="text-white" />
      </div>

      <nav className="flex-1 space-y-0.5 py-4 pr-3 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group relative flex items-center gap-3 border-l-2 py-2.5 pl-[22px] pr-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "border-[var(--brand-cyan)] bg-[var(--brand-cyan-dim)] text-white"
                  : "border-transparent text-[#8aa3bd] hover:bg-white/[0.03] hover:text-white"
              )}
            >
              <item.icon
                className={cn(
                  "h-[18px] w-[18px] transition-colors",
                  isActive ? "text-[var(--brand-cyan)]" : "text-[#6f8aaa] group-hover:text-[#a8c4de]"
                )}
              />
              {item.label}
            </Link>
          );
        })}
        {user?.role === "carrier" && (
          <button
            onClick={openBillingPortal}
            className="group relative flex w-full items-center gap-3 border-l-2 border-transparent py-2.5 pl-[22px] pr-3 text-sm font-medium text-[#8aa3bd] transition-all duration-200 hover:bg-white/[0.03] hover:text-white"
          >
            <CreditCard className="h-[18px] w-[18px] text-[#6f8aaa] transition-colors group-hover:text-[#a8c4de]" />
            Billing
          </button>
        )}
      </nav>

      <div className="border-t border-[var(--sidebar-border)] p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {user?.name}
            </p>
            <p className="truncate text-xs text-[#6f8aaa]">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="ml-1 rounded-lg p-2 text-[#6f8aaa] transition-colors hover:bg-white/5 hover:text-[var(--brand-cyan)]"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden md:flex w-64 flex-col border-r border-[var(--sidebar-border)] bg-[var(--brand-navy)] text-[var(--sidebar-foreground)]">
      <SidebarContent />
    </aside>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="md:hidden rounded-lg p-2 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Drawer */}
      <div
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-hidden={!open}
        inert={!open ? true : undefined}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[var(--brand-navy)] text-[var(--sidebar-foreground)] transition-transform duration-300 md:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-5 rounded-lg p-1 text-[#6f8aaa] hover:text-white transition-colors"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent onNavigate={() => setOpen(false)} />
      </div>
    </>
  );
}

"use client";

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
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { isTestSectionEnabled } from "@/lib/test-section";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/layout/brand-mark";

const carrierNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Loads", href: "/loads", icon: Truck },
  { label: "BOLs", href: "/bols", icon: FileText },
  { label: "Invoices", href: "/invoices", icon: Receipt },
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

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems =
    user?.role === "admin" ? adminNav : [...carrierNav, ...testNav];

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-[var(--sidebar-border)] bg-white text-[var(--sidebar-foreground)]">
      <div className="flex h-[4.25rem] items-center px-5 border-b border-[var(--sidebar-border)]">
        <BrandMark size="sm" textClassName="text-[var(--foreground)]" />
      </div>

      <nav className="flex-1 space-y-0.5 py-4 pr-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 border-l-2 py-2.5 pl-[22px] pr-3 text-sm font-medium transition-all duration-200",
                isActive
                  ? "border-[var(--primary)] bg-[var(--secondary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]"
              )}
            >
              <item.icon
                className={cn(
                  "h-[18px] w-[18px] transition-colors",
                  isActive ? "text-[var(--primary)]" : "text-[var(--muted-foreground)] group-hover:text-[var(--primary)]"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--sidebar-border)] p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--foreground)]">
              {user?.name}
            </p>
            <p className="truncate text-xs text-[var(--muted-foreground)]">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="ml-1 rounded-lg p-2 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--primary)]"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

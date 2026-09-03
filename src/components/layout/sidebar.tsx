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
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/layout/brand-mark";

const carrierNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "BOLs", href: "/bols", icon: FileText },
  { label: "Invoices", href: "/invoices", icon: Receipt },
  { label: "Compliance", href: "/compliance", icon: ShieldCheck },
  { label: "Recruiting", href: "/recruiting", icon: UserPlus },
  { label: "Cost Per Mile", href: "/cost-per-mile", icon: TrendingUp },
];

const adminNav = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/admin/clients", icon: Building2 },
  { label: "BOLs", href: "/bols", icon: FileText },
  { label: "Invoices", href: "/invoices", icon: Receipt },
  { label: "Compliance", href: "/compliance", icon: ShieldCheck },
  { label: "Recruiting", href: "/recruiting", icon: UserPlus },
  { label: "Cost Per Mile", href: "/cost-per-mile", icon: TrendingUp },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = user?.role === "admin" ? adminNav : carrierNav;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-[var(--sidebar-border)] bg-[var(--brand-navy)] text-[var(--sidebar-foreground)]">
      <div className="flex h-[4.25rem] items-center px-5 border-b border-[var(--sidebar-border)]">
        <BrandMark size="sm" textClassName="text-white" />
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
    </aside>
  );
}

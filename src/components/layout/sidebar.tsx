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
  Command,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const carrierNav = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "BOLs", href: "/bols", icon: FileText },
  { label: "Invoices", href: "/invoices", icon: Receipt },
  { label: "Compliance", href: "/compliance", icon: ShieldCheck },
];

const adminNav = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Clients", href: "/admin/clients", icon: Building2 },
  { label: "BOLs", href: "/bols", icon: FileText },
  { label: "Invoices", href: "/invoices", icon: Receipt },
  { label: "Compliance", href: "/compliance", icon: ShieldCheck },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = user?.role === "admin" ? adminNav : carrierNav;

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-[#0f172a] text-white">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2.5 px-6 border-b border-white/10">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
          <Command className="h-4 w-4 text-white" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight">
          Automari
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 py-4 pr-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 border-l-2 py-2.5 pl-[22px] pr-3 text-sm font-medium transition-colors",
                isActive
                  ? "border-blue-600 text-white"
                  : "border-transparent text-slate-400 hover:text-white"
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {user?.name}
            </p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="ml-2 rounded-lg p-2 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

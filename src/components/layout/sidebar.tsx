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
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { isTestSectionEnabled } from "@/lib/test-section";
import { BrandMark } from "@/components/layout/brand-mark";
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

type NavItem = { label: string; href: string; icon: LucideIcon };
type NavGroup = { label: string; items: NavItem[] };

const operations: NavGroup = {
  label: "Operations",
  items: [
    { label: "Loads", href: "/loads", icon: Truck },
    { label: "BOLs", href: "/bols", icon: FileText },
    { label: "Compliance", href: "/compliance", icon: ShieldCheck },
    { label: "Recruiting", href: "/recruiting", icon: UserPlus },
  ],
};

const finance: NavGroup = {
  label: "Finance",
  items: [
    { label: "Invoices", href: "/invoices", icon: Receipt },
    { label: "Cost Per Mile", href: "/cost-per-mile", icon: TrendingUp },
  ],
};

const testItems: NavItem[] = isTestSectionEnabled()
  ? [{ label: "Test Section", href: "/admin/test", icon: FlaskConical }]
  : [];

const carrierNav: NavGroup[] = [
  { label: "Overview", items: [{ label: "Dashboard", href: "/dashboard", icon: LayoutDashboard }] },
  operations,
  finance,
  ...(testItems.length ? [{ label: "Dev", items: testItems }] : []),
];

const adminNav: NavGroup[] = [
  {
    label: "Admin",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "Clients", href: "/admin/clients", icon: Building2 },
      ...testItems,
    ],
  },
  operations,
  finance,
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();

  const groups = user?.role === "admin" ? adminNav : carrierNav;

  // The mobile drawer stays open after a link is tapped unless we close it
  const closeMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <SidebarRoot collapsible="icon">
      <SidebarHeader className="h-[4.25rem] justify-center border-b border-sidebar-border px-3 group-data-[collapsible=icon]:px-2">
        <Link href="/dashboard" onClick={closeMobile} className="flex items-center">
          <BrandMark size="sm" textClassName="text-white group-data-[collapsible=icon]:hidden" />
        </Link>
      </SidebarHeader>

      <SidebarContent className="py-2">
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="uppercase tracking-[0.12em] text-[var(--sidebar-muted)]">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/dashboard" && pathname.startsWith(item.href));
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.label}
                        render={<Link href={item.href} onClick={closeMobile} />}
                        className="h-9 text-[var(--sidebar-subtle)] hover:text-white data-active:sidebar-item-active data-active:bg-transparent data-active:text-white [&[data-active]>svg]:text-[var(--brand-cyan)]"
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="min-w-0 px-2 pt-1 group-data-[collapsible=icon]:hidden">
          <p className="truncate text-sm font-medium text-white">{user?.name}</p>
          <p className="truncate text-xs text-[var(--sidebar-muted)]">{user?.email}</p>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={logout}
              className="text-[var(--sidebar-subtle)] hover:text-[var(--brand-cyan)]"
            >
              <LogOut />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </SidebarRoot>
  );
}

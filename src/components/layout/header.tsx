"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { LogOut, User } from "lucide-react";

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  admin: "Admin",
  clients: "Clients",
  test: "Test Section",
  loads: "Loads",
  bols: "BOLs",
  invoices: "Invoices",
  compliance: "Compliance",
  recruiting: "Recruiting",
  "cost-per-mile": "Cost Per Mile",
  trucks: "Trucks",
  drivers: "Drivers",
  trips: "Trips",
  expenses: "Expenses",
  new: "New",
};

// "/admin" has no page of its own, so only these crumbs are clickable
const LINKABLE = new Set([
  "/dashboard",
  "/admin/clients",
  "/admin/test",
  "/loads",
  "/bols",
  "/invoices",
  "/compliance",
  "/recruiting",
  "/cost-per-mile",
]);

function crumbsFor(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((segment, index) => ({
    href: "/" + segments.slice(0, index + 1).join("/"),
    // Anything not in the map is a record id (/loads/<id>)
    label: SEGMENT_LABELS[segment] ?? "Details",
  }));
}

export function Header() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  const crumbs = crumbsFor(pathname);

  return (
    <header className="sticky top-0 z-20 flex h-[4.25rem] items-center justify-between gap-4 border-b border-border/80 bg-background/70 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarTrigger className="text-subtle-foreground hover:text-foreground [&_svg]:size-5!" />
        <Separator orientation="vertical" className="hidden h-4! data-vertical:self-center sm:block" />
        <Breadcrumb className="hidden min-w-0 sm:block">
          <BreadcrumbList>
            {crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1;
              return (
                <Fragment key={crumb.href}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    ) : LINKABLE.has(crumb.href) ? (
                      <Link href={crumb.href} className="transition-colors hover:text-foreground">
                        {crumb.label}
                      </Link>
                    ) : (
                      <span>{crumb.label}</span>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-3 rounded-xl border border-transparent px-2 py-1.5 transition-colors hover:border-border hover:bg-muted">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-foreground">{user?.name}</p>
            <p className="text-xs text-muted-foreground">{user?.tenant_name || "Admin"}</p>
          </div>
          <Avatar className="h-8 w-8 bg-[var(--brand-cyan)] text-[#001018] ring-2 ring-[var(--brand-cyan)]/25">
            <AvatarFallback className="bg-[var(--brand-cyan)] text-xs font-medium text-[#001018]">
              {initials}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 border-border bg-popover">
          <DropdownMenuItem disabled>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-border" />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

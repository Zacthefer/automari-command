"use client";

import { useState } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

// ui/sidebar.tsx saves the expanded/collapsed choice in this cookie but never reads it back
function savedSidebarOpen() {
  if (typeof document === "undefined") return true;
  return !document.cookie.split("; ").includes("sidebar_state=false");
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [defaultOpen] = useState(savedSidebarOpen);

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={defaultOpen}>
        <Sidebar />
        <SidebarInset>
          {/* Soft brand-cyan glow behind the top of every page; fixed height so long pages don't stretch it */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-[520px] [background:radial-gradient(125%_125%_at_50%_-50%,#d6f3ff_40%,transparent_100%)]"
          />
          <Header />
          <div className="relative px-4 py-6 sm:px-6 lg:px-10 lg:py-10">{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

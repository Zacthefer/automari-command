"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import { isTestSectionEnabled } from "@/lib/test-section";
import { AppShell } from "@/components/layout/app-shell";
import { PageSkeleton } from "@/components/layout/page-skeleton";

function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const devTest =
    isTestSectionEnabled() && pathname.startsWith("/admin/test");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
    if (!loading && user && user.role !== "admin" && !devTest) {
      router.replace("/dashboard");
    }
  }, [loading, user, router, devTest]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageSkeleton />
      </div>
    );
  }

  if (!user || (user.role !== "admin" && !devTest)) return null;

  return <AppShell>{children}</AppShell>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <AdminGate>{children}</AdminGate>
    </AuthProvider>
  );
}

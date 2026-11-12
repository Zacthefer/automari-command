"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { ClientTable } from "@/components/admin/client-table";
import { getTenants } from "@/lib/api";
import type { Tenant } from "@/types";
import { BlurFadeStack } from "@/components/ui/blur-fade";

export default function ClientsPage() {
  const [clients, setClients] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTenants({ limit: 50 })
      .then(setClients)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <BlurFadeStack className="space-y-6">
      <PageHeader
        title="Clients"
        description="Manage carrier companies on the platform."
        action={
          <Link href="/admin/clients/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Client
            </Button>
          </Link>
        }
      />
      <ClientTable clients={clients} />
    </BlurFadeStack>
  );
}

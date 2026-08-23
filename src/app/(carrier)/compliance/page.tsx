"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { ComplianceTable } from "@/components/compliance/compliance-table";
import { Button } from "@/components/ui/button";
import { getComplianceDocuments } from "@/lib/api";
import type { ComplianceDocument } from "@/types";

export default function CompliancePage() {
  const [documents, setDocuments] = useState<ComplianceDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getComplianceDocuments({ limit: 50 })
      .then(setDocuments)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance"
        description="Track document expirations and stay audit-ready."
        action={
          <Link href="/compliance/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Document
            </Button>
          </Link>
        }
      />
      <ComplianceTable documents={documents} />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { EmptyState } from "@/components/layout/empty-state";
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
      {documents.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="No compliance documents"
          description="Add your first document to stay on top of expirations. Track CDLs, insurance, medical cards, and more."
          actionLabel="Add Document"
          actionHref="/compliance/new"
        />
      ) : (
        <ComplianceTable documents={documents} />
      )}
    </div>
  );
}

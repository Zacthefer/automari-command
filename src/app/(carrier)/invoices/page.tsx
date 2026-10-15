"use client";

import { useEffect, useState } from "react";
import { Receipt } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { EmptyState } from "@/components/layout/empty-state";
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { getInvoices } from "@/lib/api";
import type { Invoice } from "@/types";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getInvoices({ limit: 50 })
      .then(setInvoices)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="All invoices generated from processed BOLs."
      />
      {invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description="Invoices are generated automatically when you upload a rate confirmation and attach a BOL. Start by uploading a rate con."
          actionLabel="Go to Loads"
          actionHref="/loads"
        />
      ) : (
        <InvoiceTable invoices={invoices} />
      )}
    </div>
  );
}

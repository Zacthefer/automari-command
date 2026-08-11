"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
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
      <InvoiceTable invoices={invoices} />
    </div>
  );
}

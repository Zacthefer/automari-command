"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { BolTable } from "@/components/bols/bol-table";
import { getBols } from "@/lib/api";
import type { BOL } from "@/types";

export default function BolsPage() {
  const [bols, setBols] = useState<BOL[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBols({ limit: 50 })
      .then(setBols)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bills of Lading"
        description="All BOLs submitted by drivers via text message."
      />
      <BolTable bols={bols} />
    </div>
  );
}

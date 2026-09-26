"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { LoadsTable } from "@/components/loads/loads-table";
import { Button } from "@/components/ui/button";
import { getLoads, uploadRateCon } from "@/lib/api";
import type { LoadSummary } from "@/types";

const STATUS_TABS = [
  { label: "All", value: "" },
  { label: "Needs Review", value: "needs_review" },
  { label: "Booked", value: "booked" },
  { label: "Delivered", value: "delivered" },
  { label: "Invoiced", value: "invoiced" },
  { label: "Paid", value: "paid" },
] as const;

export default function LoadsPage() {
  const [loads, setLoads] = useState<LoadSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function fetchLoads(status?: string) {
    getLoads({ status: status || undefined, limit: 50 })
      .then(setLoads)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchLoads(statusFilter); }, [statusFilter]);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const result = await uploadRateCon(file);
      if (result.duplicate) {
        setError("This rate confirmation has already been uploaded.");
      }
      fetchLoads(statusFilter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  if (loading && loads.length === 0) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loads"
        description="Rate confirmations, billing packets, and payment tracking."
        action={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Processing…" : "Upload Rate Con"}
            </Button>
          </>
        }
      />

      <div className="flex gap-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === tab.value
                ? "bg-[var(--brand-cyan-dim)] text-[var(--brand-cyan)]"
                : "text-[#8aa3bd] hover:bg-white/[0.03] hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <LoadsTable loads={loads} />
    </div>
  );
}

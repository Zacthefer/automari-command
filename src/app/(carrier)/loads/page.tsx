"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Truck } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { EmptyState } from "@/components/layout/empty-state";
import { ErrorBanner } from "@/components/layout/error-banner";
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

  const fetchLoads = useCallback(
    (status?: string, signal?: AbortSignal) => {
      getLoads({ status: status || undefined, limit: 50 })
        .then((data) => {
          if (!signal?.aborted) setLoads(data);
        })
        .catch((err) => {
          if (!signal?.aborted)
            setError(err instanceof Error ? err.message : "Failed to load");
        })
        .finally(() => {
          if (!signal?.aborted) setLoading(false);
        });
    },
    []
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchLoads(statusFilter, controller.signal);
    return () => controller.abort();
  }, [statusFilter, fetchLoads]);

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
        <ErrorBanner message={error} onRetry={() => { setError(null); fetchLoads(statusFilter); }} />
      )}

      {loads.length === 0 && !error ? (
        statusFilter ? (
          <EmptyState
            icon={Truck}
            title="No loads match this filter"
            description={`No loads with status "${statusFilter}" found.`}
            actionLabel="Clear Filter"
            onAction={() => setStatusFilter("")}
          />
        ) : (
          <EmptyState
            icon={Truck}
            title="No loads yet"
            description="Upload your first rate confirmation to get started. We'll extract the details and create a load automatically."
            actionLabel="Upload Rate Con"
            onAction={() => fileInputRef.current?.click()}
          />
        )
      ) : (
        <LoadsTable loads={loads} />
      )}
    </div>
  );
}

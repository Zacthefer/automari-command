"use client";

import { useEffect, useRef, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { BolTable } from "@/components/bols/bol-table";
import { Button } from "@/components/ui/button";
import { getBols, uploadBol } from "@/lib/api";
import type { BOL } from "@/types";

export default function BolsPage() {
  const [bols, setBols] = useState<BOL[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function loadBols() {
    getBols({ limit: 50 })
      .then(setBols)
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadBols();
  }, []);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      await uploadBol(file);
      loadBols();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  if (loading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bills of Lading"
        description="All BOLs submitted by drivers via text message or upload."
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
              {uploading ? "Processing…" : "Upload BOL"}
            </Button>
          </>
        }
      />
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <BolTable bols={bols} />
    </div>
  );
}

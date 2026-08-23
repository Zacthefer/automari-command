"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createComplianceDocument } from "@/lib/api";

const documentTypes = [
  { value: "cdl", label: "CDL" },
  { value: "medical_card", label: "Medical Card" },
  { value: "insurance_liability", label: "Liability Insurance" },
  { value: "insurance_cargo", label: "Cargo Insurance" },
  { value: "vehicle_registration", label: "Vehicle Registration" },
  { value: "ifta_permit", label: "IFTA Permit" },
  { value: "drug_test", label: "Drug Test" },
  { value: "mvr_report", label: "MVR Report" },
  { value: "other", label: "Other" },
];

const holderTypes = [
  { value: "driver", label: "Driver" },
  { value: "vehicle", label: "Vehicle" },
  { value: "company", label: "Company" },
];

export default function NewComplianceDocumentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    try {
      await createComplianceDocument({
        document_type: form.get("document_type") as string,
        holder_type: form.get("holder_type") as string,
        holder_name: form.get("holder_name") as string,
        document_number: (form.get("document_number") as string) || undefined,
        issuing_authority:
          (form.get("issuing_authority") as string) || undefined,
        effective_date: (form.get("effective_date") as string)
          ? new Date(form.get("effective_date") as string).toISOString()
          : undefined,
        expiration_date: (form.get("expiration_date") as string)
          ? new Date(form.get("expiration_date") as string).toISOString()
          : undefined,
        notes: (form.get("notes") as string) || undefined,
      });
      router.push("/compliance");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add document"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/compliance"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Add Compliance Document
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Document Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="document_type">Document Type</Label>
              <select
                id="document_type"
                name="document_type"
                required
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
              >
                <option value="">Select type...</option>
                {documentTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="document_number">Document Number</Label>
              <Input
                id="document_number"
                name="document_number"
                placeholder="e.g. GL-2026-48291"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="holder_type">Holder Type</Label>
              <select
                id="holder_type"
                name="holder_type"
                required
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
              >
                <option value="">Select type...</option>
                {holderTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="holder_name">Holder Name</Label>
              <Input
                id="holder_name"
                name="holder_name"
                required
                placeholder="e.g. Marcus Johnson or Unit #1042"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="issuing_authority">Issuing Authority</Label>
              <Input
                id="issuing_authority"
                name="issuing_authority"
                placeholder="e.g. Florida DHSMV"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Dates & Notes</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="effective_date">Effective Date</Label>
              <Input
                id="effective_date"
                name="effective_date"
                type="date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiration_date">Expiration Date</Label>
              <Input
                id="expiration_date"
                name="expiration_date"
                type="date"
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                name="notes"
                placeholder="Optional notes about this document"
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={loading}>
            {loading ? "Adding..." : "Add Document"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

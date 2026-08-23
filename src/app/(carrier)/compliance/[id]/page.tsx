"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Pencil,
  X,
  Save,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { ComplianceStatusChip } from "@/components/compliance/compliance-status-chip";
import {
  getComplianceDocument,
  updateComplianceDocument,
  deleteComplianceDocument,
} from "@/lib/api";
import type { ComplianceDocument } from "@/types";

const documentTypeLabels: Record<string, string> = {
  cdl: "CDL",
  medical_card: "Medical Card",
  insurance_liability: "Liability Insurance",
  insurance_cargo: "Cargo Insurance",
  vehicle_registration: "Vehicle Registration",
  ifta_permit: "IFTA Permit",
  drug_test: "Drug Test",
  mvr_report: "MVR Report",
  other: "Other",
};

const holderTypeLabels: Record<string, string> = {
  driver: "Driver",
  vehicle: "Vehicle",
  company: "Company",
};

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm text-slate-900">{value || "—"}</p>
    </div>
  );
}

export default function ComplianceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [doc, setDoc] = useState<ComplianceDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  // Edit form state
  const [editHolderName, setEditHolderName] = useState("");
  const [editDocNumber, setEditDocNumber] = useState("");
  const [editAuthority, setEditAuthority] = useState("");
  const [editEffective, setEditEffective] = useState("");
  const [editExpiration, setEditExpiration] = useState("");
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    if (params.id) {
      getComplianceDocument(params.id as string)
        .then(setDoc)
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  function startEditing() {
    if (!doc) return;
    setEditHolderName(doc.holder_name);
    setEditDocNumber(doc.document_number || "");
    setEditAuthority(doc.issuing_authority || "");
    setEditEffective(
      doc.effective_date
        ? new Date(doc.effective_date).toISOString().split("T")[0]
        : ""
    );
    setEditExpiration(
      doc.expiration_date
        ? new Date(doc.expiration_date).toISOString().split("T")[0]
        : ""
    );
    setEditNotes(doc.notes || "");
    setEditing(true);
  }

  async function handleSave() {
    if (!doc) return;
    setActionLoading(true);
    try {
      const updated = await updateComplianceDocument(doc.id, {
        holder_name: editHolderName,
        document_number: editDocNumber || undefined,
        issuing_authority: editAuthority || undefined,
        effective_date: editEffective
          ? new Date(editEffective).toISOString()
          : undefined,
        expiration_date: editExpiration
          ? new Date(editExpiration).toISOString()
          : undefined,
        notes: editNotes || undefined,
      });
      setDoc(updated);
      setEditing(false);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!doc) return;
    if (!confirm("Are you sure you want to delete this document?")) return;
    setActionLoading(true);
    try {
      await deleteComplianceDocument(doc.id);
      router.push("/compliance");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <PageSkeleton />;
  if (!doc) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-500">Document not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/compliance"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {documentTypeLabels[doc.document_type] || doc.document_type}
            </h1>
            <ComplianceStatusChip status={doc.status} />
          </div>
        </div>
        <div className="flex gap-2">
          {!editing && (
            <Button onClick={startEditing} variant="outline">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          <Button
            onClick={handleDelete}
            disabled={actionLoading}
            variant="outline"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Document Details Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Document Details</CardTitle>
            {editing && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditing(false)}
                  disabled={actionLoading}
                >
                  <X className="mr-1 h-3 w-3" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={actionLoading}
                >
                  <Save className="mr-1 h-3 w-3" />
                  Save
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="holder_name">Holder Name</Label>
                    <Input
                      id="holder_name"
                      value={editHolderName}
                      onChange={(e) => setEditHolderName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="doc_number">Document Number</Label>
                    <Input
                      id="doc_number"
                      value={editDocNumber}
                      onChange={(e) => setEditDocNumber(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="authority">Issuing Authority</Label>
                  <Input
                    id="authority"
                    value={editAuthority}
                    onChange={(e) => setEditAuthority(e.target.value)}
                  />
                </div>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="effective">Effective Date</Label>
                    <Input
                      id="effective"
                      type="date"
                      value={editEffective}
                      onChange={(e) => setEditEffective(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expiration">Expiration Date</Label>
                    <Input
                      id="expiration"
                      type="date"
                      value={editExpiration}
                      onChange={(e) => setEditExpiration(e.target.value)}
                    />
                  </div>
                </div>
                <Separator />
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Holder" value={doc.holder_name} />
                  <Field
                    label="Holder Type"
                    value={holderTypeLabels[doc.holder_type] || doc.holder_type}
                  />
                  <Field label="Document Number" value={doc.document_number} />
                  <Field
                    label="Issuing Authority"
                    value={doc.issuing_authority}
                  />
                </div>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Effective Date"
                    value={
                      doc.effective_date
                        ? format(
                            new Date(doc.effective_date),
                            "MMM d, yyyy"
                          )
                        : null
                    }
                  />
                  <Field
                    label="Expiration Date"
                    value={
                      doc.expiration_date
                        ? format(
                            new Date(doc.expiration_date),
                            "MMM d, yyyy"
                          )
                        : "No expiration"
                    }
                  />
                </div>
                {doc.notes && (
                  <>
                    <Separator />
                    <Field label="Notes" value={doc.notes} />
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Timeline Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Record Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              label="Created"
              value={format(
                new Date(doc.created_at),
                "MMM d, yyyy h:mm a"
              )}
            />
            <Field
              label="Last Updated"
              value={format(
                new Date(doc.updated_at),
                "MMM d, yyyy h:mm a"
              )}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

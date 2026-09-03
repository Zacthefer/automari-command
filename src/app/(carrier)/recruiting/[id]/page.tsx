"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Pencil, Save, Trash2, X } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { ApplicantStatusChip } from "@/components/recruiting/applicant-status-chip";
import {
  deleteApplicant,
  getApplicant,
  updateApplicant,
} from "@/lib/api";
import type { Applicant, ApplicantStatus } from "@/types";

const statusOptions: { value: ApplicantStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "screening", label: "Screening" },
  { value: "qualified", label: "Qualified" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
];

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
      <p className="mt-0.5 text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}

export default function ApplicantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editStatus, setEditStatus] = useState<ApplicantStatus>("new");
  const [editNotes, setEditNotes] = useState("");

  useEffect(() => {
    if (params.id) {
      getApplicant(params.id as string)
        .then(setApplicant)
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  function startEditing() {
    if (!applicant) return;
    setEditName(applicant.name);
    setEditPhone(applicant.phone || "");
    setEditEmail(applicant.email || "");
    setEditStatus(applicant.status);
    setEditNotes(applicant.notes || "");
    setEditing(true);
  }

  async function handleSave() {
    if (!applicant) return;
    setActionLoading(true);
    try {
      const updated = await updateApplicant(applicant.id, {
        name: editName,
        phone: editPhone || undefined,
        email: editEmail || undefined,
        status: editStatus,
        notes: editNotes || undefined,
      });
      setApplicant(updated);
      setEditing(false);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!applicant) return;
    if (!confirm("Are you sure you want to delete this applicant?")) return;
    setActionLoading(true);
    try {
      await deleteApplicant(applicant.id);
      router.push("/recruiting");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <PageSkeleton />;
  if (!applicant) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-slate-500">Applicant not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/recruiting"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {applicant.name}
            </h1>
            <ApplicantStatusChip status={applicant.status} />
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
            className="text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Applicant Details</CardTitle>
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
                <Button size="sm" onClick={handleSave} disabled={actionLoading}>
                  <Save className="mr-1 h-3 w-3" />
                  Save
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(e.target.value as ApplicantStatus)
                    }
                    className="flex h-10 w-full rounded-md border border-white/10 bg-[#07111f]/70 px-3 text-foreground py-2 text-sm"
                  >
                    {statusOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
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
                  <Field label="Phone" value={applicant.phone} />
                  <Field label="Email" value={applicant.email} />
                  <Field
                    label="CDL Class"
                    value={
                      applicant.cdl_class
                        ? `Class ${applicant.cdl_class}`
                        : null
                    }
                  />
                  <Field
                    label="Experience"
                    value={
                      applicant.years_experience != null
                        ? `${applicant.years_experience} years`
                        : null
                    }
                  />
                  <Field
                    label="Endorsements"
                    value={
                      applicant.endorsements.length > 0
                        ? applicant.endorsements.join(", ")
                        : null
                    }
                  />
                  <Field label="Availability" value={applicant.availability} />
                </div>
                <Separator />
                <Field
                  label="Preferred Routes"
                  value={applicant.preferred_routes}
                />
                <Field
                  label="Accident History"
                  value={applicant.accident_history}
                />
                {applicant.notes && (
                  <>
                    <Separator />
                    <Field label="Notes" value={applicant.notes} />
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Record Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              label="Applied"
              value={format(
                new Date(applicant.created_at),
                "MMM d, yyyy h:mm a"
              )}
            />
            <Field
              label="Last Updated"
              value={format(
                new Date(applicant.updated_at),
                "MMM d, yyyy h:mm a"
              )}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

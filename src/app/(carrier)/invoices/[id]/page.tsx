"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Send,
  CheckCircle,
  Download,
  Pencil,
  X,
  Save,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { InvoiceStatusChip } from "@/components/invoices/invoice-status-chip";
import {
  getInvoice,
  sendInvoice,
  markInvoicePaid,
  updateInvoice,
  downloadInvoicePdf,
  getBol,
  getBolImageUrl,
} from "@/lib/api";
import type { Invoice, BOL } from "@/types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

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

export default function InvoiceDetailPage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [bol, setBol] = useState<BOL | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editing, setEditing] = useState(false);

  // Edit form state
  const [editRate, setEditRate] = useState("");
  const [editAccessorials, setEditAccessorials] = useState("");
  const [editBillToName, setEditBillToName] = useState("");
  const [editBillToEmail, setEditBillToEmail] = useState("");
  const [editNetDays, setEditNetDays] = useState("");

  useEffect(() => {
    if (params.id) {
      getInvoice(params.id as string)
        .then((inv) => {
          setInvoice(inv);
          // Load the associated BOL for image display
          getBol(inv.bol_id)
            .then(setBol)
            .catch(() => {}); // BOL fetch is non-critical
        })
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  function startEditing() {
    if (!invoice) return;
    setEditRate(String(invoice.rate));
    setEditAccessorials(String(invoice.accessorial_charges));
    setEditBillToName(invoice.bill_to_name);
    setEditBillToEmail(invoice.bill_to_email);
    setEditNetDays(String(invoice.net_days));
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
  }

  async function handleSave() {
    if (!invoice) return;
    setActionLoading(true);
    try {
      const updated = await updateInvoice(invoice.id, {
        rate: parseFloat(editRate) || 0,
        accessorial_charges: parseFloat(editAccessorials) || 0,
        bill_to_name: editBillToName,
        bill_to_email: editBillToEmail,
        net_days: parseInt(editNetDays) || 30,
      });
      setInvoice(updated);
      setEditing(false);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSend() {
    if (!invoice) return;
    setActionLoading(true);
    try {
      const updated = await sendInvoice(invoice.id);
      setInvoice(updated);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMarkPaid() {
    if (!invoice) return;
    setActionLoading(true);
    try {
      const updated = await markInvoicePaid(invoice.id);
      setInvoice(updated);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDownloadPdf() {
    if (!invoice) return;
    setActionLoading(true);
    try {
      const blob = await downloadInvoicePdf(invoice.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoice.invoice_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <PageSkeleton />;
  if (!invoice) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-500">Invoice not found.</p>
      </div>
    );
  }

  const canEdit = invoice.status === "draft";
  const canSend = invoice.status === "draft";
  const canMarkPaid = ["sent", "viewed", "overdue"].includes(invoice.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/invoices"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {invoice.invoice_number}
            </h1>
            <InvoiceStatusChip status={invoice.status} />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleDownloadPdf}
            disabled={actionLoading}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          {canEdit && !editing && (
            <Button onClick={startEditing} variant="outline">
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {canSend && !editing && (
            <Button onClick={handleSend} disabled={actionLoading}>
              <Send className="mr-2 h-4 w-4" />
              Send Invoice
            </Button>
          )}
          {canMarkPaid && (
            <Button
              onClick={handleMarkPaid}
              disabled={actionLoading}
              variant="outline"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Mark Paid
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Invoice Details Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Invoice Details</CardTitle>
            {editing && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={cancelEditing}
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
                    <Label htmlFor="bill_to_name">Bill To</Label>
                    <Input
                      id="bill_to_name"
                      value={editBillToName}
                      onChange={(e) => setEditBillToName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="bill_to_email">Bill To Email</Label>
                    <Input
                      id="bill_to_email"
                      type="email"
                      value={editBillToEmail}
                      onChange={(e) => setEditBillToEmail(e.target.value)}
                    />
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="rate">Rate ($)</Label>
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      value={editRate}
                      onChange={(e) => setEditRate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="accessorials">Accessorials ($)</Label>
                    <Input
                      id="accessorials"
                      type="number"
                      step="0.01"
                      value={editAccessorials}
                      onChange={(e) => setEditAccessorials(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Estimated Total</Label>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {formatCurrency(
                        (parseFloat(editRate) || 0) +
                          (parseFloat(editAccessorials) || 0)
                      )}
                    </p>
                  </div>
                </div>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="net_days">Net Days</Label>
                    <Input
                      id="net_days"
                      type="number"
                      value={editNetDays}
                      onChange={(e) => setEditNetDays(e.target.value)}
                    />
                  </div>
                  <Field label="PRO Number" value={invoice.pro_number} />
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Bill To" value={invoice.bill_to_name} />
                  <Field label="Bill To Email" value={invoice.bill_to_email} />
                  <Field label="PRO Number" value={invoice.pro_number} />
                  <Field label="Commodity" value={invoice.commodity} />
                </div>
                <Separator />
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Rate" value={formatCurrency(invoice.rate)} />
                  <Field
                    label="Accessorials"
                    value={formatCurrency(invoice.accessorial_charges)}
                  />
                  <div>
                    <p className="text-xs font-medium text-slate-500">Total</p>
                    <p className="mt-0.5 text-lg font-semibold text-slate-900">
                      {formatCurrency(invoice.total_amount)}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Timeline Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field
              label="Created"
              value={format(
                new Date(invoice.created_at),
                "MMM d, yyyy h:mm a"
              )}
            />
            <Field
              label="Due Date"
              value={
                invoice.due_date
                  ? format(new Date(invoice.due_date), "MMM d, yyyy")
                  : null
              }
            />
            <Field label="Net Days" value={`Net ${invoice.net_days}`} />
            <Separator />
            <Field
              label="Sent At"
              value={
                invoice.sent_at
                  ? format(new Date(invoice.sent_at), "MMM d, yyyy h:mm a")
                  : null
              }
            />
            <Field
              label="Paid At"
              value={
                invoice.paid_at
                  ? format(new Date(invoice.paid_at), "MMM d, yyyy h:mm a")
                  : null
              }
            />
          </CardContent>
        </Card>

        {/* BOL Image Card */}
        {bol && (
          <Card className="border-slate-200 shadow-sm lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Source BOL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 mb-4">
                <Field label="Shipper" value={bol.shipper_name} />
                <Field label="Consignee" value={bol.consignee_name} />
                <Field label="PRO Number" value={bol.pro_number} />
                <Field
                  label="Confidence"
                  value={
                    bol.confidence !== null
                      ? `${(bol.confidence * 100).toFixed(0)}%`
                      : null
                  }
                />
              </div>
              {bol.has_image && (
                <>
                  <Separator className="mb-4" />
                  <div className="rounded-lg border border-slate-200 overflow-hidden bg-slate-50 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getBolImageUrl(bol.id)}
                      alt="Bill of Lading"
                      className="max-h-[500px] w-auto mx-auto rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                </>
              )}
              {!bol.has_image && (
                <p className="text-sm text-slate-400 italic">
                  No image stored for this BOL.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

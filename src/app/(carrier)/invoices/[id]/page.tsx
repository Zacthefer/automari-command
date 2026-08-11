"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Send, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { InvoiceStatusChip } from "@/components/invoices/invoice-status-chip";
import { getInvoice, sendInvoice, markInvoicePaid } from "@/lib/api";
import type { Invoice } from "@/types";

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
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (params.id) {
      getInvoice(params.id as string)
        .then(setInvoice)
        .finally(() => setLoading(false));
    }
  }, [params.id]);

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

  if (loading) return <PageSkeleton />;
  if (!invoice) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-500">Invoice not found.</p>
      </div>
    );
  }

  const canSend = invoice.status === "draft";
  const canMarkPaid = ["sent", "viewed", "overdue"].includes(invoice.status);

  return (
    <div className="space-y-6">
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
          {canSend && (
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
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

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
      </div>
    </div>
  );
}

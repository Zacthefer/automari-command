"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  Send,
  CheckCircle,
  AlertTriangle,
  FileText,
  Clock,
  CircleDot,
  Circle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { LoadStatusChip } from "@/components/loads/load-status-chip";
import { PaymentStatusChip } from "@/components/loads/payment-status-chip";
import {
  getLoad,
  reviewRateCon,
  rejectRateCon,
  submitForPayment,
  updatePaymentStatus,
  downloadRateConFile,
} from "@/lib/api";
import type {
  LoadDetail,
  PipelineStep,
  RateConfirmation,
  PaymentPath,
} from "@/types";

function formatCurrency(amount: number | null): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

function safeFormatDate(
  value: string | null | undefined,
  fmt: string = "MMM d, yyyy"
): string {
  if (!value) return "—";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "—";
  return format(date, fmt);
}

function renderEventDetail(detail: Record<string, unknown>): React.ReactNode {
  const entries = Object.entries(detail);
  if (entries.length === 0) return null;
  return (
    <div className="mt-0.5 space-y-0.5">
      {entries.map(([key, val]) => (
        <p key={key} className="text-xs text-[#8aa3bd]">
          <span className="text-[#6f8aaa]">{key.replace(/_/g, " ")}:</span>{" "}
          {typeof val === "object" && val !== null
            ? JSON.stringify(val)
            : String(val ?? "—")}
        </p>
      ))}
    </div>
  );
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
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c5d8eb]">
        {label}
      </p>
      <p className="mt-0.5 text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}

function PipelineViz({ steps }: { steps: PipelineStep[] }) {
  const stateIcon = (state: string) => {
    switch (state) {
      case "done":
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
      case "ready":
        return <CircleDot className="h-4 w-4 text-[var(--brand-cyan)]" />;
      case "attention":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default:
        return <Circle className="h-4 w-4 text-[#6f8aaa]" />;
    }
  };

  const stateLabel: Record<string, string> = {
    done: "Complete",
    ready: "Ready",
    attention: "Needs Attention",
    pending: "Pending",
  };

  return (
    <div className="flex items-start gap-2">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-start">
          <div className="flex flex-col items-center gap-1 min-w-[80px]">
            {stateIcon(step.state)}
            <span className="text-[11px] font-medium text-center leading-tight text-[#d7e8f8]">
              {step.key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
            <span className="text-[10px] text-[#8aa3bd]">
              {step.detail || stateLabel[step.state] || step.state}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className="mt-2 h-px w-6 bg-[#3a4f66] flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

function RateConCard({
  rc,
  isCurrent,
  onApprove,
  onReject,
  loading,
}: {
  rc: RateConfirmation;
  isCurrent: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState(isCurrent);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const statusColor: Record<string, string> = {
    approved: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
    review: "bg-amber-50 text-amber-700 hover:bg-amber-50",
    superseded: "bg-slate-100 text-slate-700 hover:bg-slate-100",
    rejected: "bg-red-50 text-red-700 hover:bg-red-50",
    failed: "bg-red-50 text-red-700 hover:bg-red-50",
  };

  return (
    <div className="rounded-lg border border-white/10 bg-card/50 p-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[#8aa3bd]">v{rc.version}</span>
          <Badge
            variant="secondary"
            className={statusColor[rc.status] || "bg-slate-100 text-slate-700"}
          >
            {rc.status}
          </Badge>
          {isCurrent && (
            <span className="text-[10px] font-medium text-[var(--brand-cyan)]">
              CURRENT
            </span>
          )}
          {rc.total_rate != null && (
            <span className="font-mono text-sm text-foreground">
              {formatCurrency(rc.total_rate)}
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-[#6f8aaa]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[#6f8aaa]" />
        )}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Broker" value={rc.broker_name} />
            <Field label="Load #" value={rc.load_number} />
            <Field label="Origin" value={rc.origin} />
            <Field label="Destination" value={rc.destination} />
            <Field label="Linehaul" value={formatCurrency(rc.linehaul)} />
            <Field
              label="Fuel Surcharge"
              value={formatCurrency(rc.fuel_surcharge)}
            />
            <Field label="Equipment" value={rc.equipment_type} />
            <Field label="Payment Terms" value={rc.payment_terms} />
          </div>

          {rc.accessorial_items.length > 0 && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c5d8eb] mb-2">
                  Accessorials
                </p>
                {rc.accessorial_items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-[#d7e8f8]">
                      {item.description || item.type || "Accessorial"}
                    </span>
                    <span className="font-mono text-foreground tabular-nums">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {rc.confidence != null && (
            <div className="flex items-center gap-2 text-xs text-[#8aa3bd]">
              <span>AI Confidence: {(rc.confidence * 100).toFixed(0)}%</span>
              {rc.review_reasons && rc.review_reasons.length > 0 && (
                <span>· {rc.review_reasons.join(", ")}</span>
              )}
            </div>
          )}

          {rc.revision_reason && (
            <div className="text-xs text-amber-600">
              Revision: {rc.revision_reason}
            </div>
          )}

          {rc.filename && (
            <>
              <button
                onClick={async () => {
                  setDownloadError(null);
                  const tab = window.open("about:blank", "_blank");
                  if (tab) {
                    tab.document.title = "Loading file…";
                    tab.document.body.style.cssText =
                      "margin:0;display:flex;align-items:center;justify-content:center;height:100vh;font-family:system-ui;color:#64748b;background:#f8fafc";
                    tab.document.body.textContent = "Loading file…";
                  }
                  try {
                    const blob = await downloadRateConFile(rc.id);
                    const url = URL.createObjectURL(blob);
                    if (tab && !tab.closed) {
                      tab.location.href = url;
                    } else {
                      // Popup was blocked — fall back to download
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = rc.filename || "rate-con";
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }
                    setTimeout(() => URL.revokeObjectURL(url), 60000);
                  } catch (err) {
                    if (tab && !tab.closed) tab.close();
                    setDownloadError(
                      err instanceof Error ? err.message : "Failed to download file"
                    );
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--brand-cyan)] hover:underline"
              >
                <FileText className="h-3 w-3" />
                {rc.filename}
              </button>
              {downloadError && (
                <p className="text-xs text-red-600 mt-1">{downloadError}</p>
              )}
            </>
          )}

          {rc.status === "review" && (
            <div className="flex gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => onApprove(rc.id)}
                disabled={loading}
              >
                <CheckCircle className="mr-1 h-3 w-3" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(rc.id)}
                disabled={loading}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function LoadDetailPage() {
  const params = useParams();
  const [load, setLoad] = useState<LoadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submitPath, setSubmitPath] = useState<PaymentPath>("direct");
  const [submitRef, setSubmitRef] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentStatusValue, setPaymentStatusValue] = useState("processing");
  const [paymentRef, setPaymentRef] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  const fetchLoad = useCallback(() => {
    if (!params.id) return;
    getLoad(params.id as string)
      .then(setLoad)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load")
      )
      .finally(() => setLoading(false));
  }, [params.id]);

  useEffect(() => {
    fetchLoad();
  }, [fetchLoad]);

  async function handleApproveRateCon(rcId: string) {
    setActionLoading(true);
    setError(null);
    try {
      await reviewRateCon(rcId, { approve: true });
      fetchLoad();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRejectRateCon(rcId: string) {
    setActionLoading(true);
    setError(null);
    try {
      await rejectRateCon(rcId);
      fetchLoad();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSubmitPayment() {
    if (!load) return;
    setActionLoading(true);
    setError(null);
    try {
      const updated = await submitForPayment(load.id, {
        path: submitPath,
        external_reference: submitRef || undefined,
      });
      setLoad(updated);
      setShowSubmitForm(false);
      setSubmitRef("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleUpdatePaymentStatus() {
    if (!load) return;
    setActionLoading(true);
    setError(null);
    try {
      const updated = await updatePaymentStatus(load.id, {
        status: paymentStatusValue,
        external_reference: paymentRef || undefined,
        note: paymentNote || undefined,
        paid_at:
          paymentStatusValue === "paid" ? new Date().toISOString() : undefined,
      });
      setLoad(updated);
      setShowPaymentForm(false);
      setPaymentRef("");
      setPaymentNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <PageSkeleton />;
  if (!load) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-[#d5e6f6]">Load not found.</p>
      </div>
    );
  }

  const canSubmit = load.payment_status === "ready_to_submit";
  const canUpdatePayment = ["submitted", "processing", "action_required"].includes(
    load.payment_status
  );
  const currentRc = load.rate_confirmations.find(
    (rc) => rc.status === "approved"
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/loads"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {load.load_number || `Load ${load.id.slice(0, 8)}`}
            </h1>
            <LoadStatusChip status={load.status} />
            <PaymentStatusChip status={load.payment_status} />
          </div>
        </div>
        <div className="flex gap-2">
          {canSubmit && (
            <Button
              onClick={() => setShowSubmitForm(!showSubmitForm)}
              disabled={actionLoading}
            >
              <Send className="mr-2 h-4 w-4" />
              Submit for Payment
            </Button>
          )}
          {canUpdatePayment && (
            <Button
              variant="outline"
              onClick={() => setShowPaymentForm(!showPaymentForm)}
              disabled={actionLoading}
            >
              <Clock className="mr-2 h-4 w-4" />
              Update Payment
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Pipeline */}
      {load.pipeline.length > 0 && (
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="pt-5 pb-4">
            <PipelineViz steps={load.pipeline} />
          </CardContent>
        </Card>
      )}

      {/* Submit Payment Form */}
      {showSubmitForm && (
        <Card className="border-[var(--brand-cyan)]/30 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Submit for Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Payment Path</Label>
              <div className="mt-2 flex gap-2">
                {(["direct", "quickpay", "factoring"] as const).map((path) => (
                  <button
                    key={path}
                    onClick={() => setSubmitPath(path)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      submitPath === path
                        ? "bg-[var(--brand-cyan-dim)] text-[var(--brand-cyan)]"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {path === "direct"
                      ? "Direct Invoice"
                      : path === "quickpay"
                        ? "QuickPay"
                        : "Factoring"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="submit_ref">
                Reference Number (optional)
              </Label>
              <Input
                id="submit_ref"
                value={submitRef}
                onChange={(e) => setSubmitRef(e.target.value)}
                placeholder="Invoice #, portal confirmation, etc."
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSubmitPayment} disabled={actionLoading}>
                Submit
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowSubmitForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Update Payment Status Form */}
      {showPaymentForm && (
        <Card className="border-[var(--brand-cyan)]/30 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Update Payment Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Status</Label>
              <div className="mt-2 flex gap-2">
                {[
                  { value: "processing", label: "Processing" },
                  { value: "paid", label: "Paid" },
                  { value: "action_required", label: "Action Required" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setPaymentStatusValue(opt.value)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      paymentStatusValue === opt.value
                        ? "bg-[var(--brand-cyan-dim)] text-[var(--brand-cyan)]"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="payment_ref">Reference (optional)</Label>
              <Input
                id="payment_ref"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                placeholder="Check #, ACH ref, etc."
              />
            </div>
            <div>
              <Label htmlFor="payment_note">Note (optional)</Label>
              <Input
                id="payment_note"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Additional context"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleUpdatePaymentStatus}
                disabled={actionLoading}
              >
                Update
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowPaymentForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Load Details */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Load Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Broker" value={load.broker_name} />
              <Field label="Broker Email" value={load.broker_email} />
              <Field label="Origin" value={load.origin} />
              <Field label="Destination" value={load.destination} />
              <Field
                label="Pickup"
                value={safeFormatDate(load.pickup_at)}
              />
              <Field
                label="Delivery"
                value={safeFormatDate(load.delivery_at)}
              />
              <Field label="Equipment" value={load.equipment_type} />
              <Field label="Commodity" value={load.commodity} />
              <Field
                label="Weight"
                value={load.weight ? `${load.weight.toLocaleString()} lbs` : null}
              />
              <Field label="Payment Terms" value={load.payment_terms} />
            </div>
            {load.special_instructions && (
              <>
                <Separator />
                <Field
                  label="Special Instructions"
                  value={load.special_instructions}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c5d8eb]">
                  Current Total
                </p>
                <p className="mt-0.5 text-lg font-semibold text-foreground">
                  {formatCurrency(load.current_total)}
                </p>
              </div>
              {load.original_total != null &&
                load.original_total !== load.current_total && (
                  <Field
                    label="Original Total"
                    value={formatCurrency(load.original_total)}
                  />
                )}
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Payment Path" value={load.payment_path} />
              <Field label="Provider" value={load.payment_provider} />
              <Field
                label="External Ref"
                value={load.payment_external_ref}
              />
              {load.aging_days != null && (
                <Field label="Aging" value={`${load.aging_days} days`} />
              )}
            </div>
            {load.payment_note && (
              <>
                <Separator />
                <Field label="Payment Note" value={load.payment_note} />
              </>
            )}
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Submitted"
                value={safeFormatDate(load.submitted_at, "MMM d, yyyy h:mm a")}
              />
              <Field
                label="Paid"
                value={safeFormatDate(load.paid_at, "MMM d, yyyy h:mm a")}
              />
            </div>

            {/* Billing Packet Status */}
            {load.packet && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c5d8eb]">
                      Billing Packet
                    </p>
                    <Badge
                      variant="secondary"
                      className={
                        load.packet.complete
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                          : "bg-amber-50 text-amber-700 hover:bg-amber-50"
                      }
                    >
                      {load.packet.complete ? "Complete" : "Incomplete"}
                    </Badge>
                  </div>
                  {load.packet.missing.length > 0 && (
                    <p className="text-xs text-amber-600">
                      Missing: {load.packet.missing.join(", ")}
                    </p>
                  )}
                  {load.packet.documents.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {load.packet.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center gap-2 text-xs text-[#d7e8f8]"
                        >
                          <FileText className="h-3 w-3 text-[#6f8aaa]" />
                          {doc.url ? (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-[var(--brand-cyan)] hover:underline"
                            >
                              {doc.label}
                            </a>
                          ) : (
                            <span>{doc.label}</span>
                          )}
                          <Badge
                            variant="secondary"
                            className="text-[10px] bg-slate-100 text-slate-700 hover:bg-slate-100"
                          >
                            {doc.kind}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Rate Confirmations */}
        <Card className="border-slate-200 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Rate Confirmations</CardTitle>
          </CardHeader>
          <CardContent>
            {load.rate_confirmations.length === 0 ? (
              <p className="text-sm text-[#b7cce0]">
                No rate confirmations yet.
              </p>
            ) : (
              <div className="space-y-2">
                {load.rate_confirmations.map((rc) => (
                  <RateConCard
                    key={rc.id}
                    rc={rc}
                    isCurrent={currentRc?.id === rc.id}
                    onApprove={handleApproveRateCon}
                    onReject={handleRejectRateCon}
                    loading={actionLoading}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        {load.documents.length > 0 && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {load.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-card/50 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-[#6f8aaa]" />
                      <div>
                        <p className="text-sm text-foreground">
                          {doc.filename || doc.kind}
                        </p>
                        <p className="text-xs text-[#8aa3bd]">
                          {doc.kind.toUpperCase()} ·{" "}
                          {safeFormatDate(doc.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audit Log */}
        {load.events.length > 0 && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Activity Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {load.events.map((event) => (
                  <div key={event.id} className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-[#6f8aaa] flex-shrink-0" />
                    <div>
                      <p className="text-sm text-foreground">
                        {event.event_type.replace(/_/g, " ")}
                      </p>
                      {event.detail && renderEventDetail(event.detail)}
                      <p className="text-[11px] text-[#6f8aaa]">
                        {safeFormatDate(event.created_at, "MMM d, yyyy h:mm a")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

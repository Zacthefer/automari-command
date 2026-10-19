"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Copy, CreditCard, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import {
  getTenant,
  getBillingStatus,
  createCheckoutSession,
  createPortalSession,
} from "@/lib/api";
import type { Tenant, BillingStatus } from "@/types";

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c5d8eb]">{label}</p>
      <p className="mt-0.5 text-sm text-foreground">{value || "—"}</p>
    </div>
  );
}

export default function ClientDetailPage() {
  const params = useParams();
  const [client, setClient] = useState<Tenant | null>(null);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [checkoutCopied, setCheckoutCopied] = useState(false);
  const [selectedTier, setSelectedTier] = useState<"core" | "pro" | "elite">("core");
  const [founding, setFounding] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);

  useEffect(() => {
    if (params.id) {
      const id = params.id as string;
      Promise.all([
        getTenant(id).then(setClient),
        getBillingStatus(id).then(setBilling).catch(() => {}),
      ]).finally(() => setLoading(false));
    }
  }, [params.id]);

  function copyApiKey() {
    if (!client) return;
    navigator.clipboard.writeText(client.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleGenerateCheckout() {
    if (!client) return;
    setBillingLoading(true);
    try {
      const result = await createCheckoutSession({
        tenant_id: client.id,
        tier: selectedTier,
        founding,
      });
      await navigator.clipboard.writeText(result.checkout_url);
      setCheckoutCopied(true);
      setTimeout(() => setCheckoutCopied(false), 3000);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create checkout session");
    } finally {
      setBillingLoading(false);
    }
  }

  async function handleOpenPortal() {
    if (!client) return;
    setBillingLoading(true);
    try {
      const result = await createPortalSession(client.id);
      window.open(result.portal_url, "_blank");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to open billing portal");
    } finally {
      setBillingLoading(false);
    }
  }

  if (loading) return <PageSkeleton />;
  if (!client) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-[#d5e6f6]">Client not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/clients"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {client.company_name}
          </h1>
          <Badge
            variant="secondary"
            className={
              client.is_active
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }
          >
            {client.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Contact Name" value={client.contact_name} />
            <Field label="Contact Email" value={client.contact_email} />
            <Field label="Phone" value={client.contact_phone} />
            <Field label="Twilio Phone" value={client.twilio_phone} />
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Billing & Broker</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Default Rate"
              value={
                client.default_rate !== null
                  ? `$${client.default_rate.toFixed(2)}`
                  : null
              }
            />
            <Field label="Billing Email" value={client.billing_email} />
            <Field label="Broker Name" value={client.default_broker_name} />
            <Field label="Broker Email" value={client.default_broker_email} />
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c5d8eb]">Tier</p>
                <div className="mt-1">
                  {billing?.subscription_tier ? (
                    <Badge className="bg-blue-50 text-blue-700 capitalize">
                      {billing.subscription_tier}
                    </Badge>
                  ) : (
                    <span className="text-sm text-slate-400">No subscription</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c5d8eb]">Status</p>
                <div className="mt-1">
                  {billing?.subscription_status ? (
                    <Badge
                      className={
                        billing.subscription_status === "active"
                          ? "bg-emerald-50 text-emerald-700"
                          : billing.subscription_status === "trialing"
                            ? "bg-blue-50 text-blue-700"
                            : billing.subscription_status === "past_due"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-red-50 text-red-700"
                      }
                    >
                      {billing.subscription_status}
                    </Badge>
                  ) : (
                    <span className="text-sm text-slate-400">—</span>
                  )}
                </div>
              </div>
              <Field
                label="Trial End"
                value={
                  billing?.trial_end
                    ? format(new Date(billing.trial_end), "MMM d, yyyy")
                    : null
                }
              />
              <Field
                label="Next Billing"
                value={
                  billing?.current_period_end
                    ? format(new Date(billing.current_period_end), "MMM d, yyyy")
                    : null
                }
              />
            </div>

            <Separator />

            {!billing?.subscription_status || billing.subscription_status === "canceled" ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Generate Payment Link</p>
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500">Tier</label>
                    <select
                      value={selectedTier}
                      onChange={(e) => setSelectedTier(e.target.value as "core" | "pro" | "elite")}
                      className="mt-1 block w-32 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm"
                    >
                      <option value="core">Core — $999</option>
                      <option value="pro">Pro — $1,499</option>
                      <option value="elite">Elite — $2,499</option>
                    </select>
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={founding}
                      onChange={(e) => setFounding(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    Founding Pilot (50% off)
                  </label>
                  <Button
                    size="sm"
                    onClick={handleGenerateCheckout}
                    disabled={billingLoading}
                  >
                    {checkoutCopied
                      ? "Link Copied!"
                      : billingLoading
                        ? "Creating..."
                        : "Generate & Copy Link"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenPortal}
                  disabled={billingLoading}
                >
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                  Open Billing Portal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#c5d8eb]">API Key</p>
              <div className="mt-1 flex items-center gap-2">
                <code className="rounded bg-slate-100 px-3 py-1.5 text-sm font-mono text-slate-700">
                  {client.api_key.slice(0, 12)}{"••••••••"}
                </code>
                <Button variant="outline" size="sm" onClick={copyApiKey}>
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Created"
                value={format(
                  new Date(client.created_at),
                  "MMM d, yyyy h:mm a"
                )}
              />
              <Field
                label="Last Updated"
                value={format(
                  new Date(client.updated_at),
                  "MMM d, yyyy h:mm a"
                )}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

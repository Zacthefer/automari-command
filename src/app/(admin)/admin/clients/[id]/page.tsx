"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { ArrowLeft, Copy } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { PageSkeleton } from "@/components/layout/page-skeleton";
import { getTenant } from "@/lib/api";
import type { Tenant } from "@/types";

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

export default function ClientDetailPage() {
  const params = useParams();
  const [client, setClient] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (params.id) {
      getTenant(params.id as string)
        .then(setClient)
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  function copyApiKey() {
    if (!client) return;
    navigator.clipboard.writeText(client.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return <PageSkeleton />;
  if (!client) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-slate-500">Client not found.</p>
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
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
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
            <CardTitle className="text-base">Integration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-medium text-slate-500">API Key</p>
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

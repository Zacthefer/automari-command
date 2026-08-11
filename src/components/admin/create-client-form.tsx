"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createTenant } from "@/lib/api";

export function CreateClientForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);

    try {
      await createTenant({
        company_name: form.get("company_name") as string,
        contact_name: form.get("contact_name") as string,
        contact_email: form.get("contact_email") as string,
        contact_phone: form.get("contact_phone") as string,
        default_rate: form.get("default_rate")
          ? Number(form.get("default_rate"))
          : undefined,
        billing_email: (form.get("billing_email") as string) || undefined,
        default_broker_name:
          (form.get("default_broker_name") as string) || undefined,
        default_broker_email:
          (form.get("default_broker_email") as string) || undefined,
      });
      router.push("/admin/clients");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Company Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              name="company_name"
              required
              placeholder="Acme Freight LLC"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_phone">Phone</Label>
            <Input
              id="contact_phone"
              name="contact_phone"
              required
              placeholder="+1 555 123 4567"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_name">Contact Name</Label>
            <Input
              id="contact_name"
              name="contact_name"
              required
              placeholder="John Smith"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_email">Contact Email</Label>
            <Input
              id="contact_email"
              name="contact_email"
              type="email"
              required
              placeholder="john@acmefreight.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Billing & Broker</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="default_rate">Default Rate ($)</Label>
            <Input
              id="default_rate"
              name="default_rate"
              type="number"
              step="0.01"
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billing_email">Billing Email</Label>
            <Input
              id="billing_email"
              name="billing_email"
              type="email"
              placeholder="billing@acmefreight.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default_broker_name">Default Broker Name</Label>
            <Input
              id="default_broker_name"
              name="default_broker_name"
              placeholder="XYZ Brokerage"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default_broker_email">Default Broker Email</Label>
            <Input
              id="default_broker_email"
              name="default_broker_email"
              type="email"
              placeholder="dispatch@xyzbrokerage.com"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Client"}
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
  );
}
